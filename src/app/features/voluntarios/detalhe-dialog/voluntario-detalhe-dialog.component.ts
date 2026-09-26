import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { mascararCpf } from '../../../shared/util/cpf';
import { Voluntario } from '../voluntario.model';
import { VoluntarioService } from '../voluntario.service';

export interface VoluntarioDetalheDialogData {
  voluntarioId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de voluntários). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de um voluntário — data de nascimento, estado
 * civil, CPF, endereço, formação e observação, além do que já existia
 * (telefone, setor), com o status em destaque como pill. Antes usava o
 * `DetalheDialogComponent` genérico (ver docs/planning-detalhe-dialogs.md);
 * esse aqui busca o voluntário completo em vez de depender só do que a
 * listagem já tinha em mãos. */
@Component({
  selector: 'app-voluntario-detalhe-dialog',
  imports: [DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './voluntario-detalhe-dialog.component.html',
  styleUrl: './voluntario-detalhe-dialog.component.scss'
})
export class VoluntarioDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<VoluntarioDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<VoluntarioDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly voluntarioService = inject(VoluntarioService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly voluntario = signal<Voluntario | null>(null);

  constructor() {
    this.voluntarioService.buscar(this.data.voluntarioId).subscribe({
      next: (voluntario) => {
        this.voluntario.set(voluntario);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do voluntário.');
        this.carregando.set(false);
      }
    });
  }

  protected cpfMascarado(cpf: string): string {
    return mascararCpf(cpf);
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
