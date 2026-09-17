import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FiltroPillsComponent } from '../../shared/ui/filtro-pills/filtro-pills.component';
import { descreverErroHttp } from '../../core/http/api-error';
import {
  OPCOES_PERIODO_RELATORIO,
  PeriodoRelatorio,
  RELATORIOS_DISPONIVEIS,
  RelatorioDisponivel,
  RelatorioResumoItem,
  RelatorioService,
  TipoRelatorio
} from './relatorio.service';

@Component({
  selector: 'app-relatorio-detalhe-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, FiltroPillsComponent],
  templateUrl: './relatorio-detalhe.page.html',
  styleUrl: './relatorio-detalhe.page.scss'
})
export class RelatorioDetalhePage {
  private readonly relatorioService = inject(RelatorioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly relatorio: RelatorioDisponivel;
  protected readonly opcoesPeriodo = OPCOES_PERIODO_RELATORIO;
  protected readonly periodo = signal<PeriodoRelatorio>('mensal');

  protected readonly carregandoResumo = signal(true);
  protected readonly resumo = signal<RelatorioResumoItem[]>([]);
  protected readonly erroResumo = signal<string | null>(null);

  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly pdfUrl = signal<string | null>(null);

  constructor() {
    const tipo = this.route.snapshot.paramMap.get('tipo') as TipoRelatorio | null;
    const encontrado = RELATORIOS_DISPONIVEIS.find((item) => item.tipo === tipo);
    if (!encontrado) {
      this.router.navigate(['/relatorios']);
      // Só pra satisfazer o tipo não-nulo de `relatorio` abaixo — a
      // navegação acima já tira o usuário desta tela antes de qualquer
      // render.
      this.relatorio = RELATORIOS_DISPONIVEIS[0];
      return;
    }
    this.relatorio = encontrado;
    this.destroyRef.onDestroy(() => this.revogarUrlAnterior());
    this.carregarResumo();
  }

  protected alterarPeriodo(periodo: string): void {
    this.periodo.set(periodo as PeriodoRelatorio);
    // Trocar o período invalida o PDF já gerado (era de outra janela de
    // tempo) — some com o link "Abrir relatório gerado" até o usuário
    // gerar de novo pro período atual.
    this.revogarUrlAnterior();
    this.pdfUrl.set(null);
    this.carregarResumo();
  }

  private carregarResumo(): void {
    this.carregandoResumo.set(true);
    this.erroResumo.set(null);
    this.relatorioService
      .buscarResumo(this.relatorio.tipo, this.relatorio.suportaPeriodo ? this.periodo() : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resposta) => {
          this.resumo.set(resposta.itens);
          this.carregandoResumo.set(false);
        },
        error: (erro) => {
          this.erroResumo.set(descreverErroHttp(erro.error));
          this.carregandoResumo.set(false);
        }
      });
  }

  protected gerarPdf(): void {
    this.erro.set(null);
    this.gerando.set(true);
    this.revogarUrlAnterior();
    this.pdfUrl.set(null);

    this.relatorioService
      .gerarPdf(this.relatorio.tipo, this.relatorio.suportaPeriodo ? this.periodo() : undefined)
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

  private async descreverErroBlob(erro: unknown): Promise<string> {
    if (erro instanceof Blob) {
      try {
        return descreverErroHttp(JSON.parse(await erro.text()));
      } catch {
        return 'Não foi possível gerar o relatório. Tente novamente.';
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
