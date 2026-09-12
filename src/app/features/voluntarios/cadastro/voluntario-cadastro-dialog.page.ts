import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-voluntario-cadastro-dialog-page', template: '' })
export class VoluntarioCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/voluntarios';
  protected override readonly config = { width: '560px' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { VoluntarioCadastroPage } = await import('./voluntario-cadastro.page');
    return VoluntarioCadastroPage;
  }
}
