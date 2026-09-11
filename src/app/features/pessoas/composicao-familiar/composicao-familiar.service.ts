import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ComposicaoFamiliarCreateDto,
  ComposicaoFamiliarDto,
  ComposicaoFamiliarUpdateDto
} from './composicao-familiar.dto';
import { paraModel } from './composicao-familiar.mapper';
import { ComposicaoFamiliar } from './composicao-familiar.model';

@Injectable({ providedIn: 'root' })
export class ComposicaoFamiliarService {
  private readonly http = inject(HttpClient);

  private resource(pessoaId: number): string {
    return `${environment.apiBaseUrl}/pessoas/${pessoaId}/composicao-familiar`;
  }

  listar(pessoaId: number): Observable<ComposicaoFamiliar[]> {
    return this.http
      .get<ComposicaoFamiliarDto[]>(this.resource(pessoaId))
      .pipe(map((itens) => itens.map(paraModel)));
  }

  criar(pessoaId: number, dados: ComposicaoFamiliarCreateDto): Observable<ComposicaoFamiliar> {
    return this.http
      .post<ComposicaoFamiliarDto>(this.resource(pessoaId), dados)
      .pipe(map(paraModel));
  }

  atualizar(
    pessoaId: number,
    membroId: number,
    dados: ComposicaoFamiliarUpdateDto
  ): Observable<ComposicaoFamiliar> {
    return this.http
      .put<ComposicaoFamiliarDto>(`${this.resource(pessoaId)}/${membroId}`, dados)
      .pipe(map(paraModel));
  }

  remover(pessoaId: number, membroId: number): Observable<void> {
    return this.http.delete<void>(`${this.resource(pessoaId)}/${membroId}`);
  }
}
