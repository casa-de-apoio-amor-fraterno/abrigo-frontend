import { Component, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
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
import { TipoPessoaEstadia } from '../../../features/estadias/estadia.model';
import { HospitalService } from '../../../features/hospitais/hospital.service';
import { Hospital } from '../../../features/hospitais/hospital.model';
import { EmprestimoService } from '../../../features/emprestimos/emprestimo.service';
import {
  AlertaVencimentoEmprestimo,
  NivelUrgenciaVencimento
} from '../../../features/emprestimos/emprestimo.model';
import { AcaoPopoverComponent } from '../../../shared/ui/acao-popover/acao-popover.component';
import { FinalizarEstadiaPopoverComponent } from '../../../shared/ui/finalizar-estadia-popover/finalizar-estadia-popover.component';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';
import { EmprestimoDetalheDialogComponent } from '../../../features/emprestimos/detalhe-dialog/emprestimo-detalhe-dialog.component';
import { agoraDatetimeLocal } from '../../../shared/util/data';
import { linkWhatsapp } from '../../../shared/util/whatsapp';

// Limites do "radar" de cores pedido pelo time (2026-09-26): até 7 dias
// pra vencer é "urgente" (laranja), até 14 é só "próximo" (amarelo), dias
// negativos (já passou a data prevista) é "vencido" (vermelho). O
// horizonte de 14 dias também é o que decide se o item aparece na lista
// (ver EmprestimoService.listarAlertasVencimento — mesmo valor default do
// backend, DIAS_HORIZONTE_ALERTA_VENCIMENTO).
const LIMITE_DIAS_URGENTE = 7;

const OPCOES_TIPO_PESSOA: OpcaoFiltroPill[] = [
  { valor: 'Paciente', rotulo: 'Paciente' },
  { valor: 'Acompanhante', rotulo: 'Acompanhante' }
];

/** Placeholder puramente visual — não representa uma pessoa/estadia real,
 * só "aqui cabe mais um leito". */
type LeitoVago = { vago: true };

@Component({
  selector: 'app-home-page',
  imports: [
    DatePipe,
    RouterLink,
    AcaoPopoverComponent,
    FinalizarEstadiaPopoverComponent,
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
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly dialog = inject(MatDialog);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly quartos = signal<QuartoOcupacao[]>([]);
  protected readonly revisaoAberta = signal<number | null>(null);
  protected readonly hospitais = signal<Hospital[]>([]);

  protected readonly termoBuscaQuartos = signal('');
  // Busca pelo número/descrição do quarto ou pelo nome de quem está
  // ocupando — útil pra achar em qual quarto uma pessoa está, não só pra
  // localizar o quarto em si.
  protected readonly quartosFiltrados = computed(() => {
    const termo = this.normalizarBusca(this.termoBuscaQuartos());
    if (!termo) {
      return this.quartos();
    }
    return this.quartos().filter((quarto) => {
      const alvos = [
        quarto.numero,
        quarto.descricao ?? '',
        ...quarto.ocupantes.map((o) => o.nomePessoa),
        ...quarto.pendentesRevisao.map((o) => o.nomePessoa)
      ];
      return alvos.some((alvo) => this.normalizarBusca(alvo).includes(termo));
    });
  });

  protected readonly carregandoVencimentos = signal(true);
  protected readonly erroVencimentos = signal<string | null>(null);
  protected readonly alertasVencimento = signal<AlertaVencimentoEmprestimo[]>([]);

  protected readonly termoBuscaVencimentos = signal('');
  protected readonly alertasFiltrados = computed(() => {
    const termo = this.normalizarBusca(this.termoBuscaVencimentos());
    if (!termo) {
      return this.alertasVencimento();
    }
    return this.alertasVencimento().filter((alerta) => {
      const alvos = [alerta.nomePessoa, alerta.descricaoMaterial, alerta.numeroPatrimonioMaterial ?? ''];
      return alvos.some((alvo) => this.normalizarBusca(alvo).includes(termo));
    });
  });

  // Clicar numa cama ocupada abre esse popover pra finalizar a estadia
  // direto da tela Início, sem precisar ir pra edição completa (mesmo
  // componente compartilhado do "Finalizar" da busca global, ver
  // FinalizarEstadiaPopoverComponent).
  protected readonly finalizarPopover = viewChild.required(FinalizarEstadiaPopoverComponent);

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
    this.carregarVencimentos();
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
    this.finalizarPopover().abrir(ocupante.idEstadia, ocupante.dataEntrada, ocupante.nomePessoa);
  }

  // A estadia finalizada libera o leito — a forma mais simples e correta
  // de refletir isso (inclusive na fila de pendentes de revisão, que pode
  // promover a próxima mais recente) é recarregar.
  protected aoFinalizarEstadia(): void {
    this.carregarOcupacao();
  }

  protected abrirCriarEstadia(quarto: QuartoOcupacao, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.finalizarPopover().fechar();
    this.erroCriarEstadia.set(null);
    this.pessoaNovaEstadia.set(null);
    this.dataEntradaNovaEstadia.set(agoraDatetimeLocal());
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

  protected nivelUrgencia(alerta: AlertaVencimentoEmprestimo): NivelUrgenciaVencimento {
    if (alerta.diasRestantes < 0) {
      return 'vencido';
    }
    return alerta.diasRestantes <= LIMITE_DIAS_URGENTE ? 'urgente' : 'proximo';
  }

  /** `null` quando não há telefone cadastrado ou não dá pra extrair um
   * número plausível dele (ver shared/util/whatsapp) — o template não
   * mostra o botão de contato nesse caso. */
  protected linkWhatsappAlerta(alerta: AlertaVencimentoEmprestimo): string | null {
    if (!alerta.telefonePessoa) {
      return null;
    }
    const mensagem =
      `Olá, ${alerta.nomePessoa}! Aqui é da Casa de Apoio Amor Fraterno (CAAF). ` +
      `Estamos entrando em contato sobre o empréstimo do material "${alerta.descricaoMaterial}", ` +
      `com devolução prevista para ${this.formatarDataBr(alerta.dataDevolucao)}. ` +
      'Poderia nos dar um retorno sobre a devolução ou uma renovação do prazo?';
    return linkWhatsapp(alerta.telefonePessoa, mensagem);
  }

  // Popup leve de consulta (mesmo padrão de "visualizar" na listagem de
  // empréstimos) — abre por cima da própria tela Início, sem navegar pra
  // lugar nenhum. Ação de edição completa foi tirada daqui (pedido do
  // time, 2026-09-28) — só "Finalizar"/"Renovar empréstimo" ficam
  // disponíveis (ver `acoesRapidas` em EmprestimoDetalheDialogData); edição
  // completa continua acessível pela listagem de empréstimos. Recarrega os
  // vencimentos ao fechar porque qualquer uma das duas ações muda o prazo
  // ou a situação do empréstimo.
  protected visualizarAlerta(alerta: AlertaVencimentoEmprestimo, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dialog
      .open(EmprestimoDetalheDialogComponent, {
        width: '560px',
        data: { emprestimoId: alerta.idEmprestimo, acoesRapidas: true }
      })
      .afterClosed()
      .subscribe(() => this.carregarVencimentos());
  }

  private normalizarBusca(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private formatarDataBr(dataIso: string): string {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected textoPrazo(alerta: AlertaVencimentoEmprestimo): string {
    const dias = alerta.diasRestantes;
    if (dias < 0) {
      return `Venceu há ${Math.abs(dias)} dia(s)`;
    }
    if (dias === 0) {
      return 'Vence hoje';
    }
    return `Vence em ${dias} dia(s)`;
  }

  protected get totalVencidos(): number {
    return this.alertasVencimento().filter((a) => this.nivelUrgencia(a) === 'vencido').length;
  }

  protected get totalUrgentes(): number {
    return this.alertasVencimento().filter((a) => this.nivelUrgencia(a) === 'urgente').length;
  }

  protected get totalProximos(): number {
    return this.alertasVencimento().filter((a) => this.nivelUrgencia(a) === 'proximo').length;
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
    if (this.finalizarPopover().aberta() !== null && !alvo.closest('.ocupacao__leito--ocupado')) {
      this.finalizarPopover().fechar();
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

  private carregarVencimentos(): void {
    this.carregandoVencimentos.set(true);
    this.erroVencimentos.set(null);
    this.emprestimoService.listarAlertasVencimento().subscribe({
      next: (alertas) => {
        this.alertasVencimento.set(alertas);
        this.carregandoVencimentos.set(false);
      },
      error: () => {
        this.erroVencimentos.set('Não foi possível carregar os empréstimos próximos ao vencimento.');
        this.carregandoVencimentos.set(false);
      }
    });
  }
}
