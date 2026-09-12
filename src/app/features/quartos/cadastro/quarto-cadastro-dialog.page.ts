import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-quarto-cadastro-dialog-page', template: '' })
export class QuartoCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/quartos';
  protected override readonly config = { width: '560px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { QuartoCadastroPage } = await import('./quarto-cadastro.page');
    return QuartoCadastroPage;
  }
}
