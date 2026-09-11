import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { VoluntarioService } from '../voluntario.service';
import { VoluntarioResumo } from '../voluntario.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';

const ITENS_POR_PAGINA = 20;

@Component({
  selector: 'app-voluntario-consulta-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, PaginaConsultaComponent],
  templateUrl: './voluntario-consulta.page.html'
})
export class VoluntarioConsultaPage {
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly route = inject(ActivatedRoute);

  protected readonly termoBusca = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<VoluntarioResumo[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly exportando = signal(false);

  protected readonly itensPorPagina = ITENS_POR_PAGINA;

  constructor() {
    this.consultar();
  }

  protected exportarCsv(): void {
    this.exportando.set(true);
    this.voluntarioService.listar({ busca: this.termoBusca().trim() || undefined, take: 2000 }).subscribe({
      next: (resultado) => {
        exportarCsv(
          'voluntarios.csv',
          ['Nome', 'Telefone', 'Setor'],
          resultado.items.map((v) => [v.nome, v.telefone, v.setor])
        );
        this.exportando.set(false);
      },
      error: () => this.exportando.set(false)
    });
  }

  protected buscar(): void {
    this.pagina.set(0);
    this.consultar();
  }

  protected paginaAnterior(): void {
    if (this.pagina() === 0) {
      return;
    }
    this.pagina.update((p) => p - 1);
    this.consultar();
  }

  protected proximaPagina(): void {
    if ((this.pagina() + 1) * ITENS_POR_PAGINA >= this.total()) {
      return;
    }
    this.pagina.update((p) => p + 1);
    this.consultar();
  }

  private consultar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.voluntarioService
      .listar({
        busca: this.termoBusca().trim() || undefined,
        skip: this.pagina() * ITENS_POR_PAGINA,
        take: ITENS_POR_PAGINA
      })
      .subscribe({
        next: (resultado) => {
          this.itens.set(resultado.items);
          this.total.set(resultado.total);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar a lista de voluntários.');
          this.carregando.set(false);
        }
      });
  }
}
