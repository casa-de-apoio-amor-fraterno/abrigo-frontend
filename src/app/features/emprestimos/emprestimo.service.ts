import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EmprestimoContratoDto,
  EmprestimoCreateDto,
  EmprestimoDto,
  EmprestimoHistoricoDto,
  EmprestimoItemCreateDto,
  EmprestimoItemDto,
  EmprestimoItemUpdateDto,
  EmprestimoUpdateDto,
  ListaEmprestimosDto
} from './emprestimo.dto';
import {
  paraContratoModel,
  paraHistoricoModel,
  paraItemModel,
  paraListaModel,
  paraModel
} from './emprestimo.mapper';
import {
  Emprestimo,
  EmprestimoContrato,
  EmprestimoHistorico,
  EmprestimoItem,
  ListaEmprestimos
} from './emprestimo.model';

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

  devolver(id: number, idUsuario: number, dataDevolucao?: string): Observable<Emprestimo> {
    const corpo: { id_usuario: number; data_devolucao?: string } = { id_usuario: idUsuario };
    if (dataDevolucao) {
      corpo.data_devolucao = dataDevolucao;
    }
    return this.http.post<EmprestimoDto>(`${this.resource}/${id}/devolver`, corpo).pipe(map(paraModel));
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

  /** `404` quando o empréstimo ainda não tem contrato assinado — o
   * componente que chama isso trata o erro como "ainda não assinado", não
   * como falha de verdade. */
  buscarContrato(emprestimoId: number): Observable<EmprestimoContrato> {
    return this.http
      .get<EmprestimoContratoDto>(`${this.resource}/${emprestimoId}/contrato`)
      .pipe(map(paraContratoModel));
  }

  obterPdfContrato(emprestimoId: number): Observable<Blob> {
    return this.http.get(`${this.resource}/${emprestimoId}/contrato/pdf`, { responseType: 'blob' });
  }

  /** Assina o contrato (gera o PDF com o texto real do modelo — ver
   * `app/features/emprestimos/service.py` no backend — colando a
   * assinatura capturada no canvas). Um contrato por empréstimo: assinar
   * de novo retorna 409. */
  assinarContrato(emprestimoId: number, assinaturaPngBase64: string): Observable<EmprestimoContrato> {
    return this.http
      .post<EmprestimoContratoDto>(`${this.resource}/${emprestimoId}/contrato`, {
        assinatura_png_base64: assinaturaPngBase64
      })
      .pipe(map(paraContratoModel));
  }
}
