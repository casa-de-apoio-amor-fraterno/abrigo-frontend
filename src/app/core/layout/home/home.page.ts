import { Component, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../auth/auth.service';
import { descreverErroHttp } from '../../http/api-error';
import { QuartoService } from '../../../features/quartos/quarto.service';
import { QuartoOcupacao, QuartoOcupante } from '../../../features/quartos/quarto.model';
import { EstadiaService } from '../../../features/estadias/estadia.service';
import { TipoPessoaEstadia, UnidadeTempoEstadia } from '../../../features/estadias/estadia.model';
import { HospitalService } from '../../../features/hospitais/hospital.service';
import { Hospital } from '../../../features/hospitais/hospital.model';
import { AcaoPopoverComponent } from '../../../shared/ui/acao-popover/acao-popover.component';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';

const OPCOES_TIPO_PESSOA: OpcaoFiltroPill[] = [
  { valor: 'Paciente', rotulo: 'Paciente' },
  { valor: 'Acompanhante', rotulo: 'Acompanhante' }
];

const OPCOES_UNIDADE_TEMPO: OpcaoFiltroPill[] = [
  { valor: 'dias', rotulo: 'Dias' },
  { valor: 'noites', rotulo: 'Noites' },
  { valor: 'horas', rotulo: 'Horas' }
];

/** Pré-calcula um palpite de valor+unidade pro tempo de estadia (ver
 * `abrirFinalizar`/`recalcularTempoFinalizar`), não uma medição exata:
 * - Entrada e saída no mesmo dia (ficou menos de 24h) → assume "horas",
 *   contadas a partir do horário real de entrada (`dataEntradaIso` inclui
 *   hora) até agora — não dá pra saber o horário de saída real só com a
 *   data escolhida no campo, então usa o momento em que está finalizando.
 * - Datas diferentes → "dias" (diferença de dias corridos entre as
 *   datas, mínimo 1 — mesmo padrão do dado real observado no legado,
 *   onde estadias curtas quase sempre foram registradas como "1 dia").
 */
function calcularTempoEstadia(
  dataEntradaIso: string,
  dataSaidaIso: string
): { valor: number; unidade: UnidadeTempoEstadia } {
  const mesmoDia = dataEntradaIso.slice(0, 10) === dataSaidaIso.slice(0, 10);
  if (mesmoDia) {
    const entrada = new Date(dataEntradaIso);
    const diffHoras = Math.round((Date.now() - entrada.getTime()) / 3_600_000);
    return { valor: Math.max(diffHoras, 1), unidade: 'horas' };
  }

  const entrada = new Date(`${dataEntradaIso.slice(0, 10)}T00:00:00`);
  const saida = new Date(`${dataSaidaIso.slice(0, 10)}T00:00:00`);
  const diffDias = Math.round((saida.getTime() - entrada.getTime()) / 86_400_000);
  return { valor: Math.max(diffDias, 1), unidade: 'dias' };
}

/** Placeholder puramente visual — não representa uma pessoa/estadia real,
 * só "aqui cabe mais um leito". */
type LeitoVago = { vago: true };

@Component({
  selector: 'app-home-page',
  imports: [
    DatePipe,
    RouterLink,
    AcaoPopoverComponent,
    PessoaAutocompleteComponent,
    FiltroPillsComponent,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  private readonly quartoService = inject(QuartoService);
  private readonly estadiaService = inject(EstadiaService);
  private readonly hospitalService = inject(HospitalService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly quartos = signal<QuartoOcupacao[]>([]);
  protected readonly revisaoAberta = signal<number | null>(null);
  protected readonly hospitais = signal<Hospital[]>([]);

  // Clicar numa cama ocupada abre esse popover pra finalizar a estadia
  // direto da tela Início, sem precisar ir pra edição completa (mesmo
  // componente/estilo do "Finalizar" da busca global).
  protected readonly estadiaFinalizarAberta = signal<number | null>(null);
  protected readonly dataSaidaFinalizar = signal('');
  protected readonly finalizando = signal(false);
  protected readonly erroFinalizar = signal<string | null>(null);

  // Tempo de estadia calculado a partir de data_entrada/data_saida (ver
  // `diasEntre`) — pré-preenchido, mas editável: se o usuário mexer no
  // valor ou na unidade, `tempoEditadoManualmente` trava o recálculo
  // automático pra não sobrescrever a escolha dele ao trocar a data.
  private dataEntradaFinalizar = '';
  protected readonly tempoEstadiaValorFinalizar = signal<number | null>(null);
  protected readonly tempoEstadiaUnidadeFinalizar = signal<UnidadeTempoEstadia>('dias');
  protected readonly opcoesUnidadeTempo = OPCOES_UNIDADE_TEMPO;
  private tempoEditadoManualmente = false;

  // Clicar num leito livre abre esse popover pra criar a estadia ali
  // mesmo — guarda o id do QUARTO (não do "leito", que é só um placeholder
  // visual sem identidade própria, ver `leitosVagos`).
  protected readonly estadiaCriarAberta = signal<number | null>(null);
  protected readonly pessoaNovaEstadia = signal<{ id: number; nome: string } | null>(null);
  protected readonly dataEntradaNovaEstadia = signal('');
  protected readonly tipoPessoaNovaEstadia = signal<TipoPessoaEstadia>('Paciente');
  protected readonly opcoesTipoPessoa = OPCOES_TIPO_PESSOA;
  protected readonly idHospitalNovaEstadia = signal<number | null>(null);
  protected readonly observacaoNovaEstadia = signal('');
  protected readonly criandoEstadia = signal(false);
  protected readonly erroCriarEstadia = signal<string | null>(null);

  constructor() {
    this.carregarOcupacao();
    this.hospitalService.listar().subscribe((hospitais) => this.hospitais.set(hospitais));
  }

  protected leitosVagos(quarto: QuartoOcupacao): LeitoVago[] {
    const vagos = Math.max(quarto.leito - quarto.ocupantes.length, 0);
    return Array.from({ length: vagos }, () => ({ vago: true }));
  }

  protected alternarRevisao(quartoId: number): void {
    this.revisaoAberta.update((atual) => (atual === quartoId ? null : quartoId));
  }

  protected abrirFinalizar(ocupante: QuartoOcupante, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fecharCriarEstadia();
    this.erroFinalizar.set(null);
    this.dataEntradaFinalizar = ocupante.dataEntrada;
    this.tempoEditadoManualmente = false;
    this.dataSaidaFinalizar.set(new Date().toISOString().slice(0, 10));
    this.recalcularTempoFinalizar();
    this.estadiaFinalizarAberta.set(ocupante.idEstadia);
  }

  protected fecharFinalizar(): void {
    this.estadiaFinalizarAberta.set(null);
    this.erroFinalizar.set(null);
  }

  protected alterarDataSaidaFinalizar(dataSaida: string): void {
    this.dataSaidaFinalizar.set(dataSaida);
    this.recalcularTempoFinalizar();
  }

  protected alterarTempoEstadiaValorFinalizar(valor: number | null): void {
    this.tempoEditadoManualmente = true;
    this.tempoEstadiaValorFinalizar.set(valor);
  }

  protected alterarTempoEstadiaUnidadeFinalizar(unidade: UnidadeTempoEstadia): void {
    this.tempoEditadoManualmente = true;
    this.tempoEstadiaUnidadeFinalizar.set(unidade);
  }

  // Mostra a unidade escolhida na pill como sufixo dentro do próprio campo
  // numérico (ex.: "4 Noites"), em vez de só a pill isolada embaixo.
  protected rotuloUnidadeTempo(unidade: UnidadeTempoEstadia): string {
    return OPCOES_UNIDADE_TEMPO.find((opcao) => opcao.valor === unidade)?.rotulo ?? '';
  }

  private recalcularTempoFinalizar(): void {
    if (this.tempoEditadoManualmente) {
      return;
    }
    const dataSaida = this.dataSaidaFinalizar();
    if (!dataSaida || !this.dataEntradaFinalizar) {
      return;
    }
    const { valor, unidade } = calcularTempoEstadia(this.dataEntradaFinalizar, dataSaida);
    this.tempoEstadiaValorFinalizar.set(valor);
    this.tempoEstadiaUnidadeFinalizar.set(unidade);
  }

  protected confirmarFinalizar(idEstadia: number): void {
    const dataSaida = this.dataSaidaFinalizar();
    if (!dataSaida) {
      this.erroFinalizar.set('Informe a data de saída.');
      return;
    }

    this.finalizando.set(true);
    this.erroFinalizar.set(null);

    const tempoValor = this.tempoEstadiaValorFinalizar();
    this.estadiaService
      .encerrar(
        idEstadia,
        dataSaida,
        tempoValor ?? undefined,
        tempoValor !== null ? this.tempoEstadiaUnidadeFinalizar() : undefined
      )
      .subscribe({
      next: () => {
        this.finalizando.set(false);
        this.estadiaFinalizarAberta.set(null);
        // A estadia finalizada libera o leito — a forma mais simples e
        // correta de refletir isso (inclusive na fila de pendentes de
        // revisão, que pode promover a próxima mais recente) é recarregar.
        this.carregarOcupacao();
      },
      error: (error) => {
        this.finalizando.set(false);
        this.erroFinalizar.set(descreverErroHttp(error.error));
      }
    });
  }

  protected abrirCriarEstadia(quarto: QuartoOcupacao, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fecharFinalizar();
    this.erroCriarEstadia.set(null);
    this.pessoaNovaEstadia.set(null);
    this.dataEntradaNovaEstadia.set(new Date().toISOString().slice(0, 10));
    this.tipoPessoaNovaEstadia.set('Paciente');
    this.idHospitalNovaEstadia.set(null);
    this.observacaoNovaEstadia.set('');
    this.estadiaCriarAberta.set(quarto.id);
  }

  protected fecharCriarEstadia(): void {
    this.estadiaCriarAberta.set(null);
    this.erroCriarEstadia.set(null);
  }

  protected confirmarCriarEstadia(quarto: QuartoOcupacao): void {
    const pessoa = this.pessoaNovaEstadia();
    const dataEntrada = this.dataEntradaNovaEstadia();
    if (!pessoa) {
      this.erroCriarEstadia.set('Selecione a pessoa.');
      return;
    }
    if (!dataEntrada) {
      this.erroCriarEstadia.set('Informe a data de entrada.');
      return;
    }

    const idUsuario = this.auth.sessao()?.usuario_id;
    if (idUsuario === undefined) {
      this.erroCriarEstadia.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.criandoEstadia.set(true);
    this.erroCriarEstadia.set(null);

    this.estadiaService
      .criar({
        id_pessoa: pessoa.id,
        id_quarto: quarto.id,
        id_usuario: idUsuario,
        id_hospital: this.idHospitalNovaEstadia(),
        data_entrada: dataEntrada,
        tipo_pessoa: this.tipoPessoaNovaEstadia(),
        situacao: 'Em acompanhamento',
        observacao: this.observacaoNovaEstadia() || null
      })
      .subscribe({
        next: () => {
          this.criandoEstadia.set(false);
          this.estadiaCriarAberta.set(null);
          this.carregarOcupacao();
        },
        error: (error) => {
          this.criandoEstadia.set(false);
          this.erroCriarEstadia.set(descreverErroHttp(error.error));
        }
      });
  }

  protected get totalLeitos(): number {
    return this.quartos().reduce((soma, q) => soma + q.leito, 0);
  }

  protected get totalOcupados(): number {
    return this.quartos().reduce((soma, q) => soma + q.ocupantes.length, 0);
  }

  protected get totalPendentesRevisao(): number {
    return this.quartos().reduce((soma, q) => soma + q.pendentesRevisao.length, 0);
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(event: MouseEvent): void {
    const alvo = event.target as HTMLElement;
    // Painel do autocomplete de pessoa (dentro do popover de criar
    // estadia) é renderizado pelo CDK num overlay fora da árvore do
    // popover — sem essa exceção, escolher uma opção fecharia o popover
    // antes de processar a seleção.
    if (alvo.closest('.cdk-overlay-container')) {
      return;
    }
    if (this.estadiaFinalizarAberta() !== null && !alvo.closest('.ocupacao__leito--ocupado')) {
      this.fecharFinalizar();
    }
    if (this.estadiaCriarAberta() !== null && !alvo.closest('.ocupacao__leito--livre')) {
      this.fecharCriarEstadia();
    }
  }

  private carregarOcupacao(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.quartoService.listarOcupacao().subscribe({
      next: (quartos) => {
        this.quartos.set(quartos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a ocupação dos quartos.');
        this.carregando.set(false);
      }
    });
  }
}
