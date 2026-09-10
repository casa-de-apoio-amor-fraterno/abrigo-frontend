import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Sessao {
  nome: string;
  token: string;
}

export interface LoginPayload {
  usuario: string;
  senha: string;
}

const CHAVE_TOKEN = 'abrigo.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/auth`;

  readonly sessao = signal<Sessao | null>(null);

  login(payload: LoginPayload): Observable<Sessao> {
    return this.http.post<Sessao>(`${this.resource}/login`, payload).pipe(
      tap((sessao) => {
        this.sessao.set(sessao);
        localStorage.setItem(CHAVE_TOKEN, sessao.token);
      })
    );
  }

  logout(): void {
    this.sessao.set(null);
    localStorage.removeItem(CHAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return this.sessao() !== null || Boolean(localStorage.getItem(CHAVE_TOKEN));
  }
}
