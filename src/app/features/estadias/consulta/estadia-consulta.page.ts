import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PessoaService } from '../../pessoas/pessoa.service';
import { QuartoService } from '../../quartos/quarto.service';
import { EstadiaService } from '../estadia.service';
import { EstadiaResumo, SituacaoEstadia } from '../estadia.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { EstadiaDetalheDialogComponent } from '../detalhe-dialog/estadia-detalhe-dialog.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';
import { escutarRefrescoDaLista } from '../../../shared/ui/cadastro-dialog-host/lista-refresh.service';

const ITENS_POR_PAGINA = 20;

const OPCOES_SITUACAO: OpcaoFiltroPill[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Em acompanhamento', rotulo: 'Em acompanhamento' },
  { valor: 'Aguardando retorno', rotulo: 'Aguardando retorno', variante: 'aviso' },
  { valor: 'Finalizada', rotulo: 'Finalizada', variante: 'erro' }
];

@Component({
  selector: 'app-estadia-consulta-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    PaginaConsultaComponent,
    FiltroPillsComponent
  ],
  templateUrl: './estadia-consulta.page.html'
})
export class EstadiaConsultaPage {
  private readonly estadiaService = inject(EstadiaService);
  private readonly pessoaService = inject(PessoaService);
  private readonly quartoService = inject(QuartoService);
  private readonly dialog = inject(MatDialog);

  protected readonly opcoesSituacao = OPCOES_SITUACAO;
  protected readonly situacao = signal<SituacaoEstadia | ''>('Em acompanhamento');
  protected readonly termoBusca = signal('');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<EstadiaResumo[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);

  protected readonly nomesPessoas = signal<Record<number, string>>({});
  protected readonly numerosQuartos = signal<Record<number, string>>({});
  protected readonly exportando = signal(false);

  protected readonly itensPorPagina = ITENS_POR_PAGINA;

  constructor() {
    this.consultar();
    escutarRefrescoDaLista('/estadias', () => this.consultar());
  }

  protected visualizar(estadia: EstadiaResumo): void {
    this.dialog.open(EstadiaDetalheDialogComponent, {
      width: '560px',
      data: {
        estadiaId: estadia.id,
        linkEditar: ['/estadias', estadia.id, 'editar']
      }
    });
  }

  protected buscar(): void {
    this.pagina.set(0);
    this.consultar();
  }

  protected exportarCsv(): void {
    this.exportando.set(true);
    this.estadiaService
      .listar({
        situacao: this.situacao() || undefined,
        busca: this.termoBusca().trim() || undefined,
        take: 2000
      })
      .subscribe({
        next: (resultado) => {
          const idsPessoas = [...new Set(resultado.items.map((i) => i.idPessoa))].filter(
            (id) => this.nomesPessoas()[id] === undefined
          );
          forkJoin(idsPessoas.map((id) => this.pessoaService.buscar(id))).subscribe({
            next: (pessoas) => {
              const mapa = { ...this.nomesPessoas() };
              pessoas.forEach((p) => (mapa[p.id] = p.nome));
              this.gerarCsvEstadias(resultado.items, mapa);
            },
            error: () => this.gerarCsvEstadias(resultado.items, this.nomesPessoas())
          });
        },
        error: () => this.exportando.set(false)
      });
  }

  private gerarCsvEstadias(itens: EstadiaResumo[], nomesPessoas: Record<number, string>): void {
    exportarCsv(
      'estadias.csv',
      ['Pessoa', 'Tipo', 'Quarto', 'Entrada', 'Saída', 'Tempo estadia', 'Situação'],
      itens.map((e) => [
        nomesPessoas[e.idPessoa] ?? `Pessoa #${e.idPessoa}`,
        e.tipoPessoa,
        this.numerosQuartos()[e.idQuarto] ?? `Quarto #${e.idQuarto}`,
        e.dataEntrada,
        e.dataSaida,
        e.tempoEstadiaValor ? `${e.tempoEstadiaValor} ${e.tempoEstadiaUnidade}` : '',
        e.situacao
      ])
    );
    this.exportando.set(false);
  }

  protected filtrarPorSituacao(valor: SituacaoEstadia | ''): void {
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

  private consultar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.estadiaService
      .listar({
        situacao: this.situacao() || undefined,
        busca: this.termoBusca().trim() || undefined,
        skip: this.pagina() * ITENS_POR_PAGINA,
        take: ITENS_POR_PAGINA
      })
      .subscribe({
        next: (resultado) => {
          this.itens.set(resultado.items);
          this.total.set(resultado.total);
          this.carregando.set(false);
          this.carregarNomesEQuartos(resultado.items);
        },
        error: () => {
          this.erro.set('Não foi possível carregar a lista de estadias.');
          this.carregando.set(false);
        }
      });
  }

  private carregarNomesEQuartos(itens: EstadiaResumo[]): void {
    if (Object.keys(this.numerosQuartos()).length === 0) {
      this.quartoService.listar(false).subscribe((quartos) => {
        this.numerosQuartos.set(
          Object.fromEntries(quartos.map((q) => [q.id, `${q.numero}${q.descricao ? ' — ' + q.descricao : ''}`]))
        );
      });
    }

    const idsFaltantes = [...new Set(itens.map((i) => i.idPessoa))].filter(
      (id) => this.nomesPessoas()[id] === undefined
    );
    if (idsFaltantes.length === 0) {
      return;
    }

    forkJoin(idsFaltantes.map((id) => this.pessoaService.buscar(id).pipe())).subscribe({
      next: (pessoas) => {
        const mapa = { ...this.nomesPessoas() };
        pessoas.forEach((pessoa) => (mapa[pessoa.id] = pessoa.nome));
        this.nomesPessoas.set(mapa);
      },
      error: () => of(null)
    });
  }
}
