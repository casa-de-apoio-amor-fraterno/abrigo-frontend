import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-material-cadastro-dialog-page', template: '' })
export class MaterialCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/materiais';
  protected override readonly config = { width: '560px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { MaterialCadastroPage } = await import('./material-cadastro.page');
    return MaterialCadastroPage;
  }
}
