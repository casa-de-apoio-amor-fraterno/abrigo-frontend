import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { HospitalService } from '../hospital.service';
import { Hospital } from '../hospital.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { DetalheDialogComponent } from '../../../shared/ui/detalhe-dialog/detalhe-dialog.component';

@Component({
  selector: 'app-hospital-consulta-page',
  imports: [RouterLink, RouterOutlet, MatButtonModule, MatIconModule, MatSlideToggleModule, PaginaConsultaComponent],
  templateUrl: './hospital-consulta.page.html',
  styleUrl: './hospital-consulta.page.scss'
})
export class HospitalConsultaPage {
  private readonly hospitalService = inject(HospitalService);
  private readonly dialog = inject(MatDialog);

  protected readonly termoBusca = signal('');
  protected readonly mostrarInativos = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly hospitais = signal<Hospital[]>([]);

  protected readonly itensFiltrados = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.hospitais();
    }
    return this.hospitais().filter((hospital) => hospital.nome.toLowerCase().includes(termo));
  });

  constructor() {
    this.consultar();
  }

  protected visualizar(hospital: Hospital): void {
    this.dialog.open(DetalheDialogComponent, {
      width: '420px',
      data: {
        titulo: hospital.nome,
        campos: [{ rotulo: 'Status', valor: hospital.ativo ? 'Ativo' : 'Inativo' }],
        linkEditar: ['/hospitais', hospital.id, 'editar'],
        labelEditar: 'Editar hospital'
      }
    });
  }

  protected alternarMostrarInativos(): void {
    this.mostrarInativos.update((valor) => !valor);
    this.consultar();
  }

  protected exportarCsv(): void {
    exportarCsv(
      'hospitais.csv',
      ['Nome', 'Status'],
      this.itensFiltrados().map((h) => [h.nome, h.ativo ? 'Ativo' : 'Inativo'])
    );
  }

  private consultar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.hospitalService.listar(!this.mostrarInativos()).subscribe({
      next: (hospitais) => {
        this.hospitais.set(hospitais);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a lista de hospitais.');
        this.carregando.set(false);
      }
    });
  }
}
