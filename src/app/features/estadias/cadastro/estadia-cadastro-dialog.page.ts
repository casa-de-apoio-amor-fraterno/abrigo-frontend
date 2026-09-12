import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-estadia-cadastro-dialog-page', template: '' })
export class EstadiaCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/estadias';
  protected override readonly config = { width: '760px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { EstadiaCadastroPage } = await import('./estadia-cadastro.page');
    return EstadiaCadastroPage;
  }
}
