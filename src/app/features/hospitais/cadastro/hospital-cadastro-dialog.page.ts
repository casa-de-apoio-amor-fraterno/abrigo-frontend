import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-hospital-cadastro-dialog-page', template: '' })
export class HospitalCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/hospitais';
  protected override readonly config = { width: '480px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { HospitalCadastroPage } = await import('./hospital-cadastro.page');
    return HospitalCadastroPage;
  }
}
