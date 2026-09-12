import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EstadiaAcompanhanteCreateDto,
  EstadiaAcompanhanteDto,
  EstadiaCreateDto,
  EstadiaDto,
  EstadiaUpdateDto,
  ListaEstadiasDto,
  SituacaoEstadiaDto
} from './estadia.dto';
import { paraAcompanhanteModel, paraListaModel, paraModel } from './estadia.mapper';
import { Estadia, EstadiaAcompanhante, ListaEstadias } from './estadia.model';

export interface ConsultaEstadiasQuery {
  idPessoa?: number;
  /** Estadias onde a pessoa aparece como acompanhante de outro paciente
   * (`EstadiaAcompanhante.id_pessoa`), não como titular do leito —
   * mutuamente exclusivo com `idPessoa`. */
  idPessoaAcompanhante?: number;
  situacao?: SituacaoEstadiaDto;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class EstadiaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/estadias`;

  listar(query: ConsultaEstadiasQuery): Observable<ListaEstadias> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.idPessoa !== undefined) {
      params['id_pessoa'] = String(query.idPessoa);
    }
    if (query.idPessoaAcompanhante !== undefined) {
      params['id_pessoa_acompanhante'] = String(query.idPessoaAcompanhante);
    }
    if (query.situacao) {
      params['situacao'] = query.situacao;
    }

    return this.http.get<ListaEstadiasDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Estadia> {
    return this.http.get<EstadiaDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: EstadiaCreateDto): Observable<Estadia> {
    return this.http.post<EstadiaDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: EstadiaUpdateDto): Observable<Estadia> {
    return this.http.put<EstadiaDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  encerrar(id: number, dataSaida?: string): Observable<Estadia> {
    const corpo = dataSaida ? { data_saida: dataSaida } : {};
    return this.http.post<EstadiaDto>(`${this.resource}/${id}/encerrar`, corpo).pipe(map(paraModel));
  }

  listarAcompanhantes(estadiaId: number): Observable<EstadiaAcompanhante[]> {
    return this.http
      .get<EstadiaAcompanhanteDto[]>(`${this.resource}/${estadiaId}/acompanhantes`)
      .pipe(map((itens) => itens.map(paraAcompanhanteModel)));
  }

  adicionarAcompanhante(
    estadiaId: number,
    dados: EstadiaAcompanhanteCreateDto
  ): Observable<EstadiaAcompanhante> {
    return this.http
      .post<EstadiaAcompanhanteDto>(`${this.resource}/${estadiaId}/acompanhantes`, dados)
      .pipe(map(paraAcompanhanteModel));
  }
}
