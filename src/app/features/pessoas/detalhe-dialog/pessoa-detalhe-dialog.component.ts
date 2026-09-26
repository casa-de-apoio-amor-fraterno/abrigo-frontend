import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EstadoService } from '../../estados/estado.service';
import { HospitalService } from '../../hospitais/hospital.service';
import { MunicipioService } from '../../municipios/municipio.service';
import { mascararCpf } from '../../../shared/util/cpf';
import { Pessoa } from '../pessoa.model';
import { PessoaService } from '../pessoa.service';

export interface PessoaDetalheDialogData {
  pessoaId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de pessoas). Ignorado quando `aoEditar`
   * é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota — mesmo padrão de
   * `EmprestimoDetalheDialogComponent`/`DetalheDialogData`. */
  aoEditar?: () => void;
}

/** Popup de consulta rápida de uma pessoa — profissão, cartão SUS,
 * endereço, ponto de referência, hospital vinculado, naturalidade
 * (município/estado), observação e data de cadastro, além do que já
 * existia (CPF, telefone, nascimento, foto), com o status em destaque como
 * pill. Antes usava o `DetalheDialogComponent` genérico (ver
 * docs/planning-detalhe-dialogs.md); esse aqui busca a pessoa completa em
 * vez de depender só do que a listagem já tinha em mãos. Avaliação Social e
 * Composição Familiar ficam de fora — já são abas próprias da edição, um
 * resumo aqui só duplicaria informação sem ganho real. */
@Component({
  selector: 'app-pessoa-detalhe-dialog',
  imports: [DatePipe, RouterLink, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pessoa-detalhe-dialog.component.html',
  styleUrl: './pessoa-detalhe-dialog.component.scss'
})
export class PessoaDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<PessoaDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<PessoaDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly pessoaService = inject(PessoaService);
  private readonly hospitalService = inject(HospitalService);
  private readonly municipioService = inject(MunicipioService);
  private readonly estadoService = inject(EstadoService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly pessoa = signal<Pessoa | null>(null);
  protected readonly fotoUrl = signal<string | null>(null);
  protected readonly nomeHospital = signal<string | null>(null);
  protected readonly naturalidade = signal<string | null>(null);

  constructor() {
    this.pessoaService.buscar(this.data.pessoaId).subscribe({
      next: (pessoa) => {
        this.pessoa.set(pessoa);
        this.carregando.set(false);

        if (pessoa.tem_foto) {
          this.pessoaService.buscarFoto(pessoa.id).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              this.fotoUrl.set(url);
              this.dialogRef.afterClosed().subscribe(() => URL.revokeObjectURL(url));
            },
            error: () => undefined
          });
        }
        if (pessoa.id_hospital !== null) {
          this.hospitalService.buscar(pessoa.id_hospital).subscribe({
            next: (hospital) => this.nomeHospital.set(hospital.nome),
            error: () => undefined
          });
        }
        if (pessoa.id_municipio !== null) {
          forkJoin({
            municipios: this.municipioService.listar({}),
            estados: this.estadoService.listar()
          }).subscribe({
            next: ({ municipios, estados }) => {
              const municipio = municipios.find((m) => m.id === pessoa.id_municipio);
              const estado = estados.find((e) => e.id === (pessoa.id_estado ?? municipio?.idEstado));
              if (municipio) {
                this.naturalidade.set(estado ? `${municipio.nome} / ${estado.uf}` : municipio.nome);
              }
            },
            error: () => undefined
          });
        }
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados da pessoa.');
        this.carregando.set(false);
      }
    });
  }

  protected cpfMascarado(cpf: string): string {
    return mascararCpf(cpf);
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }
}
