import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MaterialLocalDto } from './material-local.dto';
import { paraModel } from './material-local.mapper';
import { MaterialLocal } from './material-local.model';

@Injectable({ providedIn: 'root' })
export class MaterialLocalService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/materiais-locais`;

  listar(apenasAtivos = true): Observable<MaterialLocal[]> {
    const params = { apenas_ativos: String(apenasAtivos) };
    return this.http
      .get<MaterialLocalDto[]>(this.resource, { params })
      .pipe(map((itens) => itens.map(paraModel)));
  }
}
