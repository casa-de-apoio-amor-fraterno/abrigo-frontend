import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AlertaVencimentoEmprestimoDto,
  EmprestimoContratoDto,
  EmprestimoCreateDto,
  EmprestimoDto,
  EmprestimoHistoricoDto,
  EmprestimoItemCreateDto,
  EmprestimoItemDto,
  EmprestimoItemUpdateDto,
  EmprestimoRenovarDto,
  EmprestimoUpdateDto,
  ListaEmprestimosDto,
  TipoContrato
} from './emprestimo.dto';
import {
  paraAlertaVencimentoModel,
  paraContratoModel,
  paraHistoricoModel,
  paraItemModel,
  paraListaModel,
  paraModel
} from './emprestimo.mapper';
import {
  AlertaVencimentoEmprestimo,
  Emprestimo,
  EmprestimoContrato,
  EmprestimoHistorico,
  EmprestimoItem,
  ListaEmprestimos
} from './emprestimo.model';

export interface ConsultaEmprestimosQuery {
  idPessoa?: number;
  situacao?: string;
  busca?: string;
  /** Faixa de datas da devolução prevista (`Emprestimo.data_devolucao`
   * no backend, nível empréstimo). */
  dataDevolucaoInicio?: string;
  dataDevolucaoFim?: string;
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
    if (query.busca) {
      params['busca'] = query.busca;
    }
    if (query.dataDevolucaoInicio) {
      params['data_devolucao_inicio'] = query.dataDevolucaoInicio;
    }
    if (query.dataDevolucaoFim) {
      params['data_devolucao_fim'] = query.dataDevolucaoFim;
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

  /** Itens ainda não devolvidos com devolução prevista dentro do
   * horizonte (padrão 14 dias, backend `DIAS_HORIZONTE_ALERTA_VENCIMENTO`)
   * ou já vencidos — painel da tela Início. */
  listarAlertasVencimento(dias?: number): Observable<AlertaVencimentoEmprestimo[]> {
    const params = dias !== undefined ? { dias: String(dias) } : undefined;
    return this.http
      .get<AlertaVencimentoEmprestimoDto[]>(`${this.resource}/alertas-vencimento`, { params })
      .pipe(map((itens) => itens.map(paraAlertaVencimentoModel)));
  }

  devolver(id: number, idUsuario: number, dataDevolucao?: string): Observable<Emprestimo> {
    const corpo: { id_usuario: number; data_devolucao?: string } = { id_usuario: idUsuario };
    if (dataDevolucao) {
      corpo.data_devolucao = dataDevolucao;
    }
    return this.http.post<EmprestimoDto>(`${this.resource}/${id}/devolver`, corpo).pipe(map(paraModel));
  }

  /** Soma `dias` à data prevista de devolução atual (ou a partir de hoje,
   * se o empréstimo ainda não tinha prazo) e marca os itens ainda não
   * devolvidos como "Renovado" — ação rápida pedida pelo time (2026-09-28)
   * na tela Início e na listagem de empréstimos. `idsItensDevolver` devolve
   * parte dos itens na mesma renovação (2026-09-30). */
  renovar(id: number, idUsuario: number, dias: number, idsItensDevolver: number[] = []): Observable<Emprestimo> {
    const corpo: EmprestimoRenovarDto = { id_usuario: idUsuario, dias, ids_itens_devolver: idsItensDevolver };
    return this.http.post<EmprestimoDto>(`${this.resource}/${id}/renovar`, corpo).pipe(map(paraModel));
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

  /** Todos os contratos do empréstimo (um "Comodato" + quantas
   * "Renovação" tiverem sido assinadas), mais antigo primeiro — lista
   * vazia se nada foi assinado ainda. */
  listarContratos(emprestimoId: number): Observable<EmprestimoContrato[]> {
    return this.http
      .get<EmprestimoContratoDto[]>(`${this.resource}/${emprestimoId}/contratos`)
      .pipe(map((itens) => itens.map(paraContratoModel)));
  }

  obterPdfContrato(emprestimoId: number, contratoId: number): Observable<Blob> {
    return this.http.get(`${this.resource}/${emprestimoId}/contratos/${contratoId}/pdf`, {
      responseType: 'blob'
    });
  }

  /** Assina um contrato (gera o PDF — texto do comodato original ou do
   * termo aditivo de renovação, conforme `tipo` — ver
   * `app/features/emprestimos/service.py` no backend — colando a
   * assinatura capturada no canvas). Só pode haver um "Comodato" por
   * empréstimo (assinar de novo retorna 409); "Renovação" pode ser
   * assinada quantas vezes for preciso, mas exige que o "Comodato" já
   * exista (senão também retorna 409). */
  /** Gera um link de assinatura remota do contrato de comodato (pessoa
   * assina pelo próprio celular, sem login, confirmando o CPF) — só pra
   * contrato pendente. O token só vem nesta resposta. */
  criarLinkAssinatura(emprestimoId: number): Observable<{ id: number; token: string; codigo: string; expira_em: string }> {
    return this.http.post<{ id: number; token: string; codigo: string; expira_em: string }>(
      `${this.resource}/${emprestimoId}/links-assinatura`,
      {}
    );
  }

  assinarContrato(
    emprestimoId: number,
    assinaturaPngBase64: string,
    tipo: TipoContrato = 'Comodato'
  ): Observable<EmprestimoContrato> {
    return this.http
      .post<EmprestimoContratoDto>(`${this.resource}/${emprestimoId}/contrato`, {
        assinatura_png_base64: assinaturaPngBase64,
        tipo
      })
      .pipe(map(paraContratoModel));
  }
}
