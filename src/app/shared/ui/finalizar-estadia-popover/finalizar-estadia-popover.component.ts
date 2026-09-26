import { Component, inject, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { EstadiaService } from '../../../features/estadias/estadia.service';
import { Estadia } from '../../../features/estadias/estadia.model';
import { agoraDatetimeLocal, calcularTempoEstadia } from '../../util/data';
import { AcaoPopoverComponent } from '../acao-popover/acao-popover.component';

/**
 * Popover "Finalizar estadia" (data de saída), usado a partir de dois
 * lugares — clicar numa cama ocupada no Início e o botão "Finalizar" nos
 * resultados de estadia da busca global. Antes era duplicado nas duas
 * páginas (a busca nem tinha o campo "Tempo estadia"); agora é um
 * componente único, controlado via `abrir`/`fechar`, sempre ancorado no
 * canto inferior direito (ver AcaoPopoverComponent) — por isso uma
 * instância só por página, fora de qualquer `@for`, serve pra qualquer
 * item clicado.
 *
 * Tempo de estadia não é mais digitado aqui — calculado a partir de
 * entrada/saída (ver `calcularTempoEstadia`) só na confirmação, com base
 * na data de saída informada nesse momento.
 */
@Component({
  selector: 'app-finalizar-estadia-popover',
  imports: [AcaoPopoverComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './finalizar-estadia-popover.component.html'
})
export class FinalizarEstadiaPopoverComponent {
  private readonly estadiaService = inject(EstadiaService);

  readonly finalizado = output<Estadia>();

  protected readonly idEstadiaAberta = signal<number | null>(null);
  protected readonly nomePessoa = signal('');
  protected readonly dataSaida = signal('');
  protected readonly finalizando = signal(false);
  protected readonly erro = signal<string | null>(null);

  private dataEntrada = '';

  readonly aberta = this.idEstadiaAberta.asReadonly();

  abrir(idEstadia: number, dataEntrada: string, nomePessoa = ''): void {
    this.erro.set(null);
    this.nomePessoa.set(nomePessoa);
    this.dataEntrada = dataEntrada;
    this.dataSaida.set(agoraDatetimeLocal());
    this.idEstadiaAberta.set(idEstadia);
  }

  fechar(): void {
    this.idEstadiaAberta.set(null);
    this.erro.set(null);
  }

  protected alterarDataSaida(valor: string): void {
    this.dataSaida.set(valor);
  }

  protected confirmar(): void {
    const idEstadia = this.idEstadiaAberta();
    if (idEstadia === null) {
      return;
    }

    const dataSaida = this.dataSaida();
    if (!dataSaida) {
      this.erro.set('Informe a data de saída.');
      return;
    }

    this.finalizando.set(true);
    this.erro.set(null);

    const tempo = calcularTempoEstadia(this.dataEntrada, dataSaida);
    this.estadiaService.encerrar(idEstadia, dataSaida, tempo.valor, tempo.unidade).subscribe({
      next: (atualizada) => {
        this.finalizando.set(false);
        this.idEstadiaAberta.set(null);
        this.finalizado.emit(atualizada);
      },
      error: (error) => {
        this.finalizando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
