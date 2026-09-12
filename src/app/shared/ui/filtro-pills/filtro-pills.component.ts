import { Component, input, output } from '@angular/core';

export interface OpcaoFiltroPill {
  valor: string;
  rotulo: string;
}

/**
 * Filtro de situação em pills segmentados — substitui o `mat-select` usado
 * antes nas telas de Consulta (empréstimos, estadias, solicitações de
 * cadastro): só 3-4 opções fixas cada, não precisam do overhead de abrir
 * um dropdown pra escolher.
 */
@Component({
  selector: 'app-filtro-pills',
  templateUrl: './filtro-pills.component.html',
  styleUrl: './filtro-pills.component.scss'
})
export class FiltroPillsComponent {
  readonly opcoes = input.required<OpcaoFiltroPill[]>();
  readonly valor = input<string>('');
  readonly mudanca = output<string>();

  protected selecionar(valor: string): void {
    this.mudanca.emit(valor);
  }
}
