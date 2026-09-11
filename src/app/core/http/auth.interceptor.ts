import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { CHAVE_TOKEN } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const token = localStorage.getItem(CHAVE_TOKEN);
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
