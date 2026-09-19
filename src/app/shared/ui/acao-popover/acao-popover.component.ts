import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const LARGURA_MINIMA = 280;
const LARGURA_MAXIMA = 640;
const ALTURA_MINIMA = 180;
const ALTURA_MAXIMA = 720;

/**
 * Popover fixo no canto inferior direito pra uma ação rápida sobre um item
 * de lista (ex.: "Finalizar estadia" na busca global, "Devolver
 * empréstimo") — sem precisar sair da tela/lista pra abrir o cadastro
 * completo. Só a casca (cabeçalho + rodapé Cancelar/Confirmar) é
 * genérica; o conteúdo (o campo em si) é projetado por quem usa.
 */
@Component({
  selector: 'app-acao-popover',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './acao-popover.component.html',
  styleUrl: './acao-popover.component.scss'
})
export class AcaoPopoverComponent {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly erro = input<string | null>(null);
  readonly confirmando = input<boolean>(false);
  readonly textoConfirmar = input<string>('Confirmar');

  readonly cancelar = output<void>();
  readonly confirmar = output<void>();

  // Não dá pra usar o ElementRef do próprio host (`<app-acao-popover>`):
  // ele fica no fluxo normal do documento, sem tamanho/posição — quem tem
  // `position: fixed` e o tamanho de verdade é o `.acao-popover` interno.
  private readonly painel = viewChild.required<ElementRef<HTMLElement>>('painel');

  // O popover é ancorado no canto inferior direito (`position: fixed;
  // right/bottom` no SCSS), então crescer a partir do canto superior
  // esquerdo é o que faz sentido visualmente — arrastar pra cima/esquerda
  // aumenta, sem mover a âncora.
  protected readonly larguraPx = signal<number | null>(null);
  protected readonly alturaPx = signal<number | null>(null);

  protected iniciarRedimensionamento(evento: PointerEvent): void {
    evento.preventDefault();

    const retangulo = this.painel().nativeElement.getBoundingClientRect();
    const larguraInicial = retangulo.width;
    const alturaInicial = retangulo.height;
    const xInicial = evento.clientX;
    const yInicial = evento.clientY;
    const userSelectAnterior = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const mover = (e: PointerEvent): void => {
      const deltaLargura = xInicial - e.clientX;
      const deltaAltura = yInicial - e.clientY;
      this.larguraPx.set(
        Math.min(LARGURA_MAXIMA, Math.max(LARGURA_MINIMA, larguraInicial + deltaLargura))
      );
      this.alturaPx.set(Math.min(ALTURA_MAXIMA, Math.max(ALTURA_MINIMA, alturaInicial + deltaAltura)));
    };

    const soltar = (): void => {
      document.body.style.userSelect = userSelectAnterior;
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };

    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  }
}
