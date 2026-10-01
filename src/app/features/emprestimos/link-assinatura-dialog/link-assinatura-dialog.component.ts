import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { descreverErroHttp } from '../../../core/http/api-error';
import { EmprestimoService } from '../emprestimo.service';

export interface LinkAssinaturaDialogData {
  emprestimoId: number;
  nomePessoa: string;
}

/** Gera o link de assinatura remota do contrato de comodato (a pessoa assina
 * no próprio celular, sem login, confirmando os 4 últimos dígitos do CPF) — só pra contratos
 * pendentes. O token só aparece aqui, na criação (o backend guarda apenas o
 * hash): copie/envie agora; gerar outro link cancela o anterior. */
@Component({
  selector: 'app-link-assinatura-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './link-assinatura-dialog.component.html',
  styleUrl: './link-assinatura-dialog.component.scss'
})
export class LinkAssinaturaDialogComponent {
  protected readonly data = inject<LinkAssinaturaDialogData>(MAT_DIALOG_DATA);
  private readonly emprestimoService = inject(EmprestimoService);

  protected readonly gerando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly link = signal<string | null>(null);
  protected readonly codigo = signal<string | null>(null);
  protected readonly expiraEm = signal<string | null>(null);
  protected readonly copiado = signal(false);

  constructor() {
    this.emprestimoService.criarLinkAssinatura(this.data.emprestimoId).subscribe({
      next: (resposta) => {
        this.link.set(`${window.location.origin}/assinar/${resposta.token}`);
        this.codigo.set(resposta.codigo);
        this.expiraEm.set(resposta.expira_em);
        this.gerando.set(false);
      },
      error: (error) => {
        this.erro.set(descreverErroHttp(error.error));
        this.gerando.set(false);
      }
    });
  }

  protected async copiar(): Promise<void> {
    const link = this.link();
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      this.copiado.set(true);
    } catch {
      this.erro.set('Não foi possível copiar automaticamente — selecione o link e copie manualmente.');
    }
  }

  protected linkWhatsapp(): string {
    const texto =
      `Olá, ${this.data.nomePessoa}! Para assinar o contrato de empréstimo da Casa de Apoio Amor Fraterno, ` +
      `abra este link e confirme os 4 últimos dígitos do seu CPF: ${this.link()}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }
}
