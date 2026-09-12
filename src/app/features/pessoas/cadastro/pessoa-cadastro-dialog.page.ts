import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-pessoa-cadastro-dialog-page', template: '' })
export class PessoaCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/pessoas';
  protected override readonly config = { width: '900px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { PessoaCadastroPage } = await import('./pessoa-cadastro.page');
    return PessoaCadastroPage;
  }
}
