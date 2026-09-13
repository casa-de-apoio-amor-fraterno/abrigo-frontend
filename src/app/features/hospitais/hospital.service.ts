import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HospitalCreateDto, HospitalDto, HospitalUpdateDto } from './hospital.dto';
import { paraModel } from './hospital.mapper';
import { Hospital } from './hospital.model';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/hospitais`;

  listar(apenasAtivos = true): Observable<Hospital[]> {
    const params = { apenas_ativos: String(apenasAtivos) };
    return this.http
      .get<HospitalDto[]>(this.resource, { params })
      .pipe(map((itens) => itens.map(paraModel)));
  }

  buscar(id: number): Observable<Hospital> {
    return this.http.get<HospitalDto>(`${this.resource}/${id}`).pipe(map(paraModel));
  }

  criar(dados: HospitalCreateDto): Observable<Hospital> {
    return this.http.post<HospitalDto>(this.resource, dados).pipe(map(paraModel));
  }

  atualizar(id: number, dados: HospitalUpdateDto): Observable<Hospital> {
    return this.http.put<HospitalDto>(`${this.resource}/${id}`, dados).pipe(map(paraModel));
  }

  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
