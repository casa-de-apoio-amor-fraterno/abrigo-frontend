import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { QuartoService } from '../quarto.service';

@Component({
  selector: 'app-quarto-cadastro-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './quarto-cadastro.page.html',
  styleUrl: './quarto-cadastro.page.scss'
})
export class QuartoCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly quartoService = inject(QuartoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly quartoId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.quartoId !== null;

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly inativando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly ativo = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    numero: ['', [Validators.required]],
    leito: ['', [Validators.required]],
    descricao: ['']
  });

  constructor() {
    if (this.quartoId !== null) {
      this.quartoService.buscar(this.quartoId).subscribe({
        next: (quarto) => {
          this.form.patchValue({
            numero: quarto.numero,
            leito: quarto.leito,
            descricao: quarto.descricao ?? ''
          });
          this.ativo.set(quarto.ativo);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do quarto.');
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
      numero: valores.numero,
      leito: valores.leito,
      descricao: valores.descricao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.quartoId !== null
        ? this.quartoService.atualizar(this.quartoId, dados)
        : this.quartoService.criar(dados);

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/quartos');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected inativar(): void {
    if (this.quartoId === null || !confirm('Inativar este quarto? Ele deixará de aparecer nas seleções de estadia.')) {
      return;
    }

    this.inativando.set(true);
    this.erro.set(null);

    this.quartoService.inativar(this.quartoId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/quartos');
      },
      error: (error) => {
        this.inativando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
