import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PessoaService } from '../pessoas/pessoa.service';
import { PessoaResumo } from '../pessoas/pessoa.model';
import { EstadiaService } from '../estadias/estadia.service';
import { EstadiaResumo } from '../estadias/estadia.model';
import { MaterialService } from '../materiais/material.service';
import { MaterialResumo } from '../materiais/material.model';
import { VoluntarioService } from '../voluntarios/voluntario.service';
import { VoluntarioResumo } from '../voluntarios/voluntario.model';

const LIMITE_RESULTADOS = 10;
const LIMITE_PESSOAS_PARA_ESTADIAS = 5;

interface EstadiaComPessoa extends EstadiaResumo {
  nomePessoa: string;
}

@Component({
  selector: 'app-busca-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './busca.page.html',
  styleUrl: './busca.page.scss'
})
export class BuscaPage {
  private readonly pessoaService = inject(PessoaService);
  private readonly estadiaService = inject(EstadiaService);
  private readonly materialService = inject(MaterialService);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly route = inject(ActivatedRoute);

  protected readonly termo = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly buscando = signal(false);
  protected readonly buscou = signal(false);

  protected readonly pessoas = signal<PessoaResumo[]>([]);
  protected readonly estadias = signal<EstadiaComPessoa[]>([]);
  protected readonly materiais = signal<MaterialResumo[]>([]);
  protected readonly voluntarios = signal<VoluntarioResumo[]>([]);

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
    forkJoin(
      candidatas.map((pessoa) =>
        this.estadiaService
          .listar({ idPessoa: pessoa.id, take: LIMITE_RESULTADOS })
          .pipe(catchError(() => of({ items: [], total: 0 })))
      )
    ).subscribe((resultados) => {
      const todas: EstadiaComPessoa[] = [];
      resultados.forEach((resultado, indice) => {
        const nomePessoa = candidatas[indice].nome;
        resultado.items.forEach((estadia) => todas.push({ ...estadia, nomePessoa }));
      });
      this.estadias.set(todas);
    });
  }
}
