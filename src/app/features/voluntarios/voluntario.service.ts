import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListaVoluntariosDto, VoluntarioCreateDto, VoluntarioDto, VoluntarioUpdateDto } from './voluntario.dto';
import { paraListaModel, paraModel } from './voluntario.mapper';
import { ListaVoluntarios, Voluntario } from './voluntario.model';

export interface ConsultaVoluntariosQuery {
  busca?: string;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class VoluntarioService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/voluntarios`;

  listar(query: ConsultaVoluntariosQuery): Observable<ListaVoluntarios> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.busca) {
      params['busca'] = query.busca;
    }

    return this.http.get<ListaVoluntariosDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Voluntario> {
    return this.http.get<VoluntarioDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: VoluntarioCreateDto): Observable<Voluntario> {
    return this.http.post<VoluntarioDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: VoluntarioUpdateDto): Observable<Voluntario> {
    return this.http.put<VoluntarioDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  /** URL do sub-recurso de contatos — ver shared/ui/contatos-tab. */
  contatosUrl(id: number): string {
    return `${this.resource}/${id}/contatos`;
  }
}
