import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListaSolicitacoesCadastroDto, SolicitacaoCadastroDto } from './solicitacao-cadastro.dto';
import { paraListaModel, paraModel } from './solicitacao-cadastro.mapper';
import {
  ListaSolicitacoesCadastro,
  SituacaoSolicitacaoCadastro,
  SolicitacaoCadastro
} from './solicitacao-cadastro.model';

export interface NovaSolicitacaoCadastro {
  nome: string;
  dataNascimento: string;
  cpf?: string | null;
  telefone?: string | null;
  foto?: Blob | null;
}

export interface ConsultaSolicitacoesCadastroQuery {
  situacao?: SituacaoSolicitacaoCadastro;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class SolicitacaoCadastroService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/solicitacoes-cadastro`;

  /** Público, sem login — é assim que o paciente se auto-cadastra pelo
   * próprio celular (ver login.page + "Sou paciente"). */
  criar(dados: NovaSolicitacaoCadastro): Observable<SolicitacaoCadastro> {
    const formData = new FormData();
    formData.append('nome', dados.nome);
    formData.append('data_nascimento', dados.dataNascimento);
    if (dados.cpf) {
      formData.append('cpf', dados.cpf);
    }
    if (dados.telefone) {
      formData.append('telefone', dados.telefone);
    }
    if (dados.foto) {
      formData.append('arquivo', dados.foto, 'foto.jpg');
    }
    return this.http.post<SolicitacaoCadastroDto>(this.resource, formData).pipe(map(paraModel));
  }

  listar(query: ConsultaSolicitacoesCadastroQuery = {}): Observable<ListaSolicitacoesCadastro> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 50)
    };
    if (query.situacao) {
      params['situacao'] = query.situacao;
    }
    return this.http
      .get<ListaSolicitacoesCadastroDto>(this.resource, { params })
      .pipe(map(paraListaModel));
  }

  /** Endpoint exige login (diferente de `PessoaService.fotoUrl`) — não dá
   * pra usar direto num `<img src>` (o navegador não manda o Bearer token),
   * então busca como blob e o chamador monta um object URL. */
  obterFoto(id: number): Observable<Blob> {
    return this.http.get(`${this.resource}/${id}/foto`, { responseType: 'blob' });
  }

  aprovar(id: number): Observable<SolicitacaoCadastro> {
    return this.http.post<SolicitacaoCadastroDto>(`${this.resource}/${id}/aprovar`, {}).pipe(map(paraModel));
  }

  revogar(id: number): Observable<SolicitacaoCadastro> {
    return this.http.post<SolicitacaoCadastroDto>(`${this.resource}/${id}/revogar`, {}).pipe(map(paraModel));
  }
}
