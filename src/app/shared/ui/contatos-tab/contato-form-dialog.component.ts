import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { ContatoService } from '../../data/contato/contato.service';
import { Contato, ContatoFormulario } from '../../data/contato/contato.model';

export interface ContatoFormDialogData {
  recursoBase: string;
  contato: Contato | null;
  // Modo local (ver contatos-tab.component.ts `modoLocal`): dono ainda não
  // existe (ex.: pessoa em criação), então este popup não chama a API —
  // só devolve os dados digitados pro chamador guardar num array local.
  modoLocal?: boolean;
}

export type ContatoFormDialogResultado =
  | { tipo: 'persistido' }
  | { tipo: 'local-salvar'; dados: ContatoFormulario }
  | { tipo: 'local-remover' };

/**
 * Popup próprio de novo/editar contato — antes era um formulário que
 * trocava de lugar com a lista dentro do mesmo popup de cadastro, o que
 * parecia "um popup dentro do outro" sem nenhuma separação visual (sem
 * backdrop/elevação própria). Como MatDialog de verdade, empilha por cima
 * do popup de cadastro com seu próprio backdrop.
 */
@Component({
  selector: 'app-contato-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contato-form-dialog.component.html',
  styleUrl: './contato-form-dialog.component.scss'
})
export class ContatoFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ContatoService);
  protected readonly dialogRef = inject(MatDialogRef<ContatoFormDialogComponent, ContatoFormDialogResultado>);
  protected readonly data = inject<ContatoFormDialogData>(MAT_DIALOG_DATA);

  protected readonly modoEdicao = this.data.contato !== null;

  protected readonly salvando = signal(false);
  protected readonly removendo = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    numero: [this.data.contato?.numero ?? '', [Validators.required]],
    nomeContato: [this.data.contato?.nomeContato ?? ''],
    observacao: [this.data.contato?.observacao ?? ''],
    principal: [this.data.contato?.principal ?? false]
  });

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dados: ContatoFormulario = {
      numero: valores.numero,
      nomeContato: valores.nomeContato || null,
      observacao: valores.observacao || null,
      principal: valores.principal
    };

    if (this.data.modoLocal) {
      this.dialogRef.close({ tipo: 'local-salvar', dados });
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);

    const contato = this.data.contato;
    const operacao = contato
      ? this.service.atualizar(this.data.recursoBase, contato.id, dados)
      : this.service.criar(this.data.recursoBase, dados);

    operacao.subscribe({
      next: () => this.dialogRef.close({ tipo: 'persistido' }),
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected remover(): void {
    const contato = this.data.contato;
    if (!contato || !confirm(`Remover o contato ${contato.numero}?`)) {
      return;
    }

    if (this.data.modoLocal) {
      this.dialogRef.close({ tipo: 'local-remover' });
      return;
    }

    this.removendo.set(true);
    this.erro.set(null);

    this.service.remover(this.data.recursoBase, contato.id).subscribe({
      next: () => this.dialogRef.close({ tipo: 'persistido' }),
      error: (error) => {
        this.removendo.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
