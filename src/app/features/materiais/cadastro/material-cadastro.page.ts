import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { MaterialService } from '../material.service';

@Component({
  selector: 'app-material-cadastro-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './material-cadastro.page.html',
  styleUrl: './material-cadastro.page.scss'
})
export class MaterialCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly materialService = inject(MaterialService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly materialId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.materialId !== null;

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly inativando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly ativo = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    descricao: ['', [Validators.required]],
    codigoIdentificacao: [''],
    situacao: ['', [Validators.required]],
    local: ['', [Validators.required]],
    disponivelEmprestimo: [false],
    observacao: [''],
    motivoBaixa: ['']
  });

  constructor() {
    if (this.materialId !== null) {
      this.materialService.buscar(this.materialId).subscribe({
        next: (material) => {
          this.form.patchValue({
            descricao: material.descricao,
            codigoIdentificacao: material.codigoIdentificacao ?? '',
            situacao: material.situacao,
            local: material.local,
            disponivelEmprestimo: material.disponivelEmprestimo,
            observacao: material.observacao ?? '',
            motivoBaixa: material.motivoBaixa ?? ''
          });
          this.ativo.set(material.ativo ?? true);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do material.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dados = {
      descricao: valores.descricao,
      codigo_identificacao: valores.codigoIdentificacao || null,
      situacao: valores.situacao,
      local: valores.local,
      disponivel_emprestimo: valores.disponivelEmprestimo,
      observacao: valores.observacao || null,
      motivo_baixa: valores.motivoBaixa || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.materialId !== null
        ? this.materialService.atualizar(this.materialId, dados)
        : this.materialService.criar(dados);

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/materiais');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected inativar(): void {
    if (this.materialId === null || !confirm('Inativar este material?')) {
      return;
    }

    this.inativando.set(true);
    this.erro.set(null);

    this.materialService.inativar(this.materialId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/materiais');
      },
      error: (error) => {
        this.inativando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
