import { Component, input, output } from '@angular/core';

export interface OpcaoFiltroPill {
  valor: string;
  rotulo: string;
  /** Cor de destaque quando ativa, além da cor padrão (primária) — pra
   * situações que se beneficiam de ficar visualmente distinguíveis das
   * outras (ex.: `SituacaoEstadia`, ver estadia-consulta/cadastro). */
  variante?: 'aviso' | 'erro';
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
