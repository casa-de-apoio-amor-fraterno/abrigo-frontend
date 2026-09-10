import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell.page').then((m) => m.ShellPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./core/layout/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'pessoas',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Pessoas' }
      },
      {
        path: 'estadias',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Estadias' }
      },
      {
        path: 'voluntarios',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Voluntários' }
      },
      {
        path: 'emprestimos',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Empréstimos' }
      },
      {
        path: 'materiais',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Materiais' }
      },
      {
        path: 'busca',
        loadComponent: () =>
          import('./shared/ui/placeholder-page/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
        data: { titulo: 'Busca' }
      }
    ]
  }
];
