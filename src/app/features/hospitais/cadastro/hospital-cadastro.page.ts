import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { HospitalService } from '../hospital.service';
import { CadastroDialogShellComponent } from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';

@Component({
  selector: 'app-hospital-cadastro-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CadastroDialogShellComponent,
    CadastroAcoesComponent
  ],
  templateUrl: './hospital-cadastro.page.html'
})
export class HospitalCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly hospitalService = inject(HospitalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly hospitalId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.hospitalId !== null;

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly inativando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly ativo = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]]
  });

  constructor() {
    if (this.hospitalId !== null) {
      this.hospitalService.buscar(this.hospitalId).subscribe({
        next: (hospital) => {
          this.form.patchValue({ nome: hospital.nome });
          this.ativo.set(hospital.ativo);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do hospital.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = { nome: this.form.getRawValue().nome };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.hospitalId !== null
        ? this.hospitalService.atualizar(this.hospitalId, dados)
        : this.hospitalService.criar(dados);

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/hospitais');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected inativar(): void {
    if (
      this.hospitalId === null ||
      !confirm('Inativar este hospital? Ele deixará de aparecer nas seleções de estadia/pessoa.')
    ) {
      return;
    }

    this.inativando.set(true);
    this.erro.set(null);

    this.hospitalService.inativar(this.hospitalId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/hospitais');
      },
      error: (error) => {
        this.inativando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
