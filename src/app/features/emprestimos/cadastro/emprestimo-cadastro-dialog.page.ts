import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-emprestimo-cadastro-dialog-page', template: '' })
export class EmprestimoCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/emprestimos';
  protected override readonly config = { width: '760px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { EmprestimoCadastroPage } = await import('./emprestimo-cadastro.page');
    return EmprestimoCadastroPage;
  }
}
