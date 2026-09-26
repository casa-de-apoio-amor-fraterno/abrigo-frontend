import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PessoaService } from '../../pessoas/pessoa.service';
import { Pessoa } from '../../pessoas/pessoa.model';
import { mascararCpf } from '../../../shared/util/cpf';
import { Emprestimo, EmprestimoItem } from '../emprestimo.model';
import { EmprestimoService } from '../emprestimo.service';

export interface EmprestimoDetalheDialogData {
  emprestimoId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de empréstimos). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota (ex.: popup aberto por cima da tela
   * Início, ver home.page.ts) — mesmo motivo/padrão de
   * `DetalheDialogData.aoEditar`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de um empréstimo — descrição completa (pessoa,
 * contrato, observação, situação em destaque) + a lista de itens
 * emprestados, cada um com material, patrimônio, datas e situação
 * própria. Antes usava o `DetalheDialogComponent` genérico só com Nº
 * contrato/situação (2026-09-26: "muito pobre em informações" — pedido do
 * time); esse aqui busca os dados completos (empréstimo + itens + pessoa)
 * em vez de depender só do que a listagem já tinha em mãos. */
@Component({
  selector: 'app-emprestimo-detalhe-dialog',
  imports: [DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './emprestimo-detalhe-dialog.component.html',
  styleUrl: './emprestimo-detalhe-dialog.component.scss'
})
export class EmprestimoDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<EmprestimoDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<EmprestimoDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly pessoaService = inject(PessoaService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly emprestimo = signal<Emprestimo | null>(null);
  protected readonly pessoa = signal<Pessoa | null>(null);
  protected readonly itens = signal<EmprestimoItem[]>([]);

  constructor() {
    forkJoin({
      emprestimo: this.emprestimoService.buscar(this.data.emprestimoId),
      itens: this.emprestimoService.listarItens(this.data.emprestimoId)
    }).subscribe({
      next: ({ emprestimo, itens }) => {
        this.emprestimo.set(emprestimo);
        this.itens.set(itens);
        this.carregando.set(false);
        this.pessoaService.buscar(emprestimo.idPessoa).subscribe({
          next: (pessoa) => this.pessoa.set(pessoa),
          // Pessoa é só um complemento (telefone/CPF) — a tela continua
          // útil sem ela se a busca falhar por algum motivo.
          error: () => undefined
        });
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do empréstimo.');
        this.carregando.set(false);
      }
    });
  }

  protected cpfMascarado(cpf: string): string {
    return mascararCpf(cpf);
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
