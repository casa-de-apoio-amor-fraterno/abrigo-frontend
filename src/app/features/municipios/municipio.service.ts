import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MunicipioDto } from './municipio.dto';
import { paraModel } from './municipio.mapper';
import { Municipio } from './municipio.model';

export interface ConsultaMunicipiosQuery {
  idEstado?: number;
  busca?: string;
}

@Injectable({ providedIn: 'root' })
export class MunicipioService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/municipios`;

  listar(query: ConsultaMunicipiosQuery): Observable<Municipio[]> {
    const params: Record<string, string> = {};
    if (query.idEstado !== undefined) {
      params['id_estado'] = String(query.idEstado);
    }
    if (query.busca) {
      params['busca'] = query.busca;
    }

    return this.http
      .get<MunicipioDto[]>(this.resource, { params })
      .pipe(map((itens) => itens.map(paraModel)));
  }
}
