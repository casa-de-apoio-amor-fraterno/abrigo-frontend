import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-material-cadastro-dialog-page', template: '' })
export class MaterialCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/materiais';
  // Altura fixa menor que o padrão de 90vh (herdado de
  // CONFIG_PADRAO_DIALOG_CADASTRO) — o conteúdo real (aba "Dados": foto +
  // poucos campos) é bem mais curto que isso, sobrando muita altura em
  // branco dentro do popup. Continua fixa (não usa `height: 'auto'` como
  // hospital) porque o popup tem abas — precisa do mesmo tamanho em todas,
  // ver cadastro-dialog-shell.component.scss.
  protected override readonly config = { width: '560px', height: '620px', maxHeight: '85vh' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { MaterialCadastroPage } = await import('./material-cadastro.page');
    return MaterialCadastroPage;
  }
}
