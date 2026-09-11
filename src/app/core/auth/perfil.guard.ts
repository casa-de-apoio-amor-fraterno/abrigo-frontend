import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Guarda de rota por `Usuario.perfil`, espelhando `exigir_perfil` do backend
 * (`app/features/auth/dependencies.py`). Uso: `data: { perfis: ['Assistente Social'] }`
 * na definição da rota.
 */
export const perfilGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const perfis = route.data['perfis'] as string[] | undefined;
  if (!perfis || perfis.length === 0 || auth.temPerfil(...perfis)) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
