import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Casca comum das telas de Consulta (cabeçalho + título/subtítulo, área de
 * filtros, estados de carregando/erro/vazio, wrapper da tabela e rodapé de
 * paginação). Cada página projeta seus próprios botões de ação, filtros e a
 * `<table>` — o markup da tabela varia por entidade, só a moldura é comum.
 */
@Component({
  selector: 'app-pagina-consulta',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pagina-consulta.component.html',
  styleUrl: './pagina-consulta.component.scss'
})
export class PaginaConsultaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly carregando = input<boolean>(false);
  readonly erro = input<string | null>(null);
  readonly vazio = input<boolean>(false);
  readonly mensagemVazio = input<string>('Nenhum item encontrado.');

  readonly paginado = input<boolean>(true);
  readonly total = input<number>(0);
  readonly pagina = input<number>(0);
  readonly itensPorPagina = input<number>(20);
  readonly rotuloItem = input<string>('item(ns)');

  readonly paginaAnterior = output<void>();
  readonly paginaProxima = output<void>();

  protected get temProximaPagina(): boolean {
    return (this.pagina() + 1) * this.itensPorPagina() < this.total();
  }
}
