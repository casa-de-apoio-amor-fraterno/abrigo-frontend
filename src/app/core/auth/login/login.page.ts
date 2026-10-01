import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../http/api-error';
import { AuthService } from '../auth.service';

export type PerfilAcessoLogin = 'voluntario' | 'paciente';

@Component({
  selector: 'app-login-page',
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
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // "Sou paciente" não loga — leva pro auto-cadastro público
  // (/cadastro-paciente, ver SolicitacaoCadastroPublicoPage), que fica
  // pendente de aprovação da equipe. Só voluntário (equipe) usa
  // usuário/senha de verdade.
  protected readonly perfil = signal<PerfilAcessoLogin>('voluntario');

  protected readonly senhaVisivel = signal(false);
  protected readonly carregando = signal(false);
  protected readonly codigoContrato = signal('');
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    usuario: ['', [Validators.required]],
    senha: ['', [Validators.required]],
    lembrar: [false]
  });

  /** Código curto do contrato (ex.: K7M2-9PQX) — maiúsculas, com hífen
   * automático depois do 4º caractere. */
  protected digitarCodigoContrato(valor: string): void {
    const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    this.codigoContrato.set(limpo.length > 4 ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : limpo);
  }

  protected assinarContrato(): void {
    if (this.codigoContrato().length < 9) {
      return;
    }
    void this.router.navigate(['/assinar', this.codigoContrato()]);
  }

  protected alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update((valor) => !valor);
  }

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { usuario, senha } = this.form.getRawValue();
    this.carregando.set(true);
    this.erro.set(null);

    this.auth.login({ usuario, senha }).subscribe({
      next: () => {
        this.carregando.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error) => {
        this.carregando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
