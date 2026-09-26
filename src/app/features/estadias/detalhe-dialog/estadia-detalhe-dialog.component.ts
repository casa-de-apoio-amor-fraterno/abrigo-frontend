import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HospitalService } from '../../hospitais/hospital.service';
import { PessoaService } from '../../pessoas/pessoa.service';
import { QuartoService } from '../../quartos/quarto.service';
import { Quarto } from '../../quartos/quarto.model';
import { Estadia, EstadiaAcompanhante, EstadiaHistorico } from '../estadia.model';
import { EstadiaService } from '../estadia.service';

export interface EstadiaDetalheDialogData {
  estadiaId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de estadias). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

interface AcompanhanteExibicao extends EstadiaAcompanhante {
  nomePessoa: string;
}

/** Popup de consulta rápida de uma estadia — pessoa, quarto, hospital do
 * atendimento, tempo de estadia e observação, com a situação em destaque
 * como pill, além dos acompanhantes e do histórico de eventos (Inclusão/
 * Alteração/Encerramento). Antes usava o `DetalheDialogComponent` genérico
 * só com tipo/quarto/entrada/saída/situação (ver
 * docs/planning-detalhe-dialogs.md); esse aqui busca os dados completos em
 * vez de depender só do que a listagem já tinha em mãos. */
@Component({
  selector: 'app-estadia-detalhe-dialog',
  imports: [DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './estadia-detalhe-dialog.component.html',
  styleUrl: './estadia-detalhe-dialog.component.scss'
})
export class EstadiaDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<EstadiaDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<EstadiaDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly estadiaService = inject(EstadiaService);
  private readonly pessoaService = inject(PessoaService);
  private readonly quartoService = inject(QuartoService);
  private readonly hospitalService = inject(HospitalService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly estadia = signal<Estadia | null>(null);
  protected readonly quarto = signal<Quarto | null>(null);
  protected readonly acompanhantes = signal<AcompanhanteExibicao[]>([]);
  protected readonly historico = signal<EstadiaHistorico[]>([]);
  protected readonly nomePessoa = signal<string | null>(null);
  protected readonly nomeHospital = signal<string | null>(null);

  constructor() {
    forkJoin({
      estadia: this.estadiaService.buscar(this.data.estadiaId),
      acompanhantes: this.estadiaService.listarAcompanhantes(this.data.estadiaId),
      historico: this.estadiaService.listarHistorico(this.data.estadiaId)
    }).subscribe({
      next: ({ estadia, acompanhantes, historico }) => {
        this.estadia.set(estadia);
        this.historico.set(historico);
        this.carregando.set(false);

        this.quartoService.buscar(estadia.idQuarto).subscribe({
          next: (quarto) => this.quarto.set(quarto),
          error: () => undefined
        });
        this.pessoaService.buscar(estadia.idPessoa).subscribe({
          next: (pessoa) => this.nomePessoa.set(pessoa.nome),
          error: () => undefined
        });
        if (estadia.idHospital !== null) {
          this.hospitalService.buscar(estadia.idHospital).subscribe({
            next: (hospital) => this.nomeHospital.set(hospital.nome),
            error: () => undefined
          });
        }

        if (acompanhantes.length === 0) {
          this.acompanhantes.set([]);
          return;
        }
        forkJoin(
          acompanhantes.map((acompanhante) =>
            this.pessoaService.buscar(acompanhante.idPessoa).pipe(catchError(() => of(null)))
          )
        ).subscribe((pessoas) => {
          this.acompanhantes.set(
            acompanhantes.map((acompanhante, indice) => ({
              ...acompanhante,
              nomePessoa: pessoas[indice]?.nome ?? `Pessoa #${acompanhante.idPessoa}`
            }))
          );
        });
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados da estadia.');
        this.carregando.set(false);
      }
    });
  }

  protected quartoLabel(quarto: Quarto): string {
    return `${quarto.numero}${quarto.descricao ? ' — ' + quarto.descricao : ''}`;
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
