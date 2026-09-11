import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PessoaService } from '../pessoa.service';
import { PessoaResumo } from '../pessoa.model';
import { mascararCpf } from '../../../shared/util/cpf';
import { exportarCsv } from '../../../shared/util/csv';

const ITENS_POR_PAGINA = 20;

@Component({
  selector: 'app-pessoa-consulta-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './pessoa-consulta.page.html',
  styleUrl: './pessoa-consulta.page.scss'
})
export class PessoaConsultaPage {
  protected readonly mascararCpf = mascararCpf;

  private readonly pessoaService = inject(PessoaService);
  private readonly route = inject(ActivatedRoute);

  protected readonly termoBusca = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly itens = signal<PessoaResumo[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly exportando = signal(false);

  constructor() {
    this.consultar();
  }

  protected exportarCsv(): void {
    this.exportando.set(true);
    this.pessoaService
      .listar({ busca: this.termoBusca().trim() || undefined, take: 5000 })
      .subscribe({
        next: (resultado) => {
          exportarCsv(
            'pessoas.csv',
            ['Nome', 'CPF', 'Telefone', 'Data de nascimento'],
            // CPF mascarado — mesma regra de minimização da tela de consulta
            // (LGPD), o CSV é mais fácil de compartilhar/perder que a tela.
            resultado.items.map((p) => [p.nome, p.cpf ? mascararCpf(p.cpf) : null, p.telefone, p.data_nascimento])
          );
          this.exportando.set(false);
        },
        error: () => this.exportando.set(false)
      });
  }

  protected buscar(): void {
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

    this.pessoaService
      .listar({
        busca: this.termoBusca().trim() || undefined,
        skip: this.pagina() * ITENS_POR_PAGINA,
        take: ITENS_POR_PAGINA
      })
      .subscribe({
        next: (resultado) => {
          this.itens.set(resultado.items);
          this.total.set(resultado.total);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar a lista de pessoas.');
          this.carregando.set(false);
        }
      });
  }
}
