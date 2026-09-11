import { Injectable, effect, inject, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';

export type Tema = 'claro' | 'escuro';

const CHAVE_TEMA_GLOBAL = 'abrigo.tema';
const PREFIXO_CHAVE_TEMA_USUARIO = 'abrigo.tema.';

/**
 * Preferência de tema (claro/escuro) por usuário logado — pedido
 * explicitamente pelo usuário (2026-09-11), sem UI de gestão de usuário no
 * backend (decisão anterior: gestão de usuário fica por CLI, ver
 * `abrigo-backend/README.md`), então a preferência fica só no navegador
 * (`localStorage`), não no banco. Guardada por `usuario_id`
 * (`abrigo.tema.<id>`) — trocar de usuário no mesmo navegador troca de
 * tema junto. `abrigo.tema` (sem sufixo) é o fallback usado antes do
 * login (tela de login em si) e por quem nunca trocou de tema.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly auth = inject(AuthService);

  readonly tema = signal<Tema>(this.lerTemaInicial());

  constructor() {
    effect(() => {
      const usuarioId = this.auth.sessao()?.usuario_id ?? null;
      this.tema.set(this.lerTemaSalvo(usuarioId));
    });

    effect(() => {
      document.documentElement.setAttribute('data-theme', this.tema() === 'escuro' ? 'dark' : 'light');
    });
  }

  alternar(): void {
    const novoTema: Tema = this.tema() === 'escuro' ? 'claro' : 'escuro';
    this.tema.set(novoTema);

    const usuarioId = this.auth.sessao()?.usuario_id ?? null;
    const chave = usuarioId ? `${PREFIXO_CHAVE_TEMA_USUARIO}${usuarioId}` : CHAVE_TEMA_GLOBAL;
    try {
      localStorage.setItem(chave, novoTema);
      localStorage.setItem(CHAVE_TEMA_GLOBAL, novoTema);
    } catch {
      // localStorage indisponível (modo privado, etc.) — tema só vale pra sessão atual.
    }
  }

  private lerTemaInicial(): Tema {
    return this.lerTemaSalvo(this.auth.sessao()?.usuario_id ?? null);
  }

  private lerTemaSalvo(usuarioId: number | null): Tema {
    try {
      const chaveUsuario = usuarioId ? `${PREFIXO_CHAVE_TEMA_USUARIO}${usuarioId}` : null;
      const salvo = (chaveUsuario && localStorage.getItem(chaveUsuario)) || localStorage.getItem(CHAVE_TEMA_GLOBAL);
      return salvo === 'escuro' ? 'escuro' : 'claro';
    } catch {
      return 'claro';
    }
  }
}
