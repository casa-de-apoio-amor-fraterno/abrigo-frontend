import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PessoaService } from '../../pessoas/pessoa.service';
import { EmprestimoService } from '../emprestimo.service';
import { EmprestimoResumo } from '../emprestimo.model';
import { exportarCsv } from '../../../shared/util/csv';
import { PaginaConsultaComponent } from '../../../shared/ui/pagina-consulta/pagina-consulta.component';
import { DetalheDialogComponent } from '../../../shared/ui/detalhe-dialog/detalhe-dialog.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../../../shared/ui/filtro-pills/filtro-pills.component';

const ITENS_POR_PAGINA = 20;

const OPCOES_SITUACAO: OpcaoFiltroPill[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Pendente', rotulo: 'Pendente' },
  { valor: 'Devolvido', rotulo: 'Devolvido' }
];

@Component({
  selector: 'app-emprestimo-consulta-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, PaginaConsultaComponent, FiltroPillsComponent],
  templateUrl: './emprestimo-consulta.page.html'
})
export class EmprestimoConsultaPage {
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly dialog = inject(MatDialog);

  protected readonly opcoesSituacao = OPCOES_SITUACAO;
  protected readonly situacao = signal('Pendente');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<EmprestimoResumo[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);

  protected readonly nomesPessoas = signal<Record<number, string>>({});
  protected readonly exportando = signal(false);

  protected readonly itensPorPagina = ITENS_POR_PAGINA;

  constructor() {
    this.consultar();
  }

  protected visualizar(emprestimo: EmprestimoResumo): void {
    this.dialog.open(DetalheDialogComponent, {
      width: '420px',
      data: {
        titulo: this.nomesPessoas()[emprestimo.idPessoa] || `Pessoa #${emprestimo.idPessoa}`,
        campos: [
          { rotulo: 'Nº contrato', valor: emprestimo.numeroContrato || '—' },
          { rotulo: 'Situação', valor: emprestimo.situacao }
        ],
        linkEditar: ['/emprestimos', emprestimo.id, 'editar'],
        labelEditar: 'Editar empréstimo'
      }
    });
  }

  protected exportarCsv(): void {
    this.exportando.set(true);
    this.emprestimoService.listar({ situacao: this.situacao() || undefined, take: 2000 }).subscribe({
      next: (resultado) => {
        const idsPessoas = [...new Set(resultado.items.map((i) => i.idPessoa))].filter(
          (id) => this.nomesPessoas()[id] === undefined
        );
        forkJoin(idsPessoas.map((id) => this.pessoaService.buscar(id))).subscribe({
          next: (pessoas) => {
            const mapa = { ...this.nomesPessoas() };
            pessoas.forEach((p) => (mapa[p.id] = p.nome));
            this.gerarCsvEmprestimos(resultado.items, mapa);
          },
          error: () => this.gerarCsvEmprestimos(resultado.items, this.nomesPessoas())
        });
      },
      error: () => this.exportando.set(false)
    });
  }

  private gerarCsvEmprestimos(itens: EmprestimoResumo[], nomesPessoas: Record<number, string>): void {
    exportarCsv(
      'emprestimos.csv',
      ['Pessoa', 'Nº contrato', 'Situação'],
      itens.map((e) => [nomesPessoas[e.idPessoa] ?? `Pessoa #${e.idPessoa}`, e.numeroContrato, e.situacao])
    );
    this.exportando.set(false);
  }

  protected filtrarPorSituacao(valor: string): void {
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

    this.emprestimoService
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
          this.carregarNomes(resultado.items);
        },
        error: () => {
          this.erro.set('Não foi possível carregar a lista de empréstimos.');
          this.carregando.set(false);
        }
      });
  }

  private carregarNomes(itens: EmprestimoResumo[]): void {
    const idsFaltantes = [...new Set(itens.map((i) => i.idPessoa))].filter(
      (id) => this.nomesPessoas()[id] === undefined
    );
    idsFaltantes.forEach((id) => {
      this.pessoaService.buscar(id).subscribe((pessoa) => {
        this.nomesPessoas.update((mapa) => ({ ...mapa, [pessoa.id]: pessoa.nome }));
      });
    });
  }
}
