import { Component, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../auth/auth.service';
import { descreverErroHttp } from '../../http/api-error';
import { QuartoService } from '../../../features/quartos/quarto.service';
import { QuartoOcupacao, QuartoOcupante } from '../../../features/quartos/quarto.model';
import { EstadiaService } from '../../../features/estadias/estadia.service';
import { AcaoPopoverComponent } from '../../../shared/ui/acao-popover/acao-popover.component';

/** Placeholder puramente visual — não representa uma pessoa/estadia real,
 * só "aqui cabe mais um leito". */
type LeitoVago = { vago: true };

@Component({
  selector: 'app-home-page',
  imports: [
    DatePipe,
    RouterLink,
    AcaoPopoverComponent,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  private readonly quartoService = inject(QuartoService);
  private readonly estadiaService = inject(EstadiaService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly quartos = signal<QuartoOcupacao[]>([]);
  protected readonly revisaoAberta = signal<number | null>(null);

  // Clicar numa cama ocupada abre esse popover pra finalizar a estadia
  // direto da tela Início, sem precisar ir pra edição completa (mesmo
  // componente/estilo do "Finalizar" da busca global).
  protected readonly estadiaFinalizarAberta = signal<number | null>(null);
  protected readonly dataSaidaFinalizar = signal('');
  protected readonly finalizando = signal(false);
  protected readonly erroFinalizar = signal<string | null>(null);

  constructor() {
    this.carregarOcupacao();
  }

  protected leitosVagos(quarto: QuartoOcupacao): LeitoVago[] {
    const vagos = Math.max(quarto.leito - quarto.ocupantes.length, 0);
    return Array.from({ length: vagos }, () => ({ vago: true }));
  }

  protected alternarRevisao(quartoId: number): void {
    this.revisaoAberta.update((atual) => (atual === quartoId ? null : quartoId));
  }

  protected abrirFinalizar(ocupante: QuartoOcupante, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.erroFinalizar.set(null);
    this.dataSaidaFinalizar.set(new Date().toISOString().slice(0, 10));
    this.estadiaFinalizarAberta.set(ocupante.idEstadia);
  }

  protected fecharFinalizar(): void {
    this.estadiaFinalizarAberta.set(null);
    this.erroFinalizar.set(null);
  }

  protected confirmarFinalizar(idEstadia: number): void {
    const dataSaida = this.dataSaidaFinalizar();
    if (!dataSaida) {
      this.erroFinalizar.set('Informe a data de saída.');
      return;
    }

    this.finalizando.set(true);
    this.erroFinalizar.set(null);

    this.estadiaService.encerrar(idEstadia, dataSaida).subscribe({
      next: () => {
        this.finalizando.set(false);
        this.estadiaFinalizarAberta.set(null);
        // A estadia finalizada libera o leito — a forma mais simples e
        // correta de refletir isso (inclusive na fila de pendentes de
        // revisão, que pode promover a próxima mais recente) é recarregar.
        this.carregarOcupacao();
      },
      error: (error) => {
        this.finalizando.set(false);
        this.erroFinalizar.set(descreverErroHttp(error.error));
      }
    });
  }

  protected get totalLeitos(): number {
    return this.quartos().reduce((soma, q) => soma + q.leito, 0);
  }

  protected get totalOcupados(): number {
    return this.quartos().reduce((soma, q) => soma + q.ocupantes.length, 0);
  }

  protected get totalPendentesRevisao(): number {
    return this.quartos().reduce((soma, q) => soma + q.pendentesRevisao.length, 0);
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(event: MouseEvent): void {
    const alvo = event.target as HTMLElement;
    if (this.estadiaFinalizarAberta() !== null && !alvo.closest('.ocupacao__leito--ocupado')) {
      this.fecharFinalizar();
    }
  }

  private carregarOcupacao(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.quartoService.listarOcupacao().subscribe({
      next: (quartos) => {
        this.quartos.set(quartos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a ocupação dos quartos.');
        this.carregando.set(false);
      }
    });
  }
}
