import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ListaMateriaisDto,
  MaterialAlocarDto,
  MaterialCreateDto,
  MaterialDto,
  MaterialUpdateDto
} from './material.dto';
import { paraListaModel, paraModel } from './material.mapper';
import { ListaMateriais, Material } from './material.model';

export interface ConsultaMateriaisQuery {
  busca?: string;
  apenasDisponiveisEmprestimo?: boolean;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/materiais`;

  listar(query: ConsultaMateriaisQuery): Observable<ListaMateriais> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.busca) {
      params['busca'] = query.busca;
    }
    if (query.apenasDisponiveisEmprestimo) {
      params['apenas_disponiveis_emprestimo'] = String(query.apenasDisponiveisEmprestimo);
    }

    return this.http.get<ListaMateriaisDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Material> {
    return this.http.get<MaterialDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: MaterialCreateDto): Observable<Material> {
    return this.http.post<MaterialDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: MaterialUpdateDto): Observable<Material> {
    return this.http.put<MaterialDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  inutilizar(id: number, motivoBaixa: string | null): Observable<Material> {
    return this.http
      .post<MaterialDto>(`${this.resource}/${id}/inutilizar`, { motivo_baixa: motivoBaixa })
      .pipe(map(paraModel));
  }

  alocar(id: number, idLocal: number): Observable<Material> {
    const dados: MaterialAlocarDto = { id_local: idLocal };
    return this.http.post<MaterialDto>(`${this.resource}/${id}/alocar`, dados).pipe(map(paraModel));
  }

  /** URL direta da imagem (GET /api/materiais/{id}/foto) — sem endpoint próprio
   * pra baixar/pré-carregar, usada direto em `<img [src]>`. */
  fotoUrl(id: number): string {
    return `${this.resource}/${id}/foto`;
  }

  fotoThumbUrl(id: number): string {
    return `${this.resource}/${id}/foto/thumb`;
  }

  salvarFoto(id: number, arquivo: Blob): Observable<Material> {
    const formData = new FormData();
    formData.append('arquivo', arquivo, 'foto.jpg');
    return this.http.put<MaterialDto>(`${this.resource}/${id}/foto`, formData).pipe(map(paraModel));
  }

  removerFoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}/foto`);
  }
}
