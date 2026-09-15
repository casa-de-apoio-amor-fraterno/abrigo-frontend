import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { descreverErroHttp } from './api-error';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(descreverErroHttp(error.error));

      // 401 fora do próprio POST /auth/login (que já mostra o erro na tela
      // de login, não é sessão expirada) — sem isso, `AuthService.
      // estaAutenticado()` só checava se existia *algum* token no
      // localStorage, nunca se ele ainda era válido, então o app ficava
      // preso mandando pra sempre um token morto em cada requisição, sem
      // nunca devolver a pessoa pro login.
      if (error.status === 401 && !req.url.endsWith('/auth/login')) {
        authService.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
