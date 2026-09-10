import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.page').then((m) => m.LoginPage)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
