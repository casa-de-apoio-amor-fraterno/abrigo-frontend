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
          import('./features/pessoas/consulta/pessoa-consulta.page').then((m) => m.PessoaConsultaPage)
      },
      {
        path: 'pessoas/novo',
        loadComponent: () =>
          import('./features/pessoas/cadastro/pessoa-cadastro-dialog.page').then((m) => m.PessoaCadastroDialogPage)
      },
      {
        path: 'pessoas/:id/editar',
        loadComponent: () =>
          import('./features/pessoas/cadastro/pessoa-cadastro-dialog.page').then((m) => m.PessoaCadastroDialogPage)
      },
      {
        path: 'quartos',
        loadComponent: () =>
          import('./features/quartos/consulta/quarto-consulta.page').then((m) => m.QuartoConsultaPage)
      },
      {
        path: 'quartos/novo',
        loadComponent: () =>
          import('./features/quartos/cadastro/quarto-cadastro-dialog.page').then((m) => m.QuartoCadastroDialogPage)
      },
      {
        path: 'quartos/:id/editar',
        loadComponent: () =>
          import('./features/quartos/cadastro/quarto-cadastro-dialog.page').then((m) => m.QuartoCadastroDialogPage)
      },
      {
        path: 'estadias',
        loadComponent: () =>
          import('./features/estadias/consulta/estadia-consulta.page').then((m) => m.EstadiaConsultaPage)
      },
      {
        path: 'estadias/novo',
        loadComponent: () =>
          import('./features/estadias/cadastro/estadia-cadastro-dialog.page').then((m) => m.EstadiaCadastroDialogPage)
      },
      {
        path: 'estadias/:id/editar',
        loadComponent: () =>
          import('./features/estadias/cadastro/estadia-cadastro-dialog.page').then((m) => m.EstadiaCadastroDialogPage)
      },
      {
        path: 'voluntarios',
        loadComponent: () =>
          import('./features/voluntarios/consulta/voluntario-consulta.page').then((m) => m.VoluntarioConsultaPage)
      },
      {
        path: 'voluntarios/novo',
        loadComponent: () =>
          import('./features/voluntarios/cadastro/voluntario-cadastro-dialog.page').then(
            (m) => m.VoluntarioCadastroDialogPage
          )
      },
      {
        path: 'voluntarios/:id/editar',
        loadComponent: () =>
          import('./features/voluntarios/cadastro/voluntario-cadastro-dialog.page').then(
            (m) => m.VoluntarioCadastroDialogPage
          )
      },
      {
        path: 'emprestimos',
        loadComponent: () =>
          import('./features/emprestimos/consulta/emprestimo-consulta.page').then((m) => m.EmprestimoConsultaPage)
      },
      {
        path: 'emprestimos/novo',
        loadComponent: () =>
          import('./features/emprestimos/cadastro/emprestimo-cadastro-dialog.page').then(
            (m) => m.EmprestimoCadastroDialogPage
          )
      },
      {
        path: 'emprestimos/:id/editar',
        loadComponent: () =>
          import('./features/emprestimos/cadastro/emprestimo-cadastro-dialog.page').then(
            (m) => m.EmprestimoCadastroDialogPage
          )
      },
      {
        path: 'materiais',
        loadComponent: () =>
          import('./features/materiais/consulta/material-consulta.page').then((m) => m.MaterialConsultaPage)
      },
      {
        path: 'materiais/novo',
        loadComponent: () =>
          import('./features/materiais/cadastro/material-cadastro-dialog.page').then(
            (m) => m.MaterialCadastroDialogPage
          )
      },
      {
        path: 'materiais/:id/editar',
        loadComponent: () =>
          import('./features/materiais/cadastro/material-cadastro-dialog.page').then(
            (m) => m.MaterialCadastroDialogPage
          )
      },
      {
        path: 'busca',
        loadComponent: () => import('./features/busca/busca.page').then((m) => m.BuscaPage)
      }
    ]
  }
];
