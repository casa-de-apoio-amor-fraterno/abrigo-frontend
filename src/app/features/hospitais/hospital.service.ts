import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HospitalDto } from './hospital.dto';
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
}
