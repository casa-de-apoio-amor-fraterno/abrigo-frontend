import { AfterViewInit, Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Captura de assinatura por toque/caneta num canvas (Pointer Events cobre
 * mouse, toque e stylus com a mesma API — é assim que o paciente assina o
 * contrato direto no tablet, sem precisar imprimir/assinar no papel).
 *
 * Só emite o PNG capturado; quem usa este componente decide o que fazer com
 * ele (ver contrato-demo.page.ts, que manda pro backend colar no PDF).
 */
@Component({
  selector: 'app-assinatura-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './assinatura-canvas.component.html',
  styleUrl: './assinatura-canvas.component.scss'
})
export class AssinaturaCanvasComponent implements AfterViewInit {
  protected readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly temTraco = signal(false);
  protected readonly assinaturaConfirmada = signal<string | null>(null);
  protected readonly podeConfirmar = computed(() => this.temTraco() && !this.assinaturaConfirmada());

  private contexto: CanvasRenderingContext2D | null = null;
  private desenhando = false;

  ngAfterViewInit(): void {
    this.aoInicializarCanvas();
  }

  private aoInicializarCanvas(): void {
    const elemento = this.canvas().nativeElement;
    // Resolução do canvas em pixels reais (não CSS) evita traço serrilhado
    // em telas de alta densidade (a maioria dos tablets).
    const proporcao = window.devicePixelRatio || 1;
    const retangulo = elemento.getBoundingClientRect();
    elemento.width = retangulo.width * proporcao;
    elemento.height = retangulo.height * proporcao;

    const contexto = elemento.getContext('2d');
    if (!contexto) {
      return;
    }
    contexto.scale(proporcao, proporcao);
    contexto.lineWidth = 2.5;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    contexto.strokeStyle = '#1a1a1a';
    this.contexto = contexto;
  }

  protected aoIniciarTraco(evento: PointerEvent): void {
    if (this.assinaturaConfirmada()) {
      return;
    }
    this.desenhando = true;
    this.contexto?.beginPath();
    this.contexto?.moveTo(...this.coordenadasRelativas(evento));
  }

  protected aoMoverPonteiro(evento: PointerEvent): void {
    if (!this.desenhando || !this.contexto) {
      return;
    }
    this.contexto.lineTo(...this.coordenadasRelativas(evento));
    this.contexto.stroke();
    this.temTraco.set(true);
  }

  protected aoSoltarTraco(): void {
    this.desenhando = false;
  }

  protected limpar(): void {
    const elemento = this.canvas().nativeElement;
    this.contexto?.clearRect(0, 0, elemento.width, elemento.height);
    this.temTraco.set(false);
    this.assinaturaConfirmada.set(null);
  }

  protected confirmar(): void {
    const dataUrl = this.canvas().nativeElement.toDataURL('image/png');
    this.assinaturaConfirmada.set(dataUrl);
  }

  /** Data URL base64 do PNG assinado, ou `null` se ainda não foi confirmada. */
  obterAssinatura(): string | null {
    return this.assinaturaConfirmada();
  }

  private coordenadasRelativas(evento: PointerEvent): [number, number] {
    const retangulo = this.canvas().nativeElement.getBoundingClientRect();
    return [evento.clientX - retangulo.left, evento.clientY - retangulo.top];
  }
}
