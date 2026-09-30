import { Component, computed, inject, output, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { EstadiaService } from '../../../features/estadias/estadia.service';
import { HospitalService } from '../../../features/hospitais/hospital.service';
import { QuartoService } from '../../../features/quartos/quarto.service';
import { Estadia } from '../../../features/estadias/estadia.model';
import { agoraDatetimeLocal, calcularTempoEstadia } from '../../util/data';
import { AcaoDialogComponent, DetalheAcao } from '../acao-dialog/acao-dialog.component';

/**
 * Popup "Finalizar estadia" (data de saída), usado a partir de dois
 * lugares — clicar numa cama ocupada no Início e o botão "Finalizar" nos
 * resultados de estadia da busca global. Antes era duplicado nas duas
 * páginas (a busca nem tinha o campo "Tempo estadia"); agora é um
 * componente único, controlado via `abrir`/`fechar`, sempre ancorado no
 * popup modal (ver AcaoDialogComponent) — por isso uma
 * instância só por página, fora de qualquer `@for`, serve pra qualquer
 * item clicado.
 *
 * Tempo de estadia não é mais digitado aqui — calculado a partir de
 * entrada/saída (ver `calcularTempoEstadia`) só na confirmação, com base
 * na data de saída informada nesse momento.
 *
 * Ao abrir, busca o contexto da estadia (quarto, hospital, acompanhantes
 * ainda presentes) pra mostrar o que será feito antes de confirmar; se
 * alguma busca falhar, o popup continua utilizável sem aquele detalhe.
 */
@Component({
  selector: 'app-finalizar-estadia-dialog',
  imports: [AcaoDialogComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './finalizar-estadia-dialog.component.html'
})
export class FinalizarEstadiaDialogComponent {
  private readonly estadiaService = inject(EstadiaService);
  private readonly quartoService = inject(QuartoService);
  private readonly hospitalService = inject(HospitalService);

  readonly finalizado = output<Estadia>();
  readonly finalizadoAcompanhante = output<void>();

  protected readonly idEstadiaAberta = signal<number | null>(null);
  protected readonly nomePessoa = signal('');
  protected readonly dataSaida = signal('');
  protected readonly finalizando = signal(false);
  protected readonly erro = signal<string | null>(null);

  private dataEntrada = '';
  // Preenchido quando o leito é de um acompanhante (EstadiaAcompanhante) —
  // aí só a saída dele é registrada, sem finalizar a estadia do paciente.
  private idAcompanhante: number | null = null;
  protected readonly ehAcompanhante = signal(false);

  private readonly tipoPessoa = signal<string | null>(null);
  private readonly quarto = signal<string | null>(null);
  private readonly hospital = signal<string | null>(null);
  private readonly acompanhantesPresentes = signal<number | null>(null);
  private readonly dataEntradaSinal = signal('');

  protected readonly descricao = computed(() => {
    const nome = this.nomePessoa() || 'a pessoa';
    if (this.ehAcompanhante()) {
      return `Será registrada somente a saída de ${nome}, na data informada. A estadia do paciente continua em acompanhamento e o leito ocupado por este acompanhante será liberado.`;
    }
    const presentes = this.acompanhantesPresentes() ?? 0;
    const extra =
      presentes > 0
        ? ` ${presentes} acompanhante(s) ainda presente(s) será(ão) encerrado(s) junto, com a mesma data de saída.`
        : '';
    return `A estadia de ${nome} será finalizada na data de saída informada, o tempo de estadia será calculado e o leito ficará livre.${extra}`;
  });

  protected readonly detalhes = computed<DetalheAcao[]>(() => {
    const linhas: DetalheAcao[] = [{ rotulo: 'Pessoa', valor: this.nomePessoa() || '—' }];
    linhas.push({
      rotulo: 'Tipo',
      valor: this.ehAcompanhante() ? 'Acompanhante (leito no quarto do paciente)' : (this.tipoPessoa() ?? '—')
    });
    linhas.push({ rotulo: 'Quarto', valor: this.quarto() ?? '—' });
    if (!this.ehAcompanhante()) {
      linhas.push({ rotulo: 'Hospital', valor: this.hospital() ?? '—' });
    }
    linhas.push({ rotulo: 'Entrada', valor: formatarDataHora(this.dataEntradaSinal()) });
    const saida = this.dataSaida();
    if (saida && this.dataEntradaSinal()) {
      const tempo = calcularTempoEstadia(this.dataEntradaSinal(), saida);
      linhas.push({ rotulo: 'Permanência até a saída informada', valor: `${tempo.valor} ${tempo.unidade}` });
    }
    return linhas;
  });

  readonly aberta = this.idEstadiaAberta.asReadonly();

  abrir(idEstadia: number, dataEntrada: string, nomePessoa = '', idAcompanhante: number | null = null): void {
    this.erro.set(null);
    this.idAcompanhante = idAcompanhante;
    this.ehAcompanhante.set(idAcompanhante !== null);
    this.nomePessoa.set(nomePessoa);
    this.dataEntrada = dataEntrada;
    this.dataEntradaSinal.set(dataEntrada);
    this.dataSaida.set(agoraDatetimeLocal());
    this.tipoPessoa.set(null);
    this.quarto.set(null);
    this.hospital.set(null);
    this.acompanhantesPresentes.set(null);
    this.idEstadiaAberta.set(idEstadia);
    this.carregarContexto(idEstadia);
  }

  private carregarContexto(idEstadia: number): void {
    this.estadiaService
      .buscar(idEstadia)
      .pipe(catchError(() => of(null)))
      .subscribe((estadia) => {
        if (!estadia || this.idEstadiaAberta() !== idEstadia) {
          return;
        }
        this.tipoPessoa.set(estadia.tipoPessoa);
        forkJoin({
          quarto: this.quartoService.buscar(estadia.idQuarto).pipe(catchError(() => of(null))),
          hospital:
            estadia.idHospital !== null
              ? this.hospitalService.buscar(estadia.idHospital).pipe(catchError(() => of(null)))
              : of(null),
          acompanhantes: this.estadiaService.listarAcompanhantes(idEstadia).pipe(catchError(() => of(null)))
        }).subscribe(({ quarto, hospital, acompanhantes }) => {
          if (this.idEstadiaAberta() !== idEstadia) {
            return;
          }
          this.quarto.set(quarto ? `Quarto ${quarto.numero}` : null);
          this.hospital.set(hospital?.nome ?? null);
          this.acompanhantesPresentes.set(acompanhantes ? acompanhantes.filter((a) => !a.dataSaida).length : null);
        });
      });
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

    if (this.idAcompanhante !== null) {
      this.estadiaService.encerrarAcompanhante(idEstadia, this.idAcompanhante, dataSaida).subscribe({
        next: () => {
          this.finalizando.set(false);
          this.idEstadiaAberta.set(null);
          this.finalizadoAcompanhante.emit();
        },
        error: (error) => {
          this.finalizando.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
      return;
    }

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

function formatarDataHora(valor: string): string {
  if (!valor) {
    return '—';
  }
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
