import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { descreverErroHttp } from '../../../core/http/api-error';
import { ComposicaoFamiliarCreateDto } from './composicao-familiar.dto';
import { ComposicaoFamiliar } from './composicao-familiar.model';
import { ComposicaoFamiliarService } from './composicao-familiar.service';

/** Aba "Composição Familiar" da tela de Pessoa — espelha a grade editável de
 * `untFrmManutencaoComposicaoFamiliar` do legado (nome/idade/parentesco/
 * estado civil/renda/ocupação, com criação, edição e exclusão de membros). */
@Component({
  selector: 'app-composicao-familiar-tab',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './composicao-familiar-tab.component.html',
  styleUrl: './composicao-familiar-tab.component.scss'
})
export class ComposicaoFamiliarTabComponent {
  readonly pessoaId = input<number>(0);

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ComposicaoFamiliarService);

  protected readonly colunas = ['nome', 'idade', 'grauParentesco', 'estadoCivil', 'renda', 'ocupacao', 'acoes'];

  protected readonly membros = signal<ComposicaoFamiliar[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly formAberto = signal(false);
  protected readonly membroEmEdicao = signal<ComposicaoFamiliar | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    idade: [''],
    grauParentesco: ['', [Validators.required]],
    estadoCivil: [''],
    renda: [''],
    ocupacao: ['']
  });

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.pessoaId()).subscribe({
      next: (membros) => {
        this.membros.set(membros);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a composição familiar.');
        this.carregando.set(false);
      }
    });
  }

  protected novoMembro(): void {
    this.membroEmEdicao.set(null);
    this.form.reset({ nome: '', idade: '', grauParentesco: '', estadoCivil: '', renda: '', ocupacao: '' });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected editar(membro: ComposicaoFamiliar): void {
    this.membroEmEdicao.set(membro);
    this.form.reset({
      nome: membro.nome,
      idade: membro.idade ?? '',
      grauParentesco: membro.grauParentesco,
      estadoCivil: membro.estadoCivil ?? '',
      renda: membro.renda ?? '',
      ocupacao: membro.ocupacao ?? ''
    });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected cancelar(): void {
    this.formAberto.set(false);
  }

  protected remover(membro: ComposicaoFamiliar): void {
    if (!confirm(`Remover ${membro.nome} da composição familiar?`)) {
      return;
    }

    this.service.remover(this.pessoaId(), membro.id).subscribe({
      next: () => this.carregar(),
      error: (error) => this.erro.set(descreverErroHttp(error.error))
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dados: ComposicaoFamiliarCreateDto = {
      nome: valores.nome,
      idade: valores.idade || null,
      grau_parentesco: valores.grauParentesco,
      estado_civil: valores.estadoCivil || null,
      renda: valores.renda || null,
      ocupacao: valores.ocupacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const emEdicao = this.membroEmEdicao();
    const operacao = emEdicao
      ? this.service.atualizar(this.pessoaId(), emEdicao.id, dados)
      : this.service.criar(this.pessoaId(), dados);

    operacao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.carregar();
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
