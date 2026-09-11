import { Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Captura de foto pela webcam do navegador (`getUserMedia`), substituindo o
 * componente DevExpress `TdxCameraControl` do legado
 * (`untFrmManutencaoPessoa.pas`) — mesmo espírito (tirar foto ao vivo), mas
 * sem depender de componente de terceiros. Só emite eventos; quem usa este
 * componente decide como/quando persistir (ver pessoa-cadastro.page.ts).
 */
@Component({
  selector: 'app-captura-foto',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './captura-foto.component.html',
  styleUrl: './captura-foto.component.scss'
})
export class CapturaFotoComponent {
  readonly fotoUrl = input<string | null>(null);
  readonly capturada = output<Blob>();
  readonly removida = output<void>();

  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  protected readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly streamAtivo = signal<MediaStream | null>(null);
  protected readonly previaUrl = signal<string | null>(null);
  protected readonly erro = signal<string | null>(null);

  private blobCapturado: Blob | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pararCamera());
  }

  protected async ativarCamera(): Promise<void> {
    this.erro.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.streamAtivo.set(stream);
    } catch {
      this.erro.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  protected capturar(): void {
    const video = this.video()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;
    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.pararCamera();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          this.blobCapturado = blob;
          this.previaUrl.set(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.9
    );
  }

  protected tentarNovamente(): void {
    this.limparPreVisualizacao();
    void this.ativarCamera();
  }

  protected confirmar(): void {
    if (this.blobCapturado) {
      this.capturada.emit(this.blobCapturado);
      this.limparPreVisualizacao();
    }
  }

  protected cancelar(): void {
    this.pararCamera();
    this.limparPreVisualizacao();
  }

  protected remover(): void {
    this.removida.emit();
  }

  private limparPreVisualizacao(): void {
    this.blobCapturado = null;
    const url = this.previaUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.previaUrl.set(null);
  }

  private pararCamera(): void {
    this.streamAtivo()
      ?.getTracks()
      .forEach((faixa) => faixa.stop());
    this.streamAtivo.set(null);
  }
}
