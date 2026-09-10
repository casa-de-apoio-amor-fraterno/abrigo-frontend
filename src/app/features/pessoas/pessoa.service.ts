import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListaPessoasDto } from './pessoa.dto';
import { paraListaModel } from './pessoa.mapper';
import { ListaPessoas } from './pessoa.model';

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
}
