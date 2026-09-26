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
  /** Ignorado quando `aoEditar` é informado (ver abaixo). */
  linkEditar?: unknown[];
  labelEditar?: string;
  /** Abre a edição sem navegar (ex.: um MatDialog aberto direto por cima
   * da tela atual, como o popup "Ver" dos vencimentos na tela Início) —
   * quando informada, o botão chama isso em vez de navegar por
   * `linkEditar`. Só uma função comum passada no `data` do MAT_DIALOG_DATA,
   * não serializada — funciona porque o dialog roda no mesmo runtime JS. */
  aoEditar?: () => void;
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

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
