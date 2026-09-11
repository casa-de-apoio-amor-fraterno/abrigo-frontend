import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EmprestimoCreateDto,
  EmprestimoDto,
  EmprestimoHistoricoDto,
  EmprestimoItemCreateDto,
  EmprestimoItemDto,
  EmprestimoItemUpdateDto,
  EmprestimoUpdateDto,
  ListaEmprestimosDto
} from './emprestimo.dto';
import { paraHistoricoModel, paraItemModel, paraListaModel, paraModel } from './emprestimo.mapper';
import { Emprestimo, EmprestimoHistorico, EmprestimoItem, ListaEmprestimos } from './emprestimo.model';

export interface ConsultaEmprestimosQuery {
  idPessoa?: number;
  situacao?: string;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class EmprestimoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/emprestimos`;

  listar(query: ConsultaEmprestimosQuery): Observable<ListaEmprestimos> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.idPessoa !== undefined) {
      params['id_pessoa'] = String(query.idPessoa);
    }
    if (query.situacao) {
      params['situacao'] = query.situacao;
    }

    return this.http.get<ListaEmprestimosDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Emprestimo> {
    return this.http.get<EmprestimoDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: EmprestimoCreateDto): Observable<Emprestimo> {
    return this.http.post<EmprestimoDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: EmprestimoUpdateDto): Observable<Emprestimo> {
    return this.http.put<EmprestimoDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  listarItens(emprestimoId: number): Observable<EmprestimoItem[]> {
    return this.http
      .get<EmprestimoItemDto[]>(`${this.resource}/${emprestimoId}/itens`)
      .pipe(map((itens) => itens.map(paraItemModel)));
  }

  adicionarItem(emprestimoId: number, dados: EmprestimoItemCreateDto): Observable<EmprestimoItem> {
    return this.http
      .post<EmprestimoItemDto>(`${this.resource}/${emprestimoId}/itens`, dados)
      .pipe(map(paraItemModel));
  }

  atualizarItem(
    emprestimoId: number,
    itemId: number,
    dados: EmprestimoItemUpdateDto
  ): Observable<EmprestimoItem> {
    return this.http
      .put<EmprestimoItemDto>(`${this.resource}/${emprestimoId}/itens/${itemId}`, dados)
      .pipe(map(paraItemModel));
  }

  listarHistorico(emprestimoId: number): Observable<EmprestimoHistorico[]> {
    return this.http
      .get<EmprestimoHistoricoDto[]>(`${this.resource}/${emprestimoId}/historico`)
      .pipe(map((itens) => itens.map(paraHistoricoModel)));
  }
}
