import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { CapturaFotoComponent } from '../../../shared/ui/captura-foto/captura-foto.component';
import { SolicitacaoCadastroService } from '../solicitacao-cadastro.service';

/**
 * Auto-cadastro público de paciente (feature nova, sem equivalente no
 * legado) — acessível sem login a partir da tela de login ("Sou
 * paciente"), pensado pro próprio celular da pessoa (câmera pra foto, ver
 * `CapturaFotoComponent`). Cria uma `SolicitacaoCadastroPaciente`
 * `Pendente`, não uma `Pessoa` de verdade — só vira `Pessoa` quando um
 * usuário do sistema aprova (ver solicitacao-cadastro-consulta.page.ts).
 */
@Component({
  selector: 'app-solicitacao-cadastro-publico-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CapturaFotoComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './solicitacao-cadastro-publico.page.html',
  styleUrl: './solicitacao-cadastro-publico.page.scss'
})
export class SolicitacaoCadastroPublicoPage {
  private readonly fb = inject(FormBuilder);
  private readonly solicitacaoService = inject(SolicitacaoCadastroService);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly fotoLocal = signal<Blob | null>(null);
  protected readonly fotoLocalUrl = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    dataNascimento: ['', [Validators.required]],
    cpf: [''],
    telefone: ['']
  });

  protected capturarFoto(arquivo: Blob): void {
    const anterior = this.fotoLocalUrl();
    if (anterior) {
      URL.revokeObjectURL(anterior);
    }
    this.fotoLocal.set(arquivo);
    this.fotoLocalUrl.set(URL.createObjectURL(arquivo));
  }

  protected removerFoto(): void {
    const anterior = this.fotoLocalUrl();
    if (anterior) {
      URL.revokeObjectURL(anterior);
    }
    this.fotoLocal.set(null);
    this.fotoLocalUrl.set(null);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set(null);

    this.solicitacaoService
      .criar({
        nome: valores.nome,
        dataNascimento: valores.dataNascimento,
        cpf: valores.cpf || null,
        telefone: valores.telefone || null,
        foto: this.fotoLocal()
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.enviado.set(true);
        },
        error: (error) => {
          this.enviando.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
  }
}
