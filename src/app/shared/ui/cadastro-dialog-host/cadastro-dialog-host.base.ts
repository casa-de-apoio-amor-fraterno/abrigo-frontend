import { Directive, Injector, OnDestroy, OnInit, Type, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

const CONFIG_PADRAO: MatDialogConfig = {
  panelClass: 'cadastro-dialog-panel',
  // Backdrop transparente (built-in do CDK): continua clicável — clicar
  // fora ainda fecha o painel — mas não escurece a lista atrás, já que o
  // popup agora é um drawer encostado na direita, não um modal centralizado.
  backdropClass: 'cdk-overlay-transparent-backdrop',
  position: { top: '0', right: '0' },
  width: '720px',
  maxWidth: '95vw',
  height: '100dvh',
  maxHeight: '100dvh',
  autoFocus: false
};

/**
 * Base pra rotas de cadastro (ex.: /pessoas/novo, /pessoas/:id/editar) que
 * abrem o formulário como painel flutuante encostado na borda direita da
 * tela (drawer), em vez de página cheia ou modal centralizado. A rota
 * carrega essa classe (via loadComponent) em vez do formulário direto; ela
 * abre o formulário de verdade dentro de um MatDialog posicionado à direita
 * e devolve pra lista quando ele fecha — seja pelo próprio formulário
 * navegando (Salvar/Cancelar, que já usam routerLink/router.navigateByUrl)
 * ou pelo usuário fechando o popup (X, ESC, clique fora), caso em que a URL
 * fica desatualizada com /novo ou /:id/editar se a gente não corrigir
 * explicitamente.
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
