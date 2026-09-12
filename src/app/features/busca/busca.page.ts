import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';
import { descreverErroHttp } from '../../core/http/api-error';
import { PessoaService } from '../pessoas/pessoa.service';
import { PessoaResumo } from '../pessoas/pessoa.model';
import { EstadiaService } from '../estadias/estadia.service';
import { EstadiaResumo } from '../estadias/estadia.model';
import { EmprestimoService } from '../emprestimos/emprestimo.service';
import { EmprestimoResumo } from '../emprestimos/emprestimo.model';
import { MaterialService } from '../materiais/material.service';
import { MaterialResumo } from '../materiais/material.model';
import { VoluntarioService } from '../voluntarios/voluntario.service';
import { VoluntarioResumo } from '../voluntarios/voluntario.model';

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
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
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

  protected readonly estadiaFinalizarAberta = signal<number | null>(null);
  protected readonly dataSaidaFinalizar = signal('');
  protected readonly finalizando = signal(false);
  protected readonly erroFinalizar = signal<string | null>(null);

  protected readonly emprestimoDevolverAberto = signal<number | null>(null);
  protected readonly dataDevolucao = signal('');
  protected readonly devolvendo = signal(false);
  protected readonly erroDevolver = signal<string | null>(null);

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
          todas.push({ ...estadia, nomePessoa, viaAcompanhante: false });
        });
        resultado.acompanhante.items.forEach((estadia) => {
          if (idsVistos.has(estadia.id)) {
            return;
          }
          idsVistos.add(estadia.id);
          todas.push({ ...estadia, nomePessoa, viaAcompanhante: true });
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
    this.erroFinalizar.set(null);
    this.dataSaidaFinalizar.set(new Date().toISOString().slice(0, 10));
    this.estadiaFinalizarAberta.set(estadia.id);
  }

  protected fecharFinalizar(): void {
    this.estadiaFinalizarAberta.set(null);
    this.erroFinalizar.set(null);
  }

  protected confirmarFinalizar(estadia: EstadiaComPessoa): void {
    const dataSaida = this.dataSaidaFinalizar();
    if (!dataSaida) {
      this.erroFinalizar.set('Informe a data de saída.');
      return;
    }

    this.finalizando.set(true);
    this.erroFinalizar.set(null);

    this.estadiaService.encerrar(estadia.id, dataSaida).subscribe({
      next: (atualizada) => {
        this.estadias.update((lista) =>
          lista.map((item) =>
            item.id === estadia.id
              ? { ...item, situacao: atualizada.situacao, dataSaida: atualizada.dataSaida }
              : item
          )
        );
        this.finalizando.set(false);
        this.estadiaFinalizarAberta.set(null);
      },
      error: (error) => {
        this.finalizando.set(false);
        this.erroFinalizar.set(descreverErroHttp(error.error));
      }
    });
  }

  protected estaDevolvido(emprestimo: EmprestimoComPessoa): boolean {
    return emprestimo.situacao === SITUACAO_EMPRESTIMO_DEVOLVIDO;
  }

  protected abrirDevolver(emprestimo: EmprestimoComPessoa, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fecharFinalizar();
    this.erroDevolver.set(null);
    this.dataDevolucao.set(new Date().toISOString().slice(0, 10));
    this.emprestimoDevolverAberto.set(emprestimo.id);
  }

  protected fecharDevolver(): void {
    this.emprestimoDevolverAberto.set(null);
    this.erroDevolver.set(null);
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
    if (this.estadiaFinalizarAberta() !== null && !alvo.closest('.busca__acao-finalizar')) {
      this.fecharFinalizar();
    }
    if (this.emprestimoDevolverAberto() !== null && !alvo.closest('.busca__acao-devolver')) {
      this.fecharDevolver();
    }
  }
}
