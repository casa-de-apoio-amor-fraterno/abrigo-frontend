import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EstadoDto } from './estado.dto';
import { paraModel } from './estado.mapper';
import { Estado } from './estado.model';

@Injectable({ providedIn: 'root' })
export class EstadoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/estados`;

  listar(): Observable<Estado[]> {
    return this.http.get<EstadoDto[]>(this.resource).pipe(map((itens) => itens.map(paraModel)));
  }
}
