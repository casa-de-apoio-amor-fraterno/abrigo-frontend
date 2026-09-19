import { Component, inject, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { EstadiaService } from '../../../features/estadias/estadia.service';
import { Estadia, UnidadeTempoEstadia } from '../../../features/estadias/estadia.model';
import { agoraDatetimeLocal } from '../../util/data';
import { AcaoPopoverComponent } from '../acao-popover/acao-popover.component';
import { FiltroPillsComponent, OpcaoFiltroPill } from '../filtro-pills/filtro-pills.component';

const OPCOES_UNIDADE_TEMPO: OpcaoFiltroPill[] = [
  { valor: 'dias', rotulo: 'Dias' },
  { valor: 'noites', rotulo: 'Noites' },
  { valor: 'horas', rotulo: 'Horas' }
];

/** Pré-calcula um palpite de valor+unidade pro tempo de estadia (ver
 * `abrir`/`recalcularTempo`), não uma medição exata:
 * - Entrada e saída no mesmo dia (ficou menos de 24h) → assume "horas",
 *   contadas a partir do horário real de entrada (`dataEntradaIso` inclui
 *   hora) até agora — não dá pra saber o horário de saída real só com a
 *   data escolhida no campo, então usa o momento em que está finalizando.
 * - Datas diferentes → "dias" (diferença de dias corridos entre as
 *   datas, mínimo 1 — mesmo padrão do dado real observado no legado,
 *   onde estadias curtas quase sempre foram registradas como "1 dia").
 */
function calcularTempoEstadia(
  dataEntradaIso: string,
  dataSaidaIso: string
): { valor: number; unidade: UnidadeTempoEstadia } {
  const mesmoDia = dataEntradaIso.slice(0, 10) === dataSaidaIso.slice(0, 10);
  if (mesmoDia) {
    const entrada = new Date(dataEntradaIso);
    const diffHoras = Math.round((Date.now() - entrada.getTime()) / 3_600_000);
    return { valor: Math.max(diffHoras, 1), unidade: 'horas' };
  }

  const entrada = new Date(`${dataEntradaIso.slice(0, 10)}T00:00:00`);
  const saida = new Date(`${dataSaidaIso.slice(0, 10)}T00:00:00`);
  const diffDias = Math.round((saida.getTime() - entrada.getTime()) / 86_400_000);
  return { valor: Math.max(diffDias, 1), unidade: 'dias' };
}

/**
 * Popover "Finalizar estadia" (data de saída + tempo de estadia), usado a
 * partir de dois lugares — clicar numa cama ocupada no Início e o botão
 * "Finalizar" nos resultados de estadia da busca global. Antes era
 * duplicado nas duas páginas (a busca nem tinha o campo "Tempo estadia");
 * agora é um componente único, controlado via `abrir`/`fechar`, sempre
 * ancorado no canto inferior direito (ver AcaoPopoverComponent) — por isso
 * uma instância só por página, fora de qualquer `@for`, serve pra
 * qualquer item clicado.
 */
@Component({
  selector: 'app-finalizar-estadia-popover',
  imports: [AcaoPopoverComponent, FiltroPillsComponent, MatFormFieldModule, MatInputModule],
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

  // Editável, mas pré-preenchido a partir de data_entrada/data_saida (ver
  // calcularTempoEstadia) — se o usuário mexer no valor ou na unidade,
  // `editadoManualmente` trava o recálculo automático ao trocar a data.
  protected readonly tempoValor = signal<number | null>(null);
  protected readonly tempoUnidade = signal<UnidadeTempoEstadia>('dias');
  protected readonly opcoesUnidadeTempo = OPCOES_UNIDADE_TEMPO;
  private dataEntrada = '';
  private editadoManualmente = false;

  readonly aberta = this.idEstadiaAberta.asReadonly();

  abrir(idEstadia: number, dataEntrada: string, nomePessoa = ''): void {
    this.erro.set(null);
    this.nomePessoa.set(nomePessoa);
    this.dataEntrada = dataEntrada;
    this.editadoManualmente = false;
    this.dataSaida.set(agoraDatetimeLocal());
    this.recalcularTempo();
    this.idEstadiaAberta.set(idEstadia);
  }

  fechar(): void {
    this.idEstadiaAberta.set(null);
    this.erro.set(null);
  }

  protected alterarDataSaida(valor: string): void {
    this.dataSaida.set(valor);
    this.recalcularTempo();
  }

  protected alterarTempoValor(valor: number | null): void {
    this.editadoManualmente = true;
    this.tempoValor.set(valor);
  }

  protected alterarTempoUnidade(unidade: UnidadeTempoEstadia): void {
    this.editadoManualmente = true;
    this.tempoUnidade.set(unidade);
  }

  // Mostra a unidade escolhida na pill como sufixo dentro do próprio campo
  // numérico (ex.: "4 Noites"), em vez de só a pill isolada embaixo.
  protected rotuloUnidadeTempo(unidade: UnidadeTempoEstadia): string {
    return OPCOES_UNIDADE_TEMPO.find((opcao) => opcao.valor === unidade)?.rotulo ?? '';
  }

  private recalcularTempo(): void {
    if (this.editadoManualmente) {
      return;
    }
    const dataSaida = this.dataSaida();
    if (!dataSaida || !this.dataEntrada) {
      return;
    }
    const { valor, unidade } = calcularTempoEstadia(this.dataEntrada, dataSaida);
    this.tempoValor.set(valor);
    this.tempoUnidade.set(unidade);
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

    const tempoValor = this.tempoValor();
    this.estadiaService
      .encerrar(idEstadia, dataSaida, tempoValor ?? undefined, tempoValor !== null ? this.tempoUnidade() : undefined)
      .subscribe({
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
