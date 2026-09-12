import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MaterialService } from '../material.service';
import { MaterialResumo } from '../material.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { DetalheDialogComponent } from '../../../shared/ui/detalhe-dialog/detalhe-dialog.component';

const ITENS_POR_PAGINA = 20;

@Component({
  selector: 'app-material-consulta-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, PaginaConsultaComponent],
  templateUrl: './material-consulta.page.html'
})
export class MaterialConsultaPage {
  private readonly materialService = inject(MaterialService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  protected readonly termoBusca = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<MaterialResumo[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly exportando = signal(false);

  protected readonly itensPorPagina = ITENS_POR_PAGINA;

  constructor() {
    this.consultar();
  }

  protected fotoThumbUrl(id: number): string {
    return this.materialService.fotoThumbUrl(id);
  }

  protected visualizar(material: MaterialResumo): void {
    this.dialog.open(DetalheDialogComponent, {
      width: '420px',
      data: {
        titulo: material.descricao,
        campos: [
          { rotulo: 'Situação', valor: material.situacao },
          { rotulo: 'Disponível p/ empréstimo', valor: material.disponivelEmprestimo ? 'Sim' : 'Não' }
        ],
        linkEditar: ['/materiais', material.id, 'editar'],
        labelEditar: 'Editar material'
      }
    });
  }

  protected exportarCsv(): void {
    this.exportando.set(true);
    this.materialService.listar({ busca: this.termoBusca().trim() || undefined, take: 2000 }).subscribe({
      next: (resultado) => {
        exportarCsv(
          'materiais.csv',
          ['Descrição', 'Situação', 'Disponível p/ empréstimo'],
          resultado.items.map((m) => [m.descricao, m.situacao, m.disponivelEmprestimo ? 'Sim' : 'Não'])
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

    this.materialService
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
          this.erro.set('Não foi possível carregar a lista de materiais.');
          this.carregando.set(false);
        }
      });
  }
}
