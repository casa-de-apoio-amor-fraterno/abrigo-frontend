import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { AssinaturaCanvasComponent } from '../../../shared/ui/assinatura-canvas/assinatura-canvas.component';
import { MaterialAutocompleteComponent } from '../../../shared/ui/material-autocomplete/material-autocomplete.component';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { MaterialService } from '../../materiais/material.service';
import { EmprestimoItemCreateDto, TipoContrato } from '../emprestimo.dto';
import { EmprestimoService } from '../emprestimo.service';
import {
  EmprestimoContrato,
  EmprestimoHistorico,
  EmprestimoItem,
  SituacaoEmprestimo
} from '../emprestimo.model';
import {
  CadastroDialogAba,
  CadastroDialogShellComponent
} from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';

@Component({
  selector: 'app-emprestimo-cadastro-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MaterialAutocompleteComponent,
    PessoaAutocompleteComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CadastroDialogShellComponent,
    CadastroAcoesComponent,
    AssinaturaCanvasComponent
  ],
  templateUrl: './emprestimo-cadastro.page.html',
  styleUrl: './emprestimo-cadastro.page.scss'
})
export class EmprestimoCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly materialService = inject(MaterialService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  // Este componente é sempre conteúdo de um MatDialog — tanto no fluxo
  // roteado normal (CadastroDialogHostBase abre ele dentro do dialog a
  // partir da rota /emprestimos/:id/editar) quanto quando é aberto direto
  // por outra tela sem trocar de rota (ver home.page.ts, popup "Ver" dos
  // vencimentos) — por isso fecha a si mesmo (`dialogRef.close()`) em vez
  // de navegar: no fluxo roteado o host reage ao fechamento e navega pra
  // lista (mesmo resultado de antes); no fluxo direto só fecha o popup,
  // sem sair da tela de quem abriu.
  private readonly dialogRef = inject(MatDialogRef<EmprestimoCadastroPage>);
  // Só presente quando aberto direto (fora da rota) — no fluxo roteado
  // normal o host não passa `data`, então isso fica `null` e o id vem do
  // parâmetro da rota mesmo (ver `emprestimoId` abaixo).
  private readonly dialogData = inject<{ emprestimoId?: number } | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  protected readonly emprestimoId =
    this.dialogData?.emprestimoId ??
    (this.route.snapshot.paramMap.get('id') ? Number(this.route.snapshot.paramMap.get('id')) : null);
  protected readonly modoEdicao = this.emprestimoId !== null;

  // Itens do empréstimo já dão pra adicionar na criação (ver `itensLocais`
  // abaixo e o DTO aninhado em `EmprestimoCreate`,
  // abrigo-backend/app/features/emprestimos/schemas.py) — só Histórico
  // continua exclusivo de edição (trilha de auditoria, só existe depois
  // que o empréstimo já foi criado).
  protected readonly abas: CadastroDialogAba[] = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'itens', rotulo: 'Itens do empréstimo' },
    // Contrato depende de um id de empréstimo já persistido (é um
    // sub-recurso, POST /emprestimos/{id}/contrato) — só existe em edição.
    ...(this.modoEdicao
      ? [
          { id: 'historico', rotulo: 'Histórico de alteração' },
          { id: 'contrato', rotulo: 'Contrato' }
        ]
      : [])
  ];
  protected readonly abaAtiva = signal('dados');

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly pessoaSelecionada = signal<{ id: number; nome: string } | null>(null);
  protected readonly idUsuarioOriginal = signal<number | null>(null);

  protected readonly itens = signal<EmprestimoItem[]>([]);
  // Itens locais (empréstimo em criação, ainda sem id) — mesmo padrão de
  // `composicaoFamiliarLocal` em pessoa-cadastro.page.ts: junta os itens
  // num array local e manda tudo junto no POST de criação.
  protected readonly itensLocais = signal<EmprestimoItem[]>([]);
  protected readonly itensExibidos = computed(() => (this.emprestimoId === null ? this.itensLocais() : this.itens()));
  protected readonly descricoesMateriais = signal<Record<number, string>>({});
  protected readonly patrimoniosMateriais = signal<Record<number, string | null>>({});
  protected readonly formItemAberto = signal(false);
  protected readonly salvandoItem = signal(false);
  protected readonly materialSelecionado = signal<{
    id: number;
    descricao: string;
    numeroPatrimonio: string | null;
  } | null>(null);
  protected readonly itemEmEdicao = signal<EmprestimoItem | null>(null);

  private proximoIdItemLocal = -1;
  // Só leitura — gravada automaticamente pelo backend quando `situacao`
  // vira "Devolvido" (ver emprestimo.legacy.md / service.py).
  protected readonly itemEmEdicaoDataDevolucaoEfetiva = computed(
    () => this.itemEmEdicao()?.dataDevolucaoEfetiva ?? null
  );

  protected readonly historico = signal<EmprestimoHistorico[]>([]);
  protected readonly carregandoHistorico = signal(false);

  protected readonly assinaturaCanvas = viewChild(AssinaturaCanvasComponent);
  // Um empréstimo pode ter vários contratos: no máximo um "Comodato" (o
  // original) + quantas "Renovação" forem assinadas (decisão do time,
  // 2026-09-26 — ver emprestimo.legacy.md). `contratoOriginal` é o que
  // libera o botão de assinar renovação.
  protected readonly contratos = signal<EmprestimoContrato[]>([]);
  protected readonly contratoOriginal = computed(
    () => this.contratos().find((c) => c.tipo === 'Comodato') ?? null
  );
  protected readonly carregandoContrato = signal(false);
  protected readonly assinandoContrato = signal(false);
  protected readonly erroContrato = signal<string | null>(null);
  // Mostra o canvas de assinatura pra uma renovação nova — o comodato
  // original é assinado direto (não tem outra ação antes) quando ainda não
  // existe nenhum contrato.
  protected readonly assinandoRenovacao = signal(false);
  // URL local do último PDF aberto — só guardada pra poder revogar
  // (`URL.revokeObjectURL`) antes de abrir a próxima, evitando vazar
  // memória a cada contrato visualizado.
  protected readonly pdfContratoUrl = signal<string | null>(null);

  // Situação do cabeçalho não é digitada pelo usuário — calculada pelo
  // backend a partir dos itens (ver emprestimo.legacy.md / service.py),
  // só exibida (modo edição) em `situacaoAtual` abaixo.
  protected readonly situacaoAtual = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    numeroContrato: [''],
    observacao: ['']
  });

  protected readonly formItem = this.fb.nonNullable.group({
    dataEmprestimo: [''],
    // Não é enviado ao backend — só um atalho de UI pra calcular
    // `dataDevolucao` (data emprestimo + N dias), ver `aplicarDiasEmprestimo`.
    diasEmprestimo: [''],
    dataDevolucao: [''],
    situacao: ['Pendente'],
    renovacao: ['']
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.revogarPdfContratoUrl());

    this.formItem.controls.diasEmprestimo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dias) => this.aplicarDiasEmprestimo(dias));

    if (this.emprestimoId !== null) {
      this.emprestimoService.buscar(this.emprestimoId).subscribe({
        next: (emprestimo) => {
          this.form.patchValue({
            numeroContrato: emprestimo.numeroContrato ?? '',
            observacao: emprestimo.observacao ?? ''
          });
          this.situacaoAtual.set(emprestimo.situacao);
          this.idUsuarioOriginal.set(emprestimo.idUsuario);
          this.carregando.set(false);

          this.pessoaService.buscar(emprestimo.idPessoa).subscribe((pessoa) => {
            this.pessoaSelecionada.set({ id: pessoa.id, nome: pessoa.nome });
          });

          this.carregarItens();
          this.carregarHistorico();
          this.carregarContratos();
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do empréstimo.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected selecionarPessoa(pessoa: { id: number; nome: string } | null): void {
    this.pessoaSelecionada.set(pessoa);
  }

  protected selecionarMaterial(
    material: { id: number; descricao: string; numeroPatrimonio: string | null } | null
  ): void {
    this.materialSelecionado.set(material);
  }

  protected salvar(): void {
    if (this.form.invalid || this.pessoaSelecionada() === null) {
      this.form.markAllAsTouched();
      if (this.pessoaSelecionada() === null) {
        this.erro.set('Selecione a pessoa do empréstimo.');
      }
      return;
    }

    const valores = this.form.getRawValue();
    const idUsuario = this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id;
    const dados = {
      id_pessoa: this.pessoaSelecionada()!.id,
      id_usuario: idUsuario,
      numero_contrato: valores.numeroContrato || null,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.emprestimoId !== null
        ? this.emprestimoService.atualizar(this.emprestimoId, dados)
        : this.emprestimoService.criar({ ...dados, itens: this.paraItensCreateDto(idUsuario) });

    operacao.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected fechar(): void {
    this.dialogRef.close(false);
  }

  protected novoItem(): void {
    this.itemEmEdicao.set(null);
    this.materialSelecionado.set(null);
    this.formItem.reset({
      dataEmprestimo: '',
      diasEmprestimo: '',
      dataDevolucao: '',
      situacao: 'Pendente',
      renovacao: ''
    });
    this.erro.set(null);
    this.formItemAberto.set(true);
  }

  protected editarItem(item: EmprestimoItem): void {
    this.itemEmEdicao.set(item);
    const descricao = this.descricoesMateriais()[item.idMaterial];
    const numeroPatrimonio = this.patrimoniosMateriais()[item.idMaterial] ?? null;
    this.materialSelecionado.set(descricao ? { id: item.idMaterial, descricao, numeroPatrimonio } : null);
    this.formItem.reset({
      dataEmprestimo: item.dataEmprestimo ?? '',
      diasEmprestimo: '',
      dataDevolucao: item.dataDevolucao ?? '',
      situacao: item.situacao ?? 'Pendente',
      renovacao: item.renovacao ?? ''
    });
    this.erro.set(null);
    this.formItemAberto.set(true);
  }

  protected cancelarItem(): void {
    this.formItemAberto.set(false);
  }

  /** Preenche `dataDevolucao` a partir de `dataEmprestimo` (ou hoje, se
   * vazia) + N dias — evita o usuário ter que somar a data manualmente
   * (ex.: empréstimo de 30 dias). Só age com um número positivo válido;
   * texto vazio ou inválido não mexe em `dataDevolucao`. */
  private aplicarDiasEmprestimo(diasTexto: string): void {
    const dias = Number(diasTexto);
    if (!diasTexto || !Number.isFinite(dias) || dias <= 0) {
      return;
    }
    const dataBaseTexto = this.formItem.controls.dataEmprestimo.value;
    const dataBase = dataBaseTexto ? new Date(`${dataBaseTexto}T00:00:00`) : new Date();
    dataBase.setDate(dataBase.getDate() + dias);
    this.formItem.controls.dataDevolucao.setValue(dataBase.toISOString().slice(0, 10));
  }

  protected salvarItem(): void {
    if (this.materialSelecionado() === null) {
      this.erro.set('Selecione o material do item.');
      return;
    }

    const material = this.materialSelecionado()!;
    const valores = this.formItem.getRawValue();
    const dados = {
      id_material: material.id,
      id_usuario: this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id,
      data_emprestimo: valores.dataEmprestimo || null,
      data_devolucao: valores.dataDevolucao || null,
      situacao: valores.situacao as SituacaoEmprestimo,
      renovacao: valores.renovacao || null
    };

    // Empréstimo ainda em criação (sem id): junta o item num array local
    // em vez de chamar a API — mesmo padrão de `ComposicaoFamiliarTabComponent`.
    if (this.emprestimoId === null) {
      const emEdicao = this.itemEmEdicao();
      // Mesma regra do backend (`_verificar_material_duplicado`): não dá
      // pra emprestar o mesmo material duas vezes na mesma ficha — aqui
      // ainda não existe round-trip pra API validar, então checa local.
      const jaIncluido = this.itensLocais().some(
        (i) => i.idMaterial === dados.id_material && i.situacao !== 'Devolvido' && i.id !== emEdicao?.id
      );
      if (jaIncluido) {
        this.erro.set('Este material já está incluído neste empréstimo.');
        return;
      }

      const item: EmprestimoItem = {
        id: emEdicao?.id ?? this.proximoIdItemLocal--,
        idEmprestimo: 0,
        idMaterial: dados.id_material,
        dataEmprestimo: dados.data_emprestimo,
        dataDevolucao: dados.data_devolucao,
        dataDevolucaoEfetiva: null,
        situacao: dados.situacao,
        renovacao: dados.renovacao,
        // Item ainda não persistido — descrição/foto reais só existem depois
        // que o empréstimo é salvo e os itens vêm da API (ver EmprestimoItem).
        descricaoMaterial: material.descricao,
        temFotoMaterial: false,
        numeroPatrimonioMaterial: material.numeroPatrimonio
      };
      this.itensLocais.update((atuais) =>
        emEdicao ? atuais.map((i) => (i.id === item.id ? item : i)) : [...atuais, item]
      );
      this.descricoesMateriais.update((mapa) => ({ ...mapa, [material.id]: material.descricao }));
      this.patrimoniosMateriais.update((mapa) => ({ ...mapa, [material.id]: material.numeroPatrimonio }));
      this.formItemAberto.set(false);
      return;
    }

    this.salvandoItem.set(true);
    this.erro.set(null);

    const emEdicao = this.itemEmEdicao();
    const operacao = emEdicao
      ? this.emprestimoService.atualizarItem(this.emprestimoId, emEdicao.id, dados)
      : this.emprestimoService.adicionarItem(this.emprestimoId, dados);

    operacao.subscribe({
      next: () => {
        this.salvandoItem.set(false);
        this.formItemAberto.set(false);
        this.carregarItens();
        this.carregarHistorico();
        // Situação do cabeçalho é recalculada pelo backend a cada item
        // salvo (ver emprestimo.legacy.md) — busca de novo pra refletir.
        this.emprestimoService.buscar(this.emprestimoId!).subscribe((emprestimo) => {
          this.situacaoAtual.set(emprestimo.situacao);
        });
      },
      error: (error) => {
        this.salvandoItem.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  private paraItensCreateDto(idUsuario: number): EmprestimoItemCreateDto[] {
    return this.itensLocais().map((item) => ({
      id_material: item.idMaterial,
      id_usuario: idUsuario,
      data_emprestimo: item.dataEmprestimo,
      data_devolucao: item.dataDevolucao,
      situacao: item.situacao,
      renovacao: item.renovacao
    }));
  }

  private carregarItens(): void {
    if (this.emprestimoId === null) {
      return;
    }
    this.emprestimoService.listarItens(this.emprestimoId).subscribe((itens) => {
      this.itens.set(itens);
      const idsFaltantes = [...new Set(itens.map((i) => i.idMaterial))].filter(
        (id) => this.descricoesMateriais()[id] === undefined
      );
      idsFaltantes.forEach((id) => {
        this.materialService.buscar(id).subscribe((material) => {
          this.descricoesMateriais.update((mapa) => ({ ...mapa, [material.id]: material.descricao }));
          this.patrimoniosMateriais.update((mapa) => ({ ...mapa, [material.id]: material.numeroPatrimonio }));
        });
      });
    });
  }

  private carregarHistorico(): void {
    if (this.emprestimoId === null) {
      return;
    }
    this.carregandoHistorico.set(true);
    this.emprestimoService.listarHistorico(this.emprestimoId).subscribe({
      next: (historico) => {
        this.historico.set(historico);
        this.carregandoHistorico.set(false);
      },
      error: () => this.carregandoHistorico.set(false)
    });
  }

  protected nomeUsuarioHistorico(idUsuario: number): string {
    const sessao = this.auth.sessao();
    if (sessao && sessao.usuario_id === idUsuario) {
      return sessao.nome;
    }
    return `Usuário #${idUsuario}`;
  }

  protected podeAssinarContrato(): boolean {
    return !!this.assinaturaCanvas()?.obterAssinatura();
  }

  protected iniciarRenovacao(): void {
    this.erroContrato.set(null);
    this.assinandoRenovacao.set(true);
  }

  protected cancelarRenovacao(): void {
    this.assinandoRenovacao.set(false);
  }

  protected assinarContrato(tipo: TipoContrato): void {
    const assinatura = this.assinaturaCanvas()?.obterAssinatura();
    if (this.emprestimoId === null || !assinatura) {
      return;
    }

    this.erroContrato.set(null);
    this.assinandoContrato.set(true);

    this.emprestimoService
      .assinarContrato(this.emprestimoId, assinatura, tipo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assinandoContrato.set(false);
          this.assinandoRenovacao.set(false);
          this.carregarContratos();
        },
        error: (error) => {
          this.assinandoContrato.set(false);
          this.erroContrato.set(descreverErroHttp(error.error));
        }
      });
  }

  protected abrirPdfContrato(contrato: EmprestimoContrato): void {
    if (this.emprestimoId === null) {
      return;
    }
    this.emprestimoService
      .obterPdfContrato(this.emprestimoId, contrato.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.revogarPdfContratoUrl();
          const url = URL.createObjectURL(blob);
          this.pdfContratoUrl.set(url);
          window.open(url, '_blank');
        },
        error: () => this.erroContrato.set('Não foi possível carregar o PDF do contrato.')
      });
  }

  private carregarContratos(): void {
    if (this.emprestimoId === null) {
      return;
    }
    this.carregandoContrato.set(true);
    this.emprestimoService
      .listarContratos(this.emprestimoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contratos) => {
          this.contratos.set(contratos);
          this.carregandoContrato.set(false);
        },
        error: () => {
          this.contratos.set([]);
          this.carregandoContrato.set(false);
        }
      });
  }

  private revogarPdfContratoUrl(): void {
    const url = this.pdfContratoUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
