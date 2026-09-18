import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.page').then((m) => m.LoginPage)
  },
  {
    // Público, sem authGuard — é assim que o paciente se auto-cadastra
    // pelo próprio celular (ver login.page, "Sou paciente").
    path: 'cadastro-paciente',
    loadComponent: () =>
      import('./features/solicitacoes-cadastro/publico/solicitacao-cadastro-publico.page').then(
        (m) => m.SolicitacaoCadastroPublicoPage
      )
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
          import('./features/pessoas/consulta/pessoa-consulta.page').then((m) => m.PessoaConsultaPage),
        // Cadastro/edição são rotas filhas em vez de irmãs: assim a consulta
        // (busca, página, itens) fica montada por trás do popup — só o
        // router-outlet filho troca. Rota irmã destruiria a consulta ao
        // navegar pra /pessoas/:id/editar, perdendo a busca (ver
        // cadastro-dialog-host.base.ts).
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/pessoas/cadastro/pessoa-cadastro-dialog.page').then(
                (m) => m.PessoaCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/pessoas/cadastro/pessoa-cadastro-dialog.page').then(
                (m) => m.PessoaCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'quartos',
        loadComponent: () =>
          import('./features/quartos/consulta/quarto-consulta.page').then((m) => m.QuartoConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/quartos/cadastro/quarto-cadastro-dialog.page').then(
                (m) => m.QuartoCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/quartos/cadastro/quarto-cadastro-dialog.page').then(
                (m) => m.QuartoCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'hospitais',
        loadComponent: () =>
          import('./features/hospitais/consulta/hospital-consulta.page').then((m) => m.HospitalConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/hospitais/cadastro/hospital-cadastro-dialog.page').then(
                (m) => m.HospitalCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/hospitais/cadastro/hospital-cadastro-dialog.page').then(
                (m) => m.HospitalCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'estadias',
        loadComponent: () =>
          import('./features/estadias/consulta/estadia-consulta.page').then((m) => m.EstadiaConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/estadias/cadastro/estadia-cadastro-dialog.page').then(
                (m) => m.EstadiaCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/estadias/cadastro/estadia-cadastro-dialog.page').then(
                (m) => m.EstadiaCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'voluntarios',
        loadComponent: () =>
          import('./features/voluntarios/consulta/voluntario-consulta.page').then((m) => m.VoluntarioConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/voluntarios/cadastro/voluntario-cadastro-dialog.page').then(
                (m) => m.VoluntarioCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/voluntarios/cadastro/voluntario-cadastro-dialog.page').then(
                (m) => m.VoluntarioCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'emprestimos',
        loadComponent: () =>
          import('./features/emprestimos/consulta/emprestimo-consulta.page').then((m) => m.EmprestimoConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/emprestimos/cadastro/emprestimo-cadastro-dialog.page').then(
                (m) => m.EmprestimoCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/emprestimos/cadastro/emprestimo-cadastro-dialog.page').then(
                (m) => m.EmprestimoCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'materiais',
        loadComponent: () =>
          import('./features/materiais/consulta/material-consulta.page').then((m) => m.MaterialConsultaPage),
        children: [
          {
            path: 'novo',
            loadComponent: () =>
              import('./features/materiais/cadastro/material-cadastro-dialog.page').then(
                (m) => m.MaterialCadastroDialogPage
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/materiais/cadastro/material-cadastro-dialog.page').then(
                (m) => m.MaterialCadastroDialogPage
              )
          }
        ]
      },
      {
        path: 'busca',
        loadComponent: () => import('./features/busca/busca.page').then((m) => m.BuscaPage)
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/relatorios/relatorios-dashboard.page').then((m) => m.RelatoriosDashboardPage)
      },
      {
        path: 'relatorios/:tipo',
        loadComponent: () =>
          import('./features/relatorios/relatorio-detalhe.page').then((m) => m.RelatorioDetalhePage)
      },
      {
        // Protótipo do fluxo de assinatura por toque — ver contrato-demo.page.ts.
        path: 'contrato-demo',
        loadComponent: () => import('./features/contrato-demo/contrato-demo.page').then((m) => m.ContratoDemoPage)
      },
      {
        path: 'solicitacoes-cadastro',
        loadComponent: () =>
          import('./features/solicitacoes-cadastro/consulta/solicitacao-cadastro-consulta.page').then(
            (m) => m.SolicitacaoCadastroConsultaPage
          )
      }
    ]
  }
];
