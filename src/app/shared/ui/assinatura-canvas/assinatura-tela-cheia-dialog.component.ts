import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * Conteúdo do diálogo de assinatura em tela cheia — aberto via `MatDialog`
 * (não um `position: fixed` manual) porque o `mat-sidenav-content` do shell
 * (`shell.page.html`) cria um "containing block" novo pra elementos `fixed`
 * dentro dele (efeito colateral do Angular Material/CDK) — um `position:
 * fixed` comum ali dentro fica preso à área de conteúdo, não à tela inteira.
 * O `MatDialog` já resolve isso: o CDK sempre anexa o overlay direto no
 * `<body>`. Ver `.assinatura-dialog-panel` em `styles.scss` pro CSS que faz
 * o diálogo ocupar 100% da viewport.
 *
 * Não usa `requestFullscreen()`/`screen.orientation.lock()` — tentamos isso
 * numa primeira versão e, testado no celular de verdade, sair do fullscreen
 * ao confirmar disparava, no Chrome Android, uma renúncia da conexão de
 * live-reload do `ng serve` (fica em "server connection lost. Polling for
 * restart..." no console) que recarregava a página inteira e limpava o
 * formulário. O CSS já deixa o diálogo em tela cheia sem precisar da API —
 * a pessoa só gira o aparelho manualmente (aviso abaixo).
 */
@Component({
  selector: 'app-assinatura-tela-cheia-dialog',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './assinatura-tela-cheia-dialog.component.html',
  styleUrl: './assinatura-tela-cheia-dialog.component.scss',
})
export class AssinaturaTelaCheiaDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AssinaturaTelaCheiaDialogComponent>);

  protected readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly temTraco = signal(false);
  protected readonly podeConfirmar = computed(() => this.temTraco());

  private contexto: CanvasRenderingContext2D | null = null;
  private desenhando = false;

  constructor() {
    effect(() => {
      const referencia = this.canvas();
      if (referencia) {
        this.inicializarCanvas(referencia.nativeElement);
      }
    });

    // A pessoa pode girar o aparelho com o diálogo já aberto (o aviso pede
    // isso quando ainda em retrato) — reaproveita o traço já desenhado em
    // vez de simplesmente esticar o raster (`redimensionarPreservandoTraco`
    // redesenha o conteúdo anterior escalado pro novo tamanho).
    window.addEventListener('resize', this.aoRedimensionar);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', this.aoRedimensionar);
    });
  }

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected limpar(): void {
    const elemento = this.canvas()?.nativeElement;
    if (elemento) {
      this.contexto?.clearRect(0, 0, elemento.width, elemento.height);
    }
    this.temTraco.set(false);
  }

  protected confirmar(): void {
    const elemento = this.canvas()?.nativeElement;
    this.dialogRef.close(elemento?.toDataURL('image/png'));
  }

  protected aoIniciarTraco(evento: PointerEvent): void {
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

  private inicializarCanvas(elemento: HTMLCanvasElement): void {
    this.dimensionarCanvas(elemento);
    const contexto = elemento.getContext('2d');
    if (!contexto) {
      return;
    }
    this.configurarTraco(contexto);
    this.contexto = contexto;
  }

  private dimensionarCanvas(elemento: HTMLCanvasElement): void {
    // Resolução do canvas em pixels reais (não CSS) evita traço serrilhado
    // em telas de alta densidade (a maioria dos celulares/tablets).
    const proporcao = window.devicePixelRatio || 1;
    const retangulo = elemento.getBoundingClientRect();
    elemento.width = retangulo.width * proporcao;
    elemento.height = retangulo.height * proporcao;
  }

  private configurarTraco(contexto: CanvasRenderingContext2D): void {
    const proporcao = window.devicePixelRatio || 1;
    contexto.scale(proporcao, proporcao);
    contexto.lineWidth = 3;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    contexto.strokeStyle = '#1a1a1a';
  }

  private readonly aoRedimensionar = (): void => {
    const elemento = this.canvas()?.nativeElement;
    if (!elemento || !this.contexto) {
      return;
    }
    const desenhoAnterior = elemento.toDataURL('image/png');
    const tinhaTraco = this.temTraco();

    this.dimensionarCanvas(elemento);
    const contexto = elemento.getContext('2d');
    if (!contexto) {
      return;
    }
    this.configurarTraco(contexto);
    this.contexto = contexto;

    if (tinhaTraco) {
      const imagem = new Image();
      imagem.onload = () => {
        const proporcao = window.devicePixelRatio || 1;
        contexto.drawImage(imagem, 0, 0, elemento.width / proporcao, elemento.height / proporcao);
      };
      imagem.src = desenhoAnterior;
    }
  };

  private coordenadasRelativas(evento: PointerEvent): [number, number] {
    const retangulo = this.canvas()!.nativeElement.getBoundingClientRect();
    return [evento.clientX - retangulo.left, evento.clientY - retangulo.top];
  }
}
