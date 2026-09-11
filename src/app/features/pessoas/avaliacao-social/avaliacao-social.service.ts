import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AvaliacaoSocialCreateDto, AvaliacaoSocialDto, AvaliacaoSocialUpdateDto } from './avaliacao-social.dto';
import { paraModel } from './avaliacao-social.mapper';
import { AvaliacaoSocial } from './avaliacao-social.model';

@Injectable({ providedIn: 'root' })
export class AvaliacaoSocialService {
  private readonly http = inject(HttpClient);

  private resource(pessoaId: number): string {
    return `${environment.apiBaseUrl}/pessoas/${pessoaId}/avaliacoes-sociais`;
  }

  listar(pessoaId: number): Observable<AvaliacaoSocial[]> {
    return this.http
      .get<AvaliacaoSocialDto[]>(this.resource(pessoaId))
      .pipe(map((itens) => itens.map(paraModel)));
  }

  criar(pessoaId: number, dados: AvaliacaoSocialCreateDto): Observable<AvaliacaoSocial> {
    return this.http.post<AvaliacaoSocialDto>(this.resource(pessoaId), dados).pipe(map(paraModel));
  }

  atualizar(
    pessoaId: number,
    avaliacaoId: number,
    dados: AvaliacaoSocialUpdateDto
  ): Observable<AvaliacaoSocial> {
    return this.http
      .put<AvaliacaoSocialDto>(`${this.resource(pessoaId)}/${avaliacaoId}`, dados)
      .pipe(map(paraModel));
  }
}
