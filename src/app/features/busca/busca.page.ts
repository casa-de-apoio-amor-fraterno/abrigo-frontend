import { Component, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';
import { descreverErroHttp } from '../../core/http/api-error';
import { PessoaService } from '../pessoas/pessoa.service';
import { PessoaResumo } from '../pessoas/pessoa.model';
import { EstadiaService } from '../estadias/estadia.service';
import { Estadia, EstadiaResumo } from '../estadias/estadia.model';
import { EmprestimoService } from '../emprestimos/emprestimo.service';
import { EmprestimoItem, EmprestimoResumo } from '../emprestimos/emprestimo.model';
import { MaterialService } from '../materiais/material.service';
import { Material, MaterialResumo } from '../materiais/material.model';
import { MaterialLocalService } from '../materiais-locais/material-local.service';
import { MaterialLocal } from '../materiais-locais/material-local.model';
import { EmprestimoDetalheDialogComponent } from '../emprestimos/detalhe-dialog/emprestimo-detalhe-dialog.component';
import { ContratosDialogComponent } from '../emprestimos/contratos-dialog/contratos-dialog.component';
import { VoluntarioService } from '../voluntarios/voluntario.service';
import { VoluntarioResumo } from '../voluntarios/voluntario.model';
import { AcaoDialogComponent, DetalheAcao } from '../../shared/ui/acao-dialog/acao-dialog.component';
import { FinalizarEstadiaDialogComponent } from '../../shared/ui/finalizar-estadia-dialog/finalizar-estadia-dialog.component';

const LIMITE_RESULTADOS = 10;
const LIMITE_PESSOAS_PARA_ESTADIAS = 5;
const LIMITE_PESSOAS_PARA_EMPRESTIMOS = 5;

// Lista fixa confirmada no legado (CasaApoio.Material.Constants.pas,
// reaproveitada pra emprestimo_item.situacao): um empréstimo só está
// concluído quando devolvido — "Renovado" ainda é material em posse da
// pessoa, mesma regra de untFrmManutencaoEmprestimo.AtualizarSituacaoEmprestimo.
const SITUACAO_EMPRESTIMO_DEVOLVIDO = 'Devolvido';

interface EstadiaComPessoa extends EstadiaResumo {
  /** Nome da pessoa encontrada na busca — nem sempre a titular do leito
   * (`estadia.idPessoa`), ver `viaAcompanhante`. */
  nomePessoa: string;
  /** true quando a pessoa encontrada aparece como acompanhante
   * (`EstadiaAcompanhante`) de outro paciente, não como titular do leito. */
  viaAcompanhante: boolean;
  /** Id da pessoa buscada — só usado quando `viaAcompanhante`, pra achar o
   * registro dela em `EstadiaAcompanhante` (a `estadia.idPessoa` é o paciente). */
  idPessoaBuscada: number;
  /** Nome do titular do leito — só preenchido quando `viaAcompanhante`. */
  nomePaciente?: string;
}

interface EmprestimoComPessoa extends EmprestimoResumo {
  nomePessoa: string;
}

@Component({
  selector: 'app-busca-page',
  imports: [
    FormsModule,
    RouterLink,
    AcaoDialogComponent,
    FinalizarEstadiaDialogComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './busca.page.html',
  styleUrl: './busca.page.scss'
})
export class BuscaPage {
  private readonly pessoaService = inject(PessoaService);
  private readonly estadiaService = inject(EstadiaService);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly materialService = inject(MaterialService);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly materialLocalService = inject(MaterialLocalService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly termo = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly buscando = signal(false);
  protected readonly buscou = signal(false);

  protected readonly pessoas = signal<PessoaResumo[]>([]);
  protected readonly estadias = signal<EstadiaComPessoa[]>([]);
  protected readonly emprestimos = signal<EmprestimoComPessoa[]>([]);
  protected readonly materiais = signal<MaterialResumo[]>([]);
  protected readonly voluntarios = signal<VoluntarioResumo[]>([]);

  protected readonly finalizarDialog = viewChild.required(FinalizarEstadiaDialogComponent);

  protected readonly emprestimoDevolverAberto = signal<number | null>(null);
  protected readonly dataDevolucao = signal('');
  protected readonly devolvendo = signal(false);
  protected readonly erroDevolver = signal<string | null>(null);
  protected readonly itensDevolver = signal<EmprestimoItem[]>([]);

  // Aviso de ações que não puderam ser iniciadas (ex.: acompanhante já saiu).
  protected readonly avisoAcao = signal<string | null>(null);
  // Acompanhantes (estadia:pessoa) cuja saída já foi registrada nesta tela —
  // a busca por acompanhante continua devolvendo a estadia do paciente, então
  // esconde o botão em vez de recarregar.
  protected readonly saidasRegistradas = signal<ReadonlySet<string>>(new Set());

  // Alocar material (mudar local): mesmo fluxo da aba de cadastro do
  // material, agora direto da busca.
  protected readonly materialAlocarAberto = signal<number | null>(null);
  protected readonly materialAlocarDetalhe = signal<Material | null>(null);
  protected readonly locais = signal<MaterialLocal[]>([]);
  protected readonly idLocalAlocar = signal<number | null>(null);
  protected readonly alocando = signal(false);
  protected readonly erroAlocar = signal<string | null>(null);

  protected readonly detalhesAlocar = computed<DetalheAcao[]>(() => {
    const resumo = this.materiais().find((m) => m.id === this.materialAlocarAberto());
    if (!resumo) {
      return [];
    }
    const detalhe = this.materialAlocarDetalhe();
    const localAtual = this.locais().find((l) => l.id === detalhe?.idLocal)?.nome;
    const destino = this.locais().find((l) => l.id === this.idLocalAlocar())?.nome;
    return [
      { rotulo: 'Material', valor: resumo.descricao },
      { rotulo: 'Nº patrimônio', valor: resumo.numeroPatrimonio || '—' },
      { rotulo: 'Situação atual', valor: resumo.situacao },
      { rotulo: 'Local atual', valor: localAtual ?? '—' },
      { rotulo: 'Novo local', valor: destino ?? 'Não selecionado' }
    ];
  });

  protected readonly detalhesDevolver = computed<DetalheAcao[]>(() => {
    const emprestimo = this.emprestimos().find((e) => e.id === this.emprestimoDevolverAberto());
    if (!emprestimo) {
      return [];
    }
    const prazo = emprestimo.dataDevolucao
      ? new Date(emprestimo.dataDevolucao + 'T00:00:00').toLocaleDateString('pt-BR')
      : '—';
    return [
      { rotulo: 'Pessoa', valor: emprestimo.nomePessoa },
      { rotulo: 'Nº contrato', valor: emprestimo.numeroContrato || '—' },
      { rotulo: 'Situação atual', valor: emprestimo.situacao },
      { rotulo: 'Devolução prevista', valor: prazo }
    ];
  });

  constructor() {
    // Reage a novas buscas feitas pela barra do topo (mesma rota /busca,
    // só troca o queryParam `q` — o Angular reaproveita o componente).
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const q = params.get('q') ?? '';
      if (q && q !== this.termo()) {
        this.termo.set(q);
        this.buscar();
      }
    });

    if (this.termo().trim()) {
      this.buscar();
    }
  }

  protected buscar(): void {
    const termo = this.termo().trim();
    if (!termo) {
      return;
    }

    this.buscando.set(true);
    this.buscou.set(true);

    forkJoin({
      pessoas: this.pessoaService.listar({ busca: termo, take: LIMITE_RESULTADOS }),
      materiais: this.materialService.listar({ busca: termo, take: LIMITE_RESULTADOS }),
      voluntarios: this.voluntarioService.listar({ busca: termo, take: LIMITE_RESULTADOS })
    }).subscribe(({ pessoas, materiais, voluntarios }) => {
      this.pessoas.set(pessoas.items);
      this.materiais.set(materiais.items);
      this.voluntarios.set(voluntarios.items);
      this.buscarEstadiasDasPessoas(pessoas.items);
      this.buscarEmprestimosDasPessoas(pessoas.items);
      this.buscando.set(false);
    });
  }

  private buscarEstadiasDasPessoas(pessoas: PessoaResumo[]): void {
    const candidatas = pessoas.slice(0, LIMITE_PESSOAS_PARA_ESTADIAS);
    if (candidatas.length === 0) {
      this.estadias.set([]);
      return;
    }

    // O nome da pessoa é anexado depois, sem round-trip extra — o
    // resumo da estadia não traz o nome, mas já temos ele da busca acima.
    // Cada candidata é buscada nos dois papéis possíveis: titular do leito
    // (idPessoa) e acompanhante de outro paciente (idPessoaAcompanhante) —
    // uma pessoa pode aparecer nos dois, em estadias diferentes.
    forkJoin(
      candidatas.map((pessoa) =>
        forkJoin({
          titular: this.estadiaService
            .listar({ idPessoa: pessoa.id, take: LIMITE_RESULTADOS })
            .pipe(catchError(() => of({ items: [], total: 0 }))),
          acompanhante: this.estadiaService
            .listar({ idPessoaAcompanhante: pessoa.id, take: LIMITE_RESULTADOS })
            .pipe(catchError(() => of({ items: [], total: 0 })))
        })
      )
    ).subscribe((resultados) => {
      const todas: EstadiaComPessoa[] = [];
      const idsVistos = new Set<number>();
      resultados.forEach((resultado, indice) => {
        const nomePessoa = candidatas[indice].nome;
        resultado.titular.items.forEach((estadia) => {
          if (idsVistos.has(estadia.id)) {
            return;
          }
          idsVistos.add(estadia.id);
          todas.push({ ...estadia, nomePessoa, viaAcompanhante: false, idPessoaBuscada: candidatas[indice].id });
        });
        resultado.acompanhante.items.forEach((estadia) => {
          if (idsVistos.has(estadia.id)) {
            return;
          }
          idsVistos.add(estadia.id);
          todas.push({ ...estadia, nomePessoa, viaAcompanhante: true, idPessoaBuscada: candidatas[indice].id });
        });
      });

      this.resolverNomesPacientes(todas);
    });
  }

  private resolverNomesPacientes(estadias: EstadiaComPessoa[]): void {
    // Quando a pessoa encontrada é acompanhante, `estadia.idPessoa` é o
    // titular do leito (outra pessoa) — busca o nome dele pra exibir
    // "Acompanhante de X" em vez do nome de quem foi buscado.
    const comoAcompanhante = estadias.filter((e) => e.viaAcompanhante);
    if (comoAcompanhante.length === 0) {
      this.estadias.set(estadias);
      return;
    }

    const idsPacientes = [...new Set(comoAcompanhante.map((e) => e.idPessoa))];
    forkJoin(
      idsPacientes.map((id) => this.pessoaService.buscar(id).pipe(catchError(() => of(null))))
    ).subscribe((pacientes) => {
      const nomesPorId = new Map<number, string>();
      pacientes.forEach((pessoa, indice) => {
        if (pessoa) {
          nomesPorId.set(idsPacientes[indice], pessoa.nome);
        }
      });
      this.estadias.set(
        estadias.map((estadia) =>
          estadia.viaAcompanhante
            ? { ...estadia, nomePaciente: nomesPorId.get(estadia.idPessoa) }
            : estadia
        )
      );
    });
  }

  private buscarEmprestimosDasPessoas(pessoas: PessoaResumo[]): void {
    const candidatas = pessoas.slice(0, LIMITE_PESSOAS_PARA_EMPRESTIMOS);
    if (candidatas.length === 0) {
      this.emprestimos.set([]);
      return;
    }

    forkJoin(
      candidatas.map((pessoa) =>
        this.emprestimoService
          .listar({ idPessoa: pessoa.id, take: LIMITE_RESULTADOS })
          .pipe(catchError(() => of({ items: [], total: 0 })))
      )
    ).subscribe((resultados) => {
      const todos: EmprestimoComPessoa[] = [];
      resultados.forEach((resultado, indice) => {
        const nomePessoa = candidatas[indice].nome;
        resultado.items.forEach((emprestimo) => todos.push({ ...emprestimo, nomePessoa }));
      });
      this.emprestimos.set(todos);
    });
  }

  protected abrirFinalizar(estadia: EstadiaComPessoa, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fecharDevolver();
    this.avisoAcao.set(null);

    if (!estadia.viaAcompanhante) {
      this.finalizarDialog().abrir(estadia.id, estadia.dataEntrada, estadia.nomePessoa);
      return;
    }

    // Pessoa encontrada como acompanhante: `estadia.id` é a do PACIENTE —
    // finalizar por ela encerraria a estadia errada. Registra só a saída
    // do acompanhante (ver `FinalizarEstadiaDialogComponent`).
    this.estadiaService
      .listarAcompanhantes(estadia.id)
      .pipe(catchError(() => of(null)))
      .subscribe((acompanhantes) => {
        const registro = acompanhantes?.find((a) => a.idPessoa === estadia.idPessoaBuscada && !a.dataSaida);
        if (!registro) {
          this.avisoAcao.set(
            `Não foi possível localizar a presença ativa de ${estadia.nomePessoa} nesta estadia (talvez já tenha saído).`
          );
          return;
        }
        this.acompanhanteEmSaida = estadia;
        this.finalizarDialog().abrir(estadia.id, registro.dataEntrada, estadia.nomePessoa, registro.id);
      });
  }

  private acompanhanteEmSaida: EstadiaComPessoa | null = null;

  protected aoFinalizarAcompanhante(): void {
    const estadia = this.acompanhanteEmSaida;
    if (estadia) {
      this.saidasRegistradas.update((atual) => new Set(atual).add(this.chaveSaida(estadia)));
    }
    this.acompanhanteEmSaida = null;
  }

  protected chaveSaida(estadia: EstadiaComPessoa): string {
    return `${estadia.id}:${estadia.idPessoaBuscada}`;
  }

  protected abrirRenovar(emprestimo: EmprestimoComPessoa): void {
    this.dialog
      .open(EmprestimoDetalheDialogComponent, {
        width: '560px',
        data: { emprestimoId: emprestimo.id, linkEditar: ['/emprestimos', emprestimo.id, 'editar'], acoesRapidas: true }
      })
      .afterClosed()
      .subscribe((alterou) => {
        if (alterou) {
          this.buscarEmprestimosDasPessoas(this.pessoas());
        }
      });
  }

  protected verContratos(emprestimo: EmprestimoComPessoa): void {
    this.dialog.open(ContratosDialogComponent, {
      width: '480px',
      data: { emprestimoId: emprestimo.id, nomePessoa: emprestimo.nomePessoa }
    });
  }

  protected podeAlocar(material: MaterialResumo): boolean {
    // Emprestado volta pelo fluxo de empréstimo; Inutilizado é baixa definitiva.
    return material.situacao === 'Disponível' || material.situacao === 'Alocado';
  }

  protected abrirAlocar(material: MaterialResumo, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.erroAlocar.set(null);
    this.idLocalAlocar.set(null);
    this.materialAlocarDetalhe.set(null);
    this.materialAlocarAberto.set(material.id);
    this.materialLocalService.listar().subscribe((locais) => this.locais.set(locais));
    this.materialService.buscar(material.id).subscribe((detalhe) => {
      if (this.materialAlocarAberto() === material.id) {
        this.materialAlocarDetalhe.set(detalhe);
        this.idLocalAlocar.set(detalhe.idLocal);
      }
    });
  }

  protected fecharAlocar(): void {
    this.materialAlocarAberto.set(null);
    this.erroAlocar.set(null);
  }

  protected confirmarAlocar(material: MaterialResumo): void {
    const idLocal = this.idLocalAlocar();
    if (idLocal === null) {
      this.erroAlocar.set('Selecione o local.');
      return;
    }
    this.alocando.set(true);
    this.erroAlocar.set(null);
    this.materialService.alocar(material.id, idLocal).subscribe({
      next: (atualizado) => {
        this.alocando.set(false);
        this.materialAlocarAberto.set(null);
        this.materiais.update((lista) =>
          lista.map((item) =>
            item.id === material.id
              ? { ...item, situacao: atualizado.situacao, disponivelEmprestimo: atualizado.disponivelEmprestimo }
              : item
          )
        );
      },
      error: (error) => {
        this.alocando.set(false);
        this.erroAlocar.set(descreverErroHttp(error.error));
      }
    });
  }

  protected aoFinalizarEstadia(estadiaAtualizada: Estadia): void {
    this.estadias.update((lista) =>
      lista.map((item) =>
        item.id === estadiaAtualizada.id
          ? { ...item, situacao: estadiaAtualizada.situacao, dataSaida: estadiaAtualizada.dataSaida }
          : item
      )
    );
  }

  protected estaDevolvido(emprestimo: EmprestimoComPessoa): boolean {
    return emprestimo.situacao === SITUACAO_EMPRESTIMO_DEVOLVIDO;
  }

  protected abrirDevolver(emprestimo: EmprestimoComPessoa, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.finalizarDialog().fechar();
    this.erroDevolver.set(null);
    this.dataDevolucao.set(new Date().toISOString().slice(0, 10));
    this.emprestimoDevolverAberto.set(emprestimo.id);
    this.itensDevolver.set([]);
    this.emprestimoService.listarItens(emprestimo.id).subscribe((itens) => this.itensDevolver.set(itens));
  }

  protected fecharDevolver(): void {
    this.emprestimoDevolverAberto.set(null);
    this.erroDevolver.set(null);
    this.itensDevolver.set([]);
  }

  protected fotoThumbUrl(idMaterial: number): string {
    return this.materialService.fotoThumbUrl(idMaterial);
  }

  protected confirmarDevolver(emprestimo: EmprestimoComPessoa): void {
    const dataDevolucao = this.dataDevolucao();
    if (!dataDevolucao) {
      this.erroDevolver.set('Informe a data de devolução.');
      return;
    }

    const idUsuario = this.auth.sessao()?.usuario_id;
    if (idUsuario === undefined) {
      this.erroDevolver.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.devolvendo.set(true);
    this.erroDevolver.set(null);

    this.emprestimoService.devolver(emprestimo.id, idUsuario, dataDevolucao).subscribe({
      next: (atualizado) => {
        this.emprestimos.update((lista) =>
          lista.map((item) => (item.id === emprestimo.id ? { ...item, situacao: atualizado.situacao } : item))
        );
        this.devolvendo.set(false);
        this.emprestimoDevolverAberto.set(null);
      },
      error: (error) => {
        this.devolvendo.set(false);
        this.erroDevolver.set(descreverErroHttp(error.error));
      }
    });
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(event: MouseEvent): void {
    const alvo = event.target as HTMLElement;
    if (this.finalizarDialog().aberta() !== null && !alvo.closest('.busca__acao-finalizar')) {
      this.finalizarDialog().fechar();
    }
    if (this.emprestimoDevolverAberto() !== null && !alvo.closest('.busca__acao-devolver')) {
      this.fecharDevolver();
    }
  }
}
