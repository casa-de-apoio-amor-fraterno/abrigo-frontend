import { Component, HostListener, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DetalheAcao {
  rotulo: string;
  valor: string;
}

/**
 * Popup modal (centralizado, com fundo escurecido) pra uma ação sobre um
 * item de lista (ex.: "Finalizar estadia", "Nova estadia", "Devolver
 * empréstimo") — substitui o antigo popover no canto da tela (2026-09-30,
 * pedido do time: mais detalhes sobre o que será feito). Só a casca é
 * genérica: cabeçalho, bloco "O que será feito" (`descricao`), linhas de
 * contexto (`detalhes`), o conteúdo projetado (campos) e o rodapé
 * Cancelar/Confirmar. Esc ou clique no fundo cancelam.
 *
 * `z-index` fica abaixo do overlay do CDK (1000) de propósito: painéis de
 * autocomplete/select abertos de dentro do popup precisam aparecer por
 * cima dele.
 */
@Component({
  selector: 'app-acao-dialog',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './acao-dialog.component.html',
  styleUrl: './acao-dialog.component.scss'
})
export class AcaoDialogComponent {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  /** Texto explicando o que vai acontecer ao confirmar (efeitos). */
  readonly descricao = input<string>('');
  /** Linhas "rótulo: valor" sobre o item afetado. */
  readonly detalhes = input<DetalheAcao[]>([]);
  readonly erro = input<string | null>(null);
  readonly confirmando = input<boolean>(false);
  readonly textoConfirmar = input<string>('Confirmar');

  readonly cancelar = output<void>();
  readonly confirmar = output<void>();

  @HostListener('document:keydown.escape')
  protected aoEsc(): void {
    if (!this.confirmando()) {
      this.cancelar.emit();
    }
  }

  protected aoClicarFundo(): void {
    if (!this.confirmando()) {
      this.cancelar.emit();
    }
  }
}
