import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Espelha `SessaoResponse` (abrigo-backend, app/features/auth/schemas.py) —
 * sem DTO/mapper próprio porque a sessão é pequena e não tem tela dedicada;
 * `usuario_id` fica em snake_case de propósito, é o payload exato da API. */
export interface Sessao {
  nome: string;
  token: string;
  perfil: string;
  usuario_id: number;
}

export interface LoginPayload {
  usuario: string;
  senha: string;
}

export const CHAVE_TOKEN = 'abrigo.token';
const CHAVE_SESSAO = 'abrigo.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/auth`;

  readonly sessao = signal<Sessao | null>(this.lerSessaoPersistida());

  login(payload: LoginPayload): Observable<Sessao> {
    return this.http.post<Sessao>(`${this.resource}/login`, payload).pipe(
      tap((sessao) => {
        this.sessao.set(sessao);
        localStorage.setItem(CHAVE_TOKEN, sessao.token);
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      })
    );
  }

  logout(): void {
    this.sessao.set(null);
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_SESSAO);
  }

  estaAutenticado(): boolean {
    return this.sessao() !== null || Boolean(localStorage.getItem(CHAVE_TOKEN));
  }

  temPerfil(...perfis: string[]): boolean {
    const perfilAtual = this.sessao()?.perfil;
    return perfilAtual !== undefined && perfis.includes(perfilAtual);
  }

  private lerSessaoPersistida(): Sessao | null {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) {
      return null;
    }
    try {
      return JSON.parse(bruto) as Sessao;
    } catch {
      return null;
    }
  }
}
