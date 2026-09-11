import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { MaterialAutocompleteComponent } from '../../../shared/ui/material-autocomplete/material-autocomplete.component';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { MaterialService } from '../../materiais/material.service';
import { EmprestimoService } from '../emprestimo.service';
import { EmprestimoHistorico, EmprestimoItem } from '../emprestimo.model';
import { PaginaCadastroComponent } from '../../../shared/ui/pagina-cadastro/pagina-cadastro.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';

@Component({
  selector: 'app-emprestimo-cadastro-page',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MaterialAutocompleteComponent,
    PessoaAutocompleteComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PaginaCadastroComponent,
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

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly pessoaSelecionada = signal<{ id: number; nome: string } | null>(null);
  protected readonly idUsuarioOriginal = signal<number | null>(null);

  protected readonly itens = signal<EmprestimoItem[]>([]);
  protected readonly descricoesMateriais = signal<Record<number, string>>({});
  protected readonly formItemAberto = signal(false);
  protected readonly salvandoItem = signal(false);
  protected readonly materialSelecionado = signal<{ id: number; descricao: string } | null>(null);
  protected readonly itemEmEdicao = signal<EmprestimoItem | null>(null);

  protected readonly historico = signal<EmprestimoHistorico[]>([]);
  protected readonly carregandoHistorico = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    numeroContrato: [''],
    situacao: ['Pendente', [Validators.required]],
    observacao: ['']
  });

  protected readonly formItem = this.fb.nonNullable.group({
    dataEmprestimo: [''],
    dataDevolucao: [''],
    situacao: [''],
    renovacao: ['']
  });

  constructor() {
    if (this.emprestimoId !== null) {
      this.emprestimoService.buscar(this.emprestimoId).subscribe({
        next: (emprestimo) => {
          this.form.patchValue({
            numeroContrato: emprestimo.numeroContrato ?? '',
            situacao: emprestimo.situacao,
            observacao: emprestimo.observacao ?? ''
          });
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
    const dados = {
      id_pessoa: this.pessoaSelecionada()!.id,
      id_usuario: this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id,
      situacao: valores.situacao,
      numero_contrato: valores.numeroContrato || null,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.emprestimoId !== null
        ? this.emprestimoService.atualizar(this.emprestimoId, dados)
        : this.emprestimoService.criar(dados);

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
    this.formItem.reset({ dataEmprestimo: '', dataDevolucao: '', situacao: '', renovacao: '' });
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
      situacao: item.situacao ?? '',
      renovacao: item.renovacao ?? ''
    });
    this.erro.set(null);
    this.formItemAberto.set(true);
  }

  protected cancelarItem(): void {
    this.formItemAberto.set(false);
  }

  protected salvarItem(): void {
    if (this.emprestimoId === null || this.materialSelecionado() === null) {
      this.erro.set('Selecione o material do item.');
      return;
    }

    const valores = this.formItem.getRawValue();
    const dados = {
      id_material: this.materialSelecionado()!.id,
      id_usuario: this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id,
      data_emprestimo: valores.dataEmprestimo || null,
      data_devolucao: valores.dataDevolucao || null,
      situacao: valores.situacao || null,
      renovacao: valores.renovacao || null
    };

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
      },
      error: (error) => {
        this.salvandoItem.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
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
