import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../core/http/api-error';
import { AssinaturaCanvasComponent } from '../../shared/ui/assinatura-canvas/assinatura-canvas.component';
import { ContratoDemoService } from './contrato-demo.service';

/**
 * Protótipo pra validar o fluxo "assinar contrato no tablet": preenche um
 * texto qualquer, assina no canvas por toque/caneta, manda pro backend
 * colar num PDF. Não é a tela de contrato de verdade (falta o texto/
 * cláusulas reais e o vínculo com Estadia/Empréstimo) — só prova o fluxo
 * ponta a ponta. Ver app/features/contrato_demo/router.py no backend.
 */
@Component({
  selector: 'app-contrato-demo',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    AssinaturaCanvasComponent
  ],
  templateUrl: './contrato-demo.page.html',
  styleUrl: './contrato-demo.page.scss'
})
export class ContratoDemoPage {
  private readonly contratoDemoService = inject(ContratoDemoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly assinaturaCanvas = viewChild(AssinaturaCanvasComponent);

  protected nomePessoa = '';
  protected textoContrato =
    'Pelo presente instrumento, a Casa de Apoio Amor Fraterno e o(a) paciente/acompanhante ' +
    'abaixo qualificado(a) firmam o presente contrato de estadia, nos termos do regulamento interno da entidade.';

  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly pdfUrl = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.revogarUrlAnterior());
  }

  protected podeGerar(): boolean {
    return (
      this.nomePessoa.trim().length > 0 &&
      this.textoContrato.trim().length > 0 &&
      !!this.assinaturaCanvas()?.obterAssinatura()
    );
  }

  protected gerarPdf(): void {
    const assinatura = this.assinaturaCanvas()?.obterAssinatura();
    if (!assinatura) {
      return;
    }

    this.erro.set(null);
    this.gerando.set(true);
    this.revogarUrlAnterior();
    this.pdfUrl.set(null);

    this.contratoDemoService
      .gerarPdf({
        nomePessoa: this.nomePessoa,
        textoContrato: this.textoContrato,
        assinaturaPngBase64: assinatura
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.gerando.set(false);
          this.pdfUrl.set(URL.createObjectURL(blob));
        },
        error: async (resposta) => {
          this.gerando.set(false);
          this.erro.set(await this.descreverErroBlob(resposta.error));
        }
      });
  }

  /** A resposta de erro também vem como Blob (o request pediu
   * `responseType: 'blob'` pra receber o PDF no caso de sucesso) — precisa
   * ler o texto e parsear como JSON antes de reusar `descreverErroHttp`. */
  private async descreverErroBlob(erro: unknown): Promise<string> {
    if (erro instanceof Blob) {
      try {
        return descreverErroHttp(JSON.parse(await erro.text()));
      } catch {
        return 'Ocorreu um erro inesperado. Tente novamente.';
      }
    }
    return descreverErroHttp(erro);
  }

  private revogarUrlAnterior(): void {
    const url = this.pdfUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
