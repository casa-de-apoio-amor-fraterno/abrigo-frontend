import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { QuartoService } from '../quarto.service';
import { Quarto } from '../quarto.model';
import { exportarCsv } from '../../../shared/util/csv';

@Component({
  selector: 'app-quarto-consulta-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './quarto-consulta.page.html',
  styleUrl: './quarto-consulta.page.scss'
})
export class QuartoConsultaPage {
  private readonly quartoService = inject(QuartoService);

  protected readonly termoBusca = signal('');
  protected readonly mostrarInativos = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly quartos = signal<Quarto[]>([]);

  protected readonly itensFiltrados = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.quartos();
    }
    return this.quartos().filter(
      (quarto) =>
        quarto.numero.toLowerCase().includes(termo) ||
        quarto.leito.toLowerCase().includes(termo) ||
        (quarto.descricao ?? '').toLowerCase().includes(termo)
    );
  });

  constructor() {
    this.consultar();
  }

  protected alternarMostrarInativos(): void {
    this.mostrarInativos.update((valor) => !valor);
    this.consultar();
  }

  protected exportarCsv(): void {
    exportarCsv(
      'quartos.csv',
      ['Número', 'Leito(s)', 'Descrição', 'Status'],
      this.itensFiltrados().map((q) => [q.numero, q.leito, q.descricao, q.ativo ? 'Ativo' : 'Inativo'])
    );
  }

  private consultar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.quartoService.listar(!this.mostrarInativos()).subscribe({
      next: (quartos) => {
        this.quartos.set(quartos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a lista de quartos.');
        this.carregando.set(false);
      }
    });
  }
}
