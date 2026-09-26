import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmprestimoContrato } from '../emprestimo.model';
import { EmprestimoService } from '../emprestimo.service';

export interface ContratosDialogData {
  emprestimoId: number;
  nomePessoa: string;
}

/** Consulta rápida dos contratos de um empréstimo (comodato original +
 * termos de renovação, ver `emprestimo.legacy.md`) sem precisar abrir o
 * cadastro em modo de edição — usada pelo botão "Ver contratos" na
 * listagem. */
@Component({
  selector: 'app-contratos-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './contratos-dialog.component.html',
  styleUrl: './contratos-dialog.component.scss'
})
export class ContratosDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<ContratosDialogComponent>>(MatDialogRef);
  protected readonly data = inject<ContratosDialogData>(MAT_DIALOG_DATA);
  private readonly emprestimoService = inject(EmprestimoService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly contratos = signal<EmprestimoContrato[]>([]);

  constructor() {
    this.emprestimoService.listarContratos(this.data.emprestimoId).subscribe({
      next: (contratos) => {
        this.contratos.set(contratos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os contratos deste empréstimo.');
        this.carregando.set(false);
      }
    });
  }

  protected rotuloTipo(contrato: EmprestimoContrato): string {
    return contrato.tipo === 'Comodato' ? 'Contrato de comodato' : 'Termo de renovação';
  }

  protected abrirPdf(contrato: EmprestimoContrato): void {
    this.emprestimoService.obterPdfContrato(this.data.emprestimoId, contrato.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Best-effort: o navegador já carregou/baixou o PDF nesse ponto; dá
      // uma folga antes de revogar pra não invalidar a URL numa aba que
      // ainda está terminando de renderizar.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }
}
