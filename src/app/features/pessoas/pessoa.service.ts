import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListaPessoasDto, PessoaDto } from './pessoa.dto';
import { paraEntradaDto, paraListaModel, paraPessoaModel } from './pessoa.mapper';
import { ListaPessoas, Pessoa, PessoaFormulario } from './pessoa.model';

export interface ConsultaPessoasQuery {
  busca?: string;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/pessoas`;

  listar(query: ConsultaPessoasQuery): Observable<ListaPessoas> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.busca) {
      params['busca'] = query.busca;
    }

    return this.http.get<ListaPessoasDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Pessoa> {
    return this.http.get<PessoaDto>(`${this.resource}/${id}`).pipe(map(paraPessoaModel));
  }

  criar(formulario: PessoaFormulario): Observable<Pessoa> {
    return this.http
      .post<PessoaDto>(this.resource, paraEntradaDto(formulario))
      .pipe(map(paraPessoaModel));
  }

  atualizar(id: number, formulario: PessoaFormulario): Observable<Pessoa> {
    return this.http
      .put<PessoaDto>(`${this.resource}/${id}`, paraEntradaDto(formulario))
      .pipe(map(paraPessoaModel));
  }
}
