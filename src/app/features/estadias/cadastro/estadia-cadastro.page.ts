import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { QuartoService } from '../../quartos/quarto.service';
import { Quarto } from '../../quartos/quarto.model';
import { HospitalService } from '../../hospitais/hospital.service';
import { Hospital } from '../../hospitais/hospital.model';
import { EstadiaAcompanhanteCreateDto } from '../estadia.dto';
import { EstadiaService } from '../estadia.service';
import { EstadiaAcompanhante, EstadiaHistorico, SituacaoEstadia, TipoPessoaEstadia } from '../estadia.model';
import {
  CadastroDialogAba,
  CadastroDialogShellComponent
} from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';
import { agoraDatetimeLocal, calcularTempoEstadia } from '../../../shared/util/data';

const OPCOES_SITUACAO: OpcaoFiltroPill[] = [
  { valor: 'Em acompanhamento', rotulo: 'Em acompanhamento' },
  { valor: 'Aguardando retorno', rotulo: 'Aguardando retorno', variante: 'aviso' },
  { valor: 'Finalizada', rotulo: 'Finalizada', variante: 'erro' }
];

// "Finalizada" só é alcançável via `encerrar()` (botão "Encerrar
// estadia") — nunca escolhida manualmente. Verificado contra o legado
// (untFrmManutencaoEstadia.dfm/.pas): lá `situacao` é um radio group
// livre sem nenhuma regra especial por trás de "Aguardando retorno" (é
// só uma opção manual igual às outras); mantida editável só entre esses
// dois estados ativos, pelo mesmo motivo que ela existia no legado.
const OPCOES_SITUACAO_ATIVA: OpcaoFiltroPill[] = OPCOES_SITUACAO.filter((opcao) => opcao.valor !== 'Finalizada');

const OPCOES_TIPO_PESSOA: OpcaoFiltroPill[] = [
  { valor: 'Paciente', rotulo: 'Paciente' },
  { valor: 'Acompanhante', rotulo: 'Acompanhante' }
];

@Component({
  selector: 'app-estadia-cadastro-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PessoaAutocompleteComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatCheckboxModule,
    CadastroDialogShellComponent,
    CadastroAcoesComponent,
    FiltroPillsComponent
  ],
  templateUrl: './estadia-cadastro.page.html'
})
export class EstadiaCadastroPage {
  protected readonly opcoesSituacaoAtiva = OPCOES_SITUACAO_ATIVA;
  protected readonly opcoesTipoPessoa = OPCOES_TIPO_PESSOA;

  private readonly fb = inject(FormBuilder);
  private readonly estadiaService = inject(EstadiaService);
  private readonly pessoaService = inject(PessoaService);
  private readonly quartoService = inject(QuartoService);
  private readonly hospitalService = inject(HospitalService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly estadiaId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.estadiaId !== null;

  // Acompanhantes já dão pra adicionar na criação — ver
  // `acompanhantesLocais` e o DTO aninhado em `EstadiaCreate`
  // (abrigo-backend/app/features/estadias/schemas.py). Histórico continua
  // exclusivo de edição (trilha de auditoria, só existe depois que a
  // estadia já foi criada — mesmo padrão de emprestimo-cadastro.page.ts).
  //
  // Aba só existe quando tipoPessoa === 'Paciente' — uma estadia que já é
  // de um acompanhante (tem leito próprio) não tem sentido ter
  // acompanhante dela mesma (regra do time, 2026-09-25; backend rejeita
  // com 400 se tentar, ver estadias/router.py).
  protected readonly tipoPessoaAtual = signal<TipoPessoaEstadia>('Paciente');
  protected readonly abas = computed<CadastroDialogAba[]>(() => [
    { id: 'dados', rotulo: 'Dados' },
    ...(this.tipoPessoaAtual() === 'Paciente' ? [{ id: 'acompanhantes', rotulo: 'Acompanhantes' }] : []),
    ...(this.modoEdicao ? [{ id: 'historico', rotulo: 'Histórico' }] : [])
  ]);
  protected readonly abaAtiva = signal('dados');

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly encerrando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly quartos = signal<Quarto[]>([]);
  protected readonly hospitais = signal<Hospital[]>([]);
  protected readonly pessoaSelecionada = signal<{ id: number; nome: string } | null>(null);
  protected readonly situacaoAtual = signal<SituacaoEstadia | null>(null);
  protected readonly idUsuarioOriginal = signal<number | null>(null);

  protected readonly acompanhantes = signal<EstadiaAcompanhante[]>([]);
  // Acompanhantes locais (estadia em criação, ainda sem id) — mesmo padrão
  // de `itensLocais` em emprestimo-cadastro.page.ts.
  protected readonly acompanhantesLocais = signal<EstadiaAcompanhante[]>([]);
  protected readonly acompanhantesExibidos = computed(() =>
    this.estadiaId === null ? this.acompanhantesLocais() : this.acompanhantes()
  );
  protected readonly nomesAcompanhantes = signal<Record<number, string>>({});
  protected readonly formAcompanhanteAberto = signal(false);
  protected readonly encerrandoAcompanhanteId = signal<number | null>(null);
  protected readonly salvandoAcompanhante = signal(false);
  protected readonly pessoaAcompanhante = signal<{ id: number; nome: string } | null>(null);

  protected readonly historico = signal<EstadiaHistorico[]>([]);
  protected readonly carregandoHistorico = signal(false);

  private proximoIdAcompanhanteLocal = -1;

  protected readonly form = this.fb.nonNullable.group({
    idQuarto: this.fb.control<number | null>(null, Validators.required),
    idHospital: this.fb.control<number | null>(null),
    // Pré-preenchido com a hora atual do computador ao criar uma estadia
    // nova (ver `agoraDatetimeLocal`) — em edição, sobrescrito pelo valor
    // real da estadia no `constructor` abaixo.
    dataEntrada: [this.modoEdicao ? '' : agoraDatetimeLocal(), [Validators.required]],
    dataSaida: [''],
    tipoPessoa: this.fb.nonNullable.control<TipoPessoaEstadia>('Paciente'),
    situacao: this.fb.nonNullable.control<SituacaoEstadia>('Em acompanhamento', Validators.required),
    observacao: ['']
  });

  protected readonly formAcompanhante = this.fb.nonNullable.group({
    dataEntrada: ['', [Validators.required]],
    dataSaida: [''],
    grauParentesco: [''],
    ocupaLeito: this.fb.nonNullable.control(false)
  });

  constructor() {
    this.quartoService.listar(false).subscribe((quartos) => this.quartos.set(quartos));
    this.hospitalService.listar().subscribe((hospitais) => this.hospitais.set(hospitais));

    this.form.controls.tipoPessoa.valueChanges.subscribe((tipoPessoa) => {
      this.tipoPessoaAtual.set(tipoPessoa);
      if (tipoPessoa !== 'Paciente') {
        // Aba Acompanhantes some (ver `abas`) — sem isso, acompanhantes já
        // adicionados localmente seriam mandados junto no POST e rejeitados
        // pelo backend (400, ver estadias/router.py).
        this.acompanhantesLocais.set([]);
        if (this.abaAtiva() === 'acompanhantes') {
          this.abaAtiva.set('dados');
        }
      }
    });

    if (this.estadiaId !== null) {
      this.estadiaService.buscar(this.estadiaId).subscribe({
        next: (estadia) => {
          this.form.patchValue({
            idQuarto: estadia.idQuarto,
            idHospital: estadia.idHospital,
            dataEntrada: estadia.dataEntrada.slice(0, 16),
            dataSaida: estadia.dataSaida?.slice(0, 16) ?? '',
            tipoPessoa: estadia.tipoPessoa,
            situacao: estadia.situacao,
            observacao: estadia.observacao ?? ''
          });
          this.situacaoAtual.set(estadia.situacao);
          this.idUsuarioOriginal.set(estadia.idUsuario);
          this.carregando.set(false);

          this.pessoaService.buscar(estadia.idPessoa).subscribe((pessoa) => {
            this.pessoaSelecionada.set({ id: pessoa.id, nome: pessoa.nome });
          });

          this.carregarAcompanhantes();
          this.carregarHistorico();
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados da estadia.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected selecionarPessoa(pessoa: { id: number; nome: string } | null): void {
    this.pessoaSelecionada.set(pessoa);
  }

  protected selecionarPessoaAcompanhante(pessoa: { id: number; nome: string } | null): void {
    this.pessoaAcompanhante.set(pessoa);
  }

  protected salvar(): void {
    if (this.form.invalid || this.pessoaSelecionada() === null) {
      this.form.markAllAsTouched();
      if (this.pessoaSelecionada() === null) {
        this.erro.set('Selecione a pessoa atendida.');
      }
      return;
    }

    const valores = this.form.getRawValue();
    // Tempo de estadia não é mais digitado — calculado a partir de
    // entrada/saída (ver calcularTempoEstadia). Sem data de saída ainda
    // não tem o que calcular.
    const tempo = valores.dataSaida ? calcularTempoEstadia(valores.dataEntrada, valores.dataSaida) : null;
    const dados = {
      id_pessoa: this.pessoaSelecionada()!.id,
      id_quarto: valores.idQuarto!,
      id_usuario: this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id,
      id_hospital: valores.idHospital,
      data_entrada: valores.dataEntrada,
      data_saida: valores.dataSaida || null,
      tempo_estadia_valor: tempo?.valor ?? null,
      tempo_estadia_unidade: tempo?.unidade ?? null,
      tipo_pessoa: valores.tipoPessoa,
      situacao: valores.situacao,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.estadiaId !== null
        ? this.estadiaService.atualizar(this.estadiaId, dados)
        : this.estadiaService.criar({ ...dados, acompanhantes: this.paraAcompanhantesCreateDto() });

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/estadias');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected encerrar(): void {
    if (this.estadiaId === null || !confirm('Encerrar esta estadia? A situação será marcada como Finalizada.')) {
      return;
    }

    this.encerrando.set(true);
    this.erro.set(null);

    const idUsuario = this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id;
    const dataSaida = agoraDatetimeLocal();
    const tempo = calcularTempoEstadia(this.form.controls.dataEntrada.value, dataSaida);
    this.estadiaService.encerrar(this.estadiaId, dataSaida, tempo.valor, tempo.unidade, idUsuario).subscribe({
      next: () => {
        void this.router.navigateByUrl('/estadias');
      },
      error: (error) => {
        this.encerrando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected abrirFormAcompanhante(): void {
    this.pessoaAcompanhante.set(null);
    this.formAcompanhante.reset({ dataEntrada: '', dataSaida: '', grauParentesco: '', ocupaLeito: false });
    this.formAcompanhanteAberto.set(true);
  }

  protected cancelarAcompanhante(): void {
    this.formAcompanhanteAberto.set(false);
  }

  protected salvarAcompanhante(): void {
    if (this.formAcompanhante.invalid || this.pessoaAcompanhante() === null) {
      this.formAcompanhante.markAllAsTouched();
      return;
    }

    const pessoa = this.pessoaAcompanhante()!;
    const valores = this.formAcompanhante.getRawValue();

    // Estadia ainda em criação (sem id): junta o acompanhante num array
    // local em vez de chamar a API — mesmo padrão de `itensLocais` em
    // emprestimo-cadastro.page.ts.
    if (this.estadiaId === null) {
      const acompanhante: EstadiaAcompanhante = {
        id: this.proximoIdAcompanhanteLocal--,
        idEstadia: 0,
        idPessoa: pessoa.id,
        dataEntrada: valores.dataEntrada,
        dataSaida: valores.dataSaida || null,
        grauParentesco: valores.grauParentesco || null,
        ocupaLeito: valores.ocupaLeito
      };
      this.acompanhantesLocais.update((atuais) => [...atuais, acompanhante]);
      this.nomesAcompanhantes.update((mapa) => ({ ...mapa, [pessoa.id]: pessoa.nome }));
      this.formAcompanhanteAberto.set(false);
      return;
    }

    this.salvandoAcompanhante.set(true);

    this.estadiaService
      .adicionarAcompanhante(this.estadiaId, {
        id_pessoa: pessoa.id,
        data_entrada: valores.dataEntrada,
        data_saida: valores.dataSaida || null,
        grau_parentesco: valores.grauParentesco || null,
        ocupa_leito: valores.ocupaLeito
      })
      .subscribe({
        next: () => {
          this.salvandoAcompanhante.set(false);
          this.formAcompanhanteAberto.set(false);
          this.carregarAcompanhantes();
        },
        error: (error) => {
          this.salvandoAcompanhante.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
  }

  private paraAcompanhantesCreateDto(): EstadiaAcompanhanteCreateDto[] {
    return this.acompanhantesLocais().map((acompanhante) => ({
      id_pessoa: acompanhante.idPessoa,
      data_entrada: acompanhante.dataEntrada,
      data_saida: acompanhante.dataSaida,
      grau_parentesco: acompanhante.grauParentesco,
      ocupa_leito: acompanhante.ocupaLeito
    }));
  }

  /** Registra a saída do acompanhante agora (revezamento: ele pode sair
   * antes do paciente) — a estadia do paciente continua em andamento. */
  protected registrarSaidaAcompanhante(acompanhante: EstadiaAcompanhante): void {
    if (this.estadiaId === null) {
      return;
    }
    this.encerrandoAcompanhanteId.set(acompanhante.id);
    this.erro.set(null);
    this.estadiaService.encerrarAcompanhante(this.estadiaId, acompanhante.id, agoraDatetimeLocal()).subscribe({
      next: () => {
        this.encerrandoAcompanhanteId.set(null);
        this.carregarAcompanhantes();
      },
      error: (error) => {
        this.encerrandoAcompanhanteId.set(null);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  private carregarAcompanhantes(): void {
    if (this.estadiaId === null) {
      return;
    }
    this.estadiaService.listarAcompanhantes(this.estadiaId).subscribe((acompanhantes) => {
      this.acompanhantes.set(acompanhantes);
      const idsFaltantes = [...new Set(acompanhantes.map((a) => a.idPessoa))].filter(
        (id) => this.nomesAcompanhantes()[id] === undefined
      );
      idsFaltantes.forEach((id) => {
        this.pessoaService.buscar(id).subscribe((pessoa) => {
          this.nomesAcompanhantes.update((mapa) => ({ ...mapa, [pessoa.id]: pessoa.nome }));
        });
      });
    });
  }

  private carregarHistorico(): void {
    if (this.estadiaId === null) {
      return;
    }
    this.carregandoHistorico.set(true);
    this.estadiaService.listarHistorico(this.estadiaId).subscribe({
      next: (historico) => {
        this.historico.set(historico);
        this.carregandoHistorico.set(false);
      },
      error: () => this.carregandoHistorico.set(false)
    });
  }

  // Tempo de estadia não é mais um campo do form — só exibição, calculado
  // ao vivo a partir de entrada/saída (mesma regra de `encerrar`/`salvar`).
  protected tempoEstadiaTexto(): string {
    const dataEntrada = this.form.controls.dataEntrada.value;
    const dataSaida = this.form.controls.dataSaida.value;
    if (!dataEntrada || !dataSaida) {
      return '—';
    }
    const tempo = calcularTempoEstadia(dataEntrada, dataSaida);
    return `${tempo.valor} ${tempo.unidade}`;
  }

  protected nomeUsuarioHistorico(idUsuario: number): string {
    const sessao = this.auth.sessao();
    if (sessao && sessao.usuario_id === idUsuario) {
      return sessao.nome;
    }
    return `Usuário #${idUsuario}`;
  }
}
