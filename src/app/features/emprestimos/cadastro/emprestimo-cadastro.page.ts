import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { MaterialAutocompleteComponent } from '../../../shared/ui/material-autocomplete/material-autocomplete.component';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { MaterialService } from '../../materiais/material.service';
import { EmprestimoItemCreateDto } from '../emprestimo.dto';
import { EmprestimoService } from '../emprestimo.service';
import { EmprestimoHistorico, EmprestimoItem, SituacaoEmprestimo } from '../emprestimo.model';
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
    CadastroAcoesComponent
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
  private readonly router = inject(Router);

  protected readonly emprestimoId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.emprestimoId !== null;

  // Itens do empréstimo já dão pra adicionar na criação (ver `itensLocais`
  // abaixo e o DTO aninhado em `EmprestimoCreate`,
  // abrigo-backend/app/features/emprestimos/schemas.py) — só Histórico
  // continua exclusivo de edição (trilha de auditoria, só existe depois
  // que o empréstimo já foi criado).
  protected readonly abas: CadastroDialogAba[] = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'itens', rotulo: 'Itens do empréstimo' },
    ...(this.modoEdicao ? [{ id: 'historico', rotulo: 'Histórico de alteração' }] : [])
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
  protected readonly formItemAberto = signal(false);
  protected readonly salvandoItem = signal(false);
  protected readonly materialSelecionado = signal<{ id: number; descricao: string } | null>(null);
  protected readonly itemEmEdicao = signal<EmprestimoItem | null>(null);

  private proximoIdItemLocal = -1;
  // Só leitura — gravada automaticamente pelo backend quando `situacao`
  // vira "Devolvido" (ver emprestimo.legacy.md / service.py).
  protected readonly itemEmEdicaoDataDevolucaoEfetiva = computed(
    () => this.itemEmEdicao()?.dataDevolucaoEfetiva ?? null
  );

  protected readonly historico = signal<EmprestimoHistorico[]>([]);
  protected readonly carregandoHistorico = signal(false);

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
    dataDevolucao: [''],
    situacao: ['Pendente'],
    renovacao: ['']
  });

  constructor() {
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

  protected selecionarMaterial(material: { id: number; descricao: string } | null): void {
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
        void this.router.navigateByUrl('/emprestimos');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected novoItem(): void {
    this.itemEmEdicao.set(null);
    this.materialSelecionado.set(null);
    this.formItem.reset({ dataEmprestimo: '', dataDevolucao: '', situacao: 'Pendente', renovacao: '' });
    this.erro.set(null);
    this.formItemAberto.set(true);
  }

  protected editarItem(item: EmprestimoItem): void {
    this.itemEmEdicao.set(item);
    const descricao = this.descricoesMateriais()[item.idMaterial];
    this.materialSelecionado.set(descricao ? { id: item.idMaterial, descricao } : null);
    this.formItem.reset({
      dataEmprestimo: item.dataEmprestimo ?? '',
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
      const item: EmprestimoItem = {
        id: emEdicao?.id ?? this.proximoIdItemLocal--,
        idEmprestimo: 0,
        idMaterial: dados.id_material,
        dataEmprestimo: dados.data_emprestimo,
        dataDevolucao: dados.data_devolucao,
        dataDevolucaoEfetiva: null,
        situacao: dados.situacao,
        renovacao: dados.renovacao
      };
      this.itensLocais.update((atuais) =>
        emEdicao ? atuais.map((i) => (i.id === item.id ? item : i)) : [...atuais, item]
      );
      this.descricoesMateriais.update((mapa) => ({ ...mapa, [material.id]: material.descricao }));
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
}
