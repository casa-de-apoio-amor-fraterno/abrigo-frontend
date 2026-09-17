import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type TipoRelatorio = 'pessoas' | 'estadias' | 'materiais' | 'emprestimos';

export type PeriodoRelatorio = 'semanal' | 'quinzenal' | 'mensal' | 'semestral' | 'anual';

export interface RelatorioDisponivel {
  tipo: TipoRelatorio;
  titulo: string;
  descricao: string;
  icone: string;
  /** Materiais não tem campo de data no legado (ver
   * `app/features/relatorios/schemas.py` no backend) — não faz sentido
   * filtrar por período. */
  suportaPeriodo: boolean;
}

export interface RelatorioResumoItem {
  rotulo: string;
  valor: string;
}

/** Metadados dos relatórios disponíveis — usado tanto pela lista
 * (`relatorios-dashboard.page`) quanto pela tela de detalhe/geração
 * (`relatorio-detalhe.page`), pra não duplicar título/descrição/ícone. */
export const RELATORIOS_DISPONIVEIS: RelatorioDisponivel[] = [
  {
    tipo: 'pessoas',
    titulo: 'Pessoas',
    descricao: 'Lista de pessoas cadastradas.',
    icone: 'groups',
    suportaPeriodo: true
  },
  {
    tipo: 'estadias',
    titulo: 'Estadias',
    descricao: 'Estadias registradas nos quartos.',
    icone: 'hotel',
    suportaPeriodo: true
  },
  {
    tipo: 'materiais',
    titulo: 'Materiais',
    descricao: 'Materiais do Empréstimo Solidário.',
    icone: 'category',
    suportaPeriodo: false
  },
  {
    tipo: 'emprestimos',
    titulo: 'Empréstimos',
    descricao: 'Empréstimos e seus itens.',
    icone: 'inventory_2',
    suportaPeriodo: true
  }
];

export const OPCOES_PERIODO_RELATORIO: { valor: PeriodoRelatorio; rotulo: string }[] = [
  { valor: 'semanal', rotulo: 'Semanal' },
  { valor: 'quinzenal', rotulo: 'Quinzenal' },
  { valor: 'mensal', rotulo: 'Mensal' },
  { valor: 'semestral', rotulo: 'Semestral' },
  { valor: 'anual', rotulo: 'Anual' }
];

/** Relatórios em PDF (listagens gerais) — diferente do contrato de
 * empréstimo (ver `ContratoDemoService`), gerados sob demanda a partir do
 * estado atual do banco, sem persistência. Ver
 * `app/features/relatorios/router.py` no backend. */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/relatorios`;

  gerarPdf(tipo: TipoRelatorio, periodo?: PeriodoRelatorio): Observable<Blob> {
    return this.http.get(`${this.resource}/${tipo}/pdf`, {
      responseType: 'blob',
      params: this.paramsPeriodo(periodo)
    });
  }

  buscarResumo(tipo: TipoRelatorio, periodo?: PeriodoRelatorio): Observable<{ itens: RelatorioResumoItem[] }> {
    return this.http.get<{ itens: RelatorioResumoItem[] }>(`${this.resource}/${tipo}/resumo`, {
      params: this.paramsPeriodo(periodo)
    });
  }

  private paramsPeriodo(periodo?: PeriodoRelatorio): HttpParams {
    return periodo ? new HttpParams().set('periodo', periodo) : new HttpParams();
  }
}
