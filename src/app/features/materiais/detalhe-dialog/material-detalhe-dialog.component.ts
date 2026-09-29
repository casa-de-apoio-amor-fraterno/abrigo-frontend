import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Material } from '../material.model';
import { MaterialService } from '../material.service';
import { MaterialLocalService } from '../../materiais-locais/material-local.service';

export interface MaterialDetalheDialogData {
  materialId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de materiais). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de um material — descrição, local, observação e
 * motivo da inutilização (quando aplicável), com a situação em destaque como
 * pill. Antes usava o `DetalheDialogComponent` genérico só com Nº
 * patrimônio/situação/disponibilidade (ver docs/planning-detalhe-dialogs.md);
 * esse aqui busca o material completo em vez de depender só do que a
 * listagem já tinha em mãos. */
@Component({
  selector: 'app-material-detalhe-dialog',
  imports: [RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './material-detalhe-dialog.component.html',
  styleUrl: './material-detalhe-dialog.component.scss'
})
export class MaterialDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<MaterialDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<MaterialDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly materialService = inject(MaterialService);
  private readonly materialLocalService = inject(MaterialLocalService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly material = signal<Material | null>(null);
  protected readonly nomeLocal = signal<string | null>(null);

  constructor() {
    this.materialService.buscar(this.data.materialId).subscribe({
      next: (material) => {
        this.material.set(material);
        this.carregando.set(false);
        this.materialLocalService.listar(false).subscribe((locais) => {
          this.nomeLocal.set(locais.find((l) => l.id === material.idLocal)?.nome ?? null);
        });
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do material.');
        this.carregando.set(false);
      }
    });
  }

  protected fotoUrl(id: number): string {
    return this.materialService.fotoUrl(id);
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
