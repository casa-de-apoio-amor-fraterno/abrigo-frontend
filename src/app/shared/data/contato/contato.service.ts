import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ContatoDto } from './contato.dto';
import { paraEntradaDto, paraModel } from './contato.mapper';
import { Contato, ContatoFormulario } from './contato.model';

/** Serviço genérico de contatos — reaproveitado por Pessoa e Voluntário
 * (mesmo shape dos dois lados, só a URL base do sub-recurso muda:
 * `/api/pessoas/{id}/contatos` ou `/api/voluntarios/{id}/contatos`). Ver
 * shared/ui/contatos-tab, que usa este serviço. */
@Injectable({ providedIn: 'root' })
export class ContatoService {
  private readonly http = inject(HttpClient);

  listar(recursoBase: string): Observable<Contato[]> {
    return this.http.get<ContatoDto[]>(recursoBase).pipe(map((dtos) => dtos.map(paraModel)));
  }

  criar(recursoBase: string, formulario: ContatoFormulario): Observable<Contato> {
    return this.http
      .post<ContatoDto>(recursoBase, paraEntradaDto(formulario))
      .pipe(map(paraModel));
  }

  atualizar(recursoBase: string, id: number, formulario: ContatoFormulario): Observable<Contato> {
    return this.http
      .put<ContatoDto>(`${recursoBase}/${id}`, paraEntradaDto(formulario))
      .pipe(map(paraModel));
  }

  remover(recursoBase: string, id: number): Observable<void> {
    return this.http.delete<void>(`${recursoBase}/${id}`);
  }
}
