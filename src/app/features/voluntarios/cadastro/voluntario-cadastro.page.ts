import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { ContatoFormulario } from '../../../shared/data/contato/contato.model';
import { VoluntarioService } from '../voluntario.service';
import {
  CadastroDialogAba,
  CadastroDialogShellComponent
} from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';
import { ContatosTabComponent } from '../../../shared/ui/contatos-tab/contatos-tab.component';

@Component({
  selector: 'app-voluntario-cadastro-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ContatosTabComponent,
    CadastroDialogShellComponent,
    CadastroAcoesComponent
  ],
  templateUrl: './voluntario-cadastro.page.html'
})
export class VoluntarioCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly voluntarioService = inject(VoluntarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly voluntarioId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.voluntarioId !== null;

  // Contatos já dá pra adicionar na criação — ver `contatosLocais` e o DTO
  // aninhado em `VoluntarioCreate`
  // (abrigo-backend/app/features/voluntarios/schemas.py).
  protected readonly abas: CadastroDialogAba[] = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'contatos', rotulo: 'Contatos' }
  ];
  protected readonly abaAtiva = signal('dados');

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly inativando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly ativo = signal(true);

  protected readonly contatosLocais = signal<ContatoFormulario[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    setor: [''],
    dataNascimento: [''],
    estadoCivil: [''],
    cpf: [''],
    endereco: [''],
    formacao: [''],
    observacao: ['']
  });

  constructor() {
    if (this.voluntarioId !== null) {
      this.voluntarioService.buscar(this.voluntarioId).subscribe({
        next: (voluntario) => {
          this.form.patchValue({
            nome: voluntario.nome,
            setor: voluntario.setor ?? '',
            dataNascimento: voluntario.dataNascimento ?? '',
            estadoCivil: voluntario.estadoCivil ?? '',
            cpf: voluntario.cpf ?? '',
            endereco: voluntario.endereco ?? '',
            formacao: voluntario.formacao ?? '',
            observacao: voluntario.observacao ?? ''
          });
          this.ativo.set(voluntario.ativo);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do voluntário.');
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

    const valores = this.form.getRawValue();
    const dados = {
      nome: valores.nome,
      setor: valores.setor || null,
      data_nascimento: valores.dataNascimento || null,
      estado_civil: valores.estadoCivil || null,
      cpf: valores.cpf || null,
      endereco: valores.endereco || null,
      formacao: valores.formacao || null,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.voluntarioId !== null
        ? this.voluntarioService.atualizar(this.voluntarioId, dados)
        : this.voluntarioService.criar(dados, this.contatosLocais());

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/voluntarios');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected get contatosUrl(): string | null {
    return this.voluntarioId === null ? null : this.voluntarioService.contatosUrl(this.voluntarioId);
  }

  protected inativar(): void {
    if (this.voluntarioId === null || !confirm('Inativar este voluntário?')) {
      return;
    }

    this.inativando.set(true);
    this.erro.set(null);

    this.voluntarioService.inativar(this.voluntarioId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/voluntarios');
      },
      error: (error) => {
        this.inativando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
