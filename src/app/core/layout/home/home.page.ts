import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../auth/auth.service';
import { QuartoService } from '../../../features/quartos/quarto.service';
import { QuartoOcupacao } from '../../../features/quartos/quarto.model';

/** Placeholder puramente visual — não representa uma pessoa/estadia real,
 * só "aqui cabe mais um leito". */
type LeitoVago = { vago: true };

@Component({
  selector: 'app-home-page',
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  private readonly quartoService = inject(QuartoService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly quartos = signal<QuartoOcupacao[]>([]);
  protected readonly revisaoAberta = signal<number | null>(null);

  constructor() {
    this.quartoService.listarOcupacao().subscribe({
      next: (quartos) => {
        this.quartos.set(quartos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a ocupação dos quartos.');
        this.carregando.set(false);
      }
    });
  }

  protected leitosVagos(quarto: QuartoOcupacao): LeitoVago[] {
    const vagos = Math.max(quarto.leito - quarto.ocupantes.length, 0);
    return Array.from({ length: vagos }, () => ({ vago: true }));
  }

  protected alternarRevisao(quartoId: number): void {
    this.revisaoAberta.update((atual) => (atual === quartoId ? null : quartoId));
  }

  protected get totalLeitos(): number {
    return this.quartos().reduce((soma, q) => soma + q.leito, 0);
  }

  protected get totalOcupados(): number {
    return this.quartos().reduce((soma, q) => soma + q.ocupantes.length, 0);
  }

  protected get totalPendentesRevisao(): number {
    return this.quartos().reduce((soma, q) => soma + q.pendentesRevisao.length, 0);
  }
}
