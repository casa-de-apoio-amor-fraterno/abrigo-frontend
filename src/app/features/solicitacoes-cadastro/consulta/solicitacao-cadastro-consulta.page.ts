import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { descreverErroHttp } from '../../../core/http/api-error';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';
import { SolicitacaoCadastro, SituacaoSolicitacaoCadastro } from '../solicitacao-cadastro.model';
import { SolicitacaoCadastroService } from '../solicitacao-cadastro.service';

const ITENS_POR_PAGINA = 20;

const OPCOES_SITUACAO: OpcaoFiltroPill[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Pendente', rotulo: 'Pendente' },
  { valor: 'Aprovada', rotulo: 'Aprovada' },
  { valor: 'Revogada', rotulo: 'Revogada' }
];

/**
 * Painel de aprovação do auto-cadastro público de paciente (feature nova,
 * ver solicitacao-cadastro-publico.page.ts) — aprovar cria a `Pessoa`;
 * revogar só descarta a solicitação, nenhuma das duas é reversível depois.
 */
@Component({
  selector: 'app-solicitacao-cadastro-consulta-page',
  imports: [MatButtonModule, MatIconModule, PaginaConsultaComponent, FiltroPillsComponent],
  templateUrl: './solicitacao-cadastro-consulta.page.html',
  styleUrl: './solicitacao-cadastro-consulta.page.scss'
})
export class SolicitacaoCadastroConsultaPage {
  private readonly solicitacaoService = inject(SolicitacaoCadastroService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly opcoesSituacao = OPCOES_SITUACAO;
  protected readonly situacao = signal<SituacaoSolicitacaoCadastro | ''>('Pendente');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<SolicitacaoCadastro[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);

  protected readonly fotosUrl = signal<Record<number, string>>({});
  protected readonly processando = signal<number | null>(null);

  protected readonly itensPorPagina = ITENS_POR_PAGINA;

  constructor() {
    this.consultar();
    this.destroyRef.onDestroy(() => {
      Object.values(this.fotosUrl()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  protected filtrarPorSituacao(valor: SituacaoSolicitacaoCadastro | ''): void {
    this.situacao.set(valor);
    this.pagina.set(0);
    this.consultar();
  }

  protected paginaAnterior(): void {
    if (this.pagina() === 0) {
      return;
    }
    this.pagina.update((p) => p - 1);
    this.consultar();
  }

  protected proximaPagina(): void {
    if ((this.pagina() + 1) * ITENS_POR_PAGINA >= this.total()) {
      return;
    }
    this.pagina.update((p) => p + 1);
    this.consultar();
  }

  protected aprovar(solicitacao: SolicitacaoCadastro): void {
    if (!confirm(`Aprovar o cadastro de "${solicitacao.nome}"? Isso cria um novo registro de pessoa.`)) {
      return;
    }
    this.processar(solicitacao, this.solicitacaoService.aprovar(solicitacao.id));
  }

  protected revogar(solicitacao: SolicitacaoCadastro): void {
    if (!confirm(`Revogar o cadastro de "${solicitacao.nome}"? A solicitação será descartada.`)) {
      return;
    }
    this.processar(solicitacao, this.solicitacaoService.revogar(solicitacao.id));
  }

  private processar(solicitacao: SolicitacaoCadastro, operacao: Observable<SolicitacaoCadastro>): void {
    this.processando.set(solicitacao.id);
    this.erro.set(null);

    operacao.subscribe({
      next: () => {
        this.processando.set(null);
        this.consultar();
      },
      error: (error) => {
        this.processando.set(null);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  private consultar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.solicitacaoService
      .listar({
        situacao: this.situacao() || undefined,
        skip: this.pagina() * ITENS_POR_PAGINA,
        take: ITENS_POR_PAGINA
      })
      .subscribe({
        next: (resultado) => {
          this.itens.set(resultado.items);
          this.total.set(resultado.total);
          this.carregando.set(false);
          this.carregarFotos(resultado.items);
        },
        error: () => {
          this.erro.set('Não foi possível carregar as solicitações.');
          this.carregando.set(false);
        }
      });
  }

  private carregarFotos(itens: SolicitacaoCadastro[]): void {
    itens
      .filter((item) => item.temFoto && this.fotosUrl()[item.id] === undefined)
      .forEach((item) => {
        this.solicitacaoService
          .obterFoto(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((blob) => {
            this.fotosUrl.update((mapa) => ({ ...mapa, [item.id]: URL.createObjectURL(blob) }));
          });
      });
  }
}
