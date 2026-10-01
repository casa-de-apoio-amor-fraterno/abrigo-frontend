import { DatePipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { AssinaturaCanvasComponent } from '../../../shared/ui/assinatura-canvas/assinatura-canvas.component';
import { AssinaturaPublicaService, ResumoAssinaturaPublica } from './assinatura-publica.service';

type Etapa = 'carregando' | 'invalido' | 'cpf' | 'assinar' | 'concluido';

/** Página pública (sem login) onde a pessoa assina o contrato de comodato
 * pelo próprio celular: abre o link, confirma o CPF, lê o contrato e assina.
 * Só existe pra contratos pendentes — ver `link_assinatura.py` no backend. */
@Component({
  selector: 'app-assinatura-publica-page',
  imports: [
    DatePipe,
    AssinaturaCanvasComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './assinatura-publica.page.html',
  styleUrl: './assinatura-publica.page.scss'
})
export class AssinaturaPublicaPage {
  private readonly servico = inject(AssinaturaPublicaService);
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  protected readonly etapa = signal<Etapa>('carregando');
  protected readonly mensagemInvalido = signal('');
  protected readonly cpf = signal('');
  protected readonly resumo = signal<ResumoAssinaturaPublica | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly concordo = signal(false);
  protected readonly abrindoPdf = signal(false);
  protected readonly assinaturaCanvas = viewChild(AssinaturaCanvasComponent);

  constructor() {
    this.servico.situacao(this.token).subscribe({
      next: () => this.etapa.set('cpf'),
      error: (error) => this.marcarInvalido(error)
    });
  }

  /** Só os 4 últimos dígitos do CPF (o link/código já é o segredo principal). */
  protected digitarCpf(valor: string): void {
    this.cpf.set(valor.replace(/\D/g, '').slice(0, 4));
  }

  protected cpfCompleto(): boolean {
    return this.cpf().length === 4;
  }

  protected podeAssinar(): boolean {
    return this.concordo() && !!this.assinaturaCanvas()?.obterAssinatura();
  }

  protected verificar(): void {
    if (!this.cpfCompleto()) {
      this.erro.set('Informe os 4 últimos dígitos do CPF.');
      return;
    }
    this.ocupado.set(true);
    this.erro.set(null);
    this.servico.verificar(this.token, this.cpf()).subscribe({
      next: (resumo) => {
        this.ocupado.set(false);
        this.resumo.set(resumo);
        this.etapa.set('assinar');
      },
      error: (error) => {
        this.ocupado.set(false);
        // 410 = link inutilizável (expirou/bloqueou depois de errar demais).
        if (error.status === 410) {
          this.marcarInvalido(error);
          return;
        }
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected lerContrato(): void {
    this.abrindoPdf.set(true);
    this.erro.set(null);
    // Abre a aba já no clique (antes da resposta): navegadores de celular
    // bloqueiam popups abertos depois de uma chamada assíncrona.
    const aba = window.open('', '_blank');
    this.servico.previa(this.token, this.cpf()).subscribe({
      next: (blob) => {
        this.abrindoPdf.set(false);
        const url = URL.createObjectURL(blob);
        if (aba) {
          aba.location.href = url;
        } else {
          window.location.href = url;
        }
      },
      error: () => {
        this.abrindoPdf.set(false);
        aba?.close();
        this.erro.set('Não foi possível abrir o contrato. Tente novamente.');
      }
    });
  }

  protected assinar(): void {
    const assinatura = this.assinaturaCanvas()?.obterAssinatura();
    if (!assinatura || !this.concordo()) {
      return;
    }
    this.ocupado.set(true);
    this.erro.set(null);
    this.servico.assinar(this.token, this.cpf(), assinatura).subscribe({
      next: () => {
        this.ocupado.set(false);
        this.etapa.set('concluido');
      },
      error: (error) => {
        this.ocupado.set(false);
        if (error.status === 410 || error.status === 409) {
          this.marcarInvalido(error);
          return;
        }
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  private marcarInvalido(error: { error?: unknown }): void {
    this.mensagemInvalido.set(
      descreverErroHttp(error.error) || 'Este link não é válido. Peça um novo à equipe.'
    );
    this.etapa.set('invalido');
  }
}
