import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { QuartoService } from '../quarto.service';
import { Quarto } from '../quarto.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { QuartoDetalheDialogComponent } from '../detalhe-dialog/quarto-detalhe-dialog.component';
import { escutarRefrescoDaLista } from '../../../shared/ui/cadastro-dialog-host/lista-refresh.service';

@Component({
  selector: 'app-quarto-consulta-page',
  imports: [RouterLink, RouterOutlet, MatButtonModule, MatIconModule, MatSlideToggleModule, PaginaConsultaComponent],
  templateUrl: './quarto-consulta.page.html',
  styleUrl: './quarto-consulta.page.scss'
})
export class QuartoConsultaPage {
  private readonly quartoService = inject(QuartoService);
  private readonly dialog = inject(MatDialog);

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
        String(quarto.leito).includes(termo) ||
        (quarto.descricao ?? '').toLowerCase().includes(termo)
    );
  });

  constructor() {
    this.consultar();
    escutarRefrescoDaLista('/quartos', () => this.consultar());
  }

  protected visualizar(quarto: Quarto): void {
    this.dialog.open(QuartoDetalheDialogComponent, {
      width: '460px',
      data: {
        quartoId: quarto.id,
        linkEditar: ['/quartos', quarto.id, 'editar']
      }
    });
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
