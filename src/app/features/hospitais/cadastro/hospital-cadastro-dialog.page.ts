import { Component, Type } from '@angular/core';

import { CadastroDialogHostBase } from '../../../shared/ui/cadastro-dialog-host/cadastro-dialog-host.base';

@Component({ selector: 'app-hospital-cadastro-dialog-page', template: '' })
export class HospitalCadastroDialogPage extends CadastroDialogHostBase {
  protected override readonly listaUrl = '/hospitais';
  // Formulário de hospital é só um campo (Nome) — herdar a altura fixa de
  // 90vh padrão (pensada pra popups com abas/sub-formulários, ver
  // CONFIG_PADRAO_DIALOG_CADASTRO) sobrava muito espaço em branco. `auto`
  // deixa o popup do tamanho do conteúdo, com `maxHeight` (herdado) ainda
  // limitando em telas baixas.
  protected override readonly config = { width: '480px', height: 'auto' };

  protected override async carregarComponente(): Promise<Type<unknown>> {
    const { HospitalCadastroPage } = await import('./hospital-cadastro.page');
    return HospitalCadastroPage;
  }
}
