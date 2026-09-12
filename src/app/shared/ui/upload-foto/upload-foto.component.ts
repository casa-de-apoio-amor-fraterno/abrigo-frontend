import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Upload de foto a partir de um arquivo do PC — mesma estrutura/contrato de
 * `app-captura-foto` (`fotoUrl`/`capturada`/`removida`), mas via
 * `<input type="file">` em vez de câmera (ver `material.legacy.md`, decisão
 * do time: materiais são objetos já fotografados por outro meio, não faz
 * sentido exigir webcam ao vivo como em pessoas). Só emite eventos; quem usa
 * este componente decide como/quando persistir (ver
 * material-cadastro.page.ts).
 */
@Component({
  selector: 'app-upload-foto',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './upload-foto.component.html',
  styleUrl: './upload-foto.component.scss'
})
export class UploadFotoComponent {
  readonly fotoUrl = input<string | null>(null);
  readonly capturada = output<Blob>();
  readonly removida = output<void>();

  protected readonly inputArquivo = viewChild<ElementRef<HTMLInputElement>>('inputArquivo');
  protected readonly erro = signal<string | null>(null);

  protected abrirSeletor(): void {
    this.erro.set(null);
    this.inputArquivo()?.nativeElement.click();
  }

  protected selecionarArquivo(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    (evento.target as HTMLInputElement).value = '';
    if (!arquivo) {
      return;
    }

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      this.erro.set('Formato não suportado — envie JPEG, PNG ou WebP.');
      return;
    }

    this.erro.set(null);
    this.capturada.emit(arquivo);
  }

  protected remover(): void {
    this.removida.emit();
  }
}
