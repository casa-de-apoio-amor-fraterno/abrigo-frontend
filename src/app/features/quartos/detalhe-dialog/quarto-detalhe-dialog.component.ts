import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Quarto, QuartoOcupante } from '../quarto.model';
import { QuartoService } from '../quarto.service';

export interface QuartoDetalheDialogData {
  quartoId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de quartos). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de um quarto — leito(s), descrição e quem está
 * ocupando cada leito agora (mesmo dado de `QuartoOcupacao`, já usado na
 * tela Início), com o status em destaque como pill. Antes usava o
 * `DetalheDialogComponent` genérico só com leito/descrição/status como
 * texto (ver docs/planning-detalhe-dialogs.md). */
@Component({
  selector: 'app-quarto-detalhe-dialog',
  imports: [DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './quarto-detalhe-dialog.component.html',
  styleUrl: './quarto-detalhe-dialog.component.scss'
})
export class QuartoDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<QuartoDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<QuartoDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly quartoService = inject(QuartoService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly quarto = signal<Quarto | null>(null);
  protected readonly ocupantes = signal<QuartoOcupante[]>([]);

  constructor() {
    forkJoin({
      quarto: this.quartoService.buscar(this.data.quartoId),
      // Sem endpoint de ocupação de um quarto só — reaproveita a listagem
      // geral (mesma usada na tela Início) e filtra pelo id.
      ocupacoes: this.quartoService.listarOcupacao()
    }).subscribe({
      next: ({ quarto, ocupacoes }) => {
        this.quarto.set(quarto);
        this.ocupantes.set(ocupacoes.find((o) => o.id === quarto.id)?.ocupantes ?? []);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do quarto.');
        this.carregando.set(false);
      }
    });
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
