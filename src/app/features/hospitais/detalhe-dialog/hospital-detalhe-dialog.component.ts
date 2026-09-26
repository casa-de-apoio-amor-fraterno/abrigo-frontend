import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Hospital } from '../hospital.model';
import { HospitalService } from '../hospital.service';

export interface HospitalDetalheDialogData {
  hospitalId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de hospitais). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de um hospital — modelo é enxuto (id, nome,
 * ativo), então só troca o "Status" em texto do `DetalheDialogComponent`
 * genérico por uma pill (ver docs/planning-detalhe-dialogs.md). */
@Component({
  selector: 'app-hospital-detalhe-dialog',
  imports: [RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './hospital-detalhe-dialog.component.html',
  styleUrl: './hospital-detalhe-dialog.component.scss'
})
export class HospitalDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<HospitalDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<HospitalDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly hospitalService = inject(HospitalService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly hospital = signal<Hospital | null>(null);

  constructor() {
    this.hospitalService.buscar(this.data.hospitalId).subscribe({
      next: (hospital) => {
        this.hospital.set(hospital);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do hospital.');
        this.carregando.set(false);
      }
    });
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
