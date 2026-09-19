import { Directive, Injector, OnDestroy, OnInit, Type, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

const CONFIG_PADRAO: MatDialogConfig = {
  panelClass: 'cadastro-dialog-panel',
  width: '720px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  autoFocus: false
};

/**
 * Base pra rotas de cadastro (ex.: /pessoas/novo, /pessoas/:id/editar) que
 * abrem o formulário num modal centralizado, em vez de página cheia. A rota
 * carrega essa classe (via loadComponent) em vez do formulário direto; ela
 * abre o formulário de verdade dentro de um MatDialog centralizado
 * (posição/backdrop padrão do CDK) e devolve pra lista quando ele fecha —
 * seja pelo próprio formulário navegando (Salvar/Cancelar, que já usam
 * routerLink/router.navigateByUrl) ou pelo usuário fechando o popup (X, ESC,
 * clique fora), caso em que a URL fica desatualizada com /novo ou
 * /:id/editar se a gente não corrigir explicitamente.
 */
@Directive()
export abstract class CadastroDialogHostBase implements OnInit, OnDestroy {
  protected readonly dialog = inject(MatDialog);
  protected readonly router = inject(Router);
  protected readonly injector = inject(Injector);

  private dialogRef?: MatDialogRef<unknown>;
  private fechandoPelaRota = false;

  protected abstract readonly listaUrl: string;
  protected readonly config: MatDialogConfig = {};

  protected abstract carregarComponente(): Promise<Type<unknown>>;

  async ngOnInit(): Promise<void> {
    const componente = await this.carregarComponente();

    this.dialogRef = this.dialog.open(componente, {
      ...CONFIG_PADRAO,
      ...this.config,
      injector: this.injector
    });

    this.dialogRef.afterClosed().subscribe(() => {
      if (!this.fechandoPelaRota) {
        void this.router.navigateByUrl(this.listaUrl);
      }
    });
  }

  ngOnDestroy(): void {
    this.fechandoPelaRota = true;
    this.dialogRef?.close();
  }
}
