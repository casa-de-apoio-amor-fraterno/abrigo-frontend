import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { QuartoCreateDto, QuartoDto, QuartoOcupacaoDto, QuartoUpdateDto } from './quarto.dto';
import { paraModel, paraOcupacaoModel } from './quarto.mapper';
import { Quarto, QuartoOcupacao } from './quarto.model';

@Injectable({ providedIn: 'root' })
export class QuartoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/quartos`;

  listar(apenasAtivos = true): Observable<Quarto[]> {
    const params = { apenas_ativos: String(apenasAtivos) };
    return this.http
      .get<QuartoDto[]>(this.resource, { params })
      .pipe(map((itens) => itens.map(paraModel)));
  }

  buscar(id: number): Observable<Quarto> {
    return this.http.get<QuartoDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: QuartoCreateDto): Observable<Quarto> {
    return this.http.post<QuartoDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: QuartoUpdateDto): Observable<Quarto> {
    return this.http.put<QuartoDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  listarOcupacao(): Observable<QuartoOcupacao[]> {
    return this.http
      .get<QuartoOcupacaoDto[]>(`${this.resource}/ocupacao`)
      .pipe(map((itens) => itens.map(paraOcupacaoModel)));
  }
}
