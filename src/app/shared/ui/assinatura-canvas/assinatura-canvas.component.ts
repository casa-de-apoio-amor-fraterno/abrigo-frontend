import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { AssinaturaTelaCheiaDialogComponent } from './assinatura-tela-cheia-dialog.component';

/**
 * Captura de assinatura por toque/caneta — abre um diálogo em tela cheia
 * (`AssinaturaTelaCheiaDialogComponent`, que tenta travar em paisagem) pra
 * desenhar; aqui só mostra o placeholder/prévia e o botão "Assinar" (testado
 * com o usuário: o espaço de uma tela de celular é pequeno demais pra
 * assinar direito num canvas inline).
 *
 * Só emite o PNG capturado; quem usa este componente decide o que fazer com
 * ele (ver contrato-demo.page.ts, que manda pro backend colar no PDF).
 */
@Component({
  selector: 'app-assinatura-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './assinatura-canvas.component.html',
  styleUrl: './assinatura-canvas.component.scss',
})
export class AssinaturaCanvasComponent {
  private readonly dialog = inject(MatDialog);

  protected readonly assinaturaConfirmada = signal<string | null>(null);

  protected abrir(): void {
    this.dialog
      .open(AssinaturaTelaCheiaDialogComponent, {
        panelClass: 'assinatura-dialog-panel',
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
      })
      .afterClosed()
      .subscribe((dataUrl: string | undefined) => {
        if (dataUrl) {
          this.assinaturaConfirmada.set(dataUrl);
        }
      });
  }

  protected assinarNovamente(): void {
    this.assinaturaConfirmada.set(null);
    this.abrir();
  }

  /** Data URL base64 do PNG assinado, ou `null` se ainda não foi confirmada. */
  obterAssinatura(): string | null {
    return this.assinaturaConfirmada();
  }
}
