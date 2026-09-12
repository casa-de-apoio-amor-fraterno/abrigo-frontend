import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface DetalheDialogCampo {
  rotulo: string;
  valor: string;
}

export interface DetalheDialogData {
  titulo: string;
  campos: DetalheDialogCampo[];
  linkEditar: unknown[];
  labelEditar?: string;
  /** Exibida à direita dos campos, quando informada (ver Pessoa.tem_foto). */
  fotoUrl?: string | null;
}

@Component({
  selector: 'app-detalhe-dialog',
  imports: [RouterLink, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './detalhe-dialog.component.html',
  styleUrl: './detalhe-dialog.component.scss'
})
export class DetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<DetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<DetalheDialogData>(MAT_DIALOG_DATA);
}
