import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { PessoaAutocompleteComponent } from '../../../shared/ui/pessoa-autocomplete/pessoa-autocomplete.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { QuartoService } from '../../quartos/quarto.service';
import { Quarto } from '../../quartos/quarto.model';
import { EstadiaAcompanhanteCreateDto } from '../estadia.dto';
import { EstadiaService } from '../estadia.service';
import { EstadiaAcompanhante, SituacaoEstadia, TipoPessoaEstadia } from '../estadia.model';
import {
  CadastroDialogAba,
  CadastroDialogShellComponent
} from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';

@Component({
  selector: 'app-estadia-cadastro-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PessoaAutocompleteComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    CadastroDialogShellComponent,
    CadastroAcoesComponent
  ],
  templateUrl: './estadia-cadastro.page.html'
})
export class EstadiaCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly estadiaService = inject(EstadiaService);
  private readonly pessoaService = inject(PessoaService);
  private readonly quartoService = inject(QuartoService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly estadiaId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.estadiaId !== null;

  // Acompanhantes já dão pra adicionar na criação — ver
  // `acompanhantesLocais` e o DTO aninhado em `EstadiaCreate`
  // (abrigo-backend/app/features/estadias/schemas.py).
  protected readonly abas: CadastroDialogAba[] = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'acompanhantes', rotulo: 'Acompanhantes' }
  ];
  protected readonly abaAtiva = signal('dados');

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly encerrando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly quartos = signal<Quarto[]>([]);
  protected readonly pessoaSelecionada = signal<{ id: number; nome: string } | null>(null);
  protected readonly situacaoAtual = signal<SituacaoEstadia | null>(null);
  protected readonly idUsuarioOriginal = signal<number | null>(null);

  protected readonly acompanhantes = signal<EstadiaAcompanhante[]>([]);
  // Acompanhantes locais (estadia em criação, ainda sem id) — mesmo padrão
  // de `itensLocais` em emprestimo-cadastro.page.ts.
  protected readonly acompanhantesLocais = signal<EstadiaAcompanhante[]>([]);
  protected readonly acompanhantesExibidos = computed(() =>
    this.estadiaId === null ? this.acompanhantesLocais() : this.acompanhantes()
  );
  protected readonly nomesAcompanhantes = signal<Record<number, string>>({});
  protected readonly formAcompanhanteAberto = signal(false);
  protected readonly salvandoAcompanhante = signal(false);
  protected readonly pessoaAcompanhante = signal<{ id: number; nome: string } | null>(null);

  private proximoIdAcompanhanteLocal = -1;

  protected readonly form = this.fb.nonNullable.group({
    idQuarto: this.fb.control<number | null>(null, Validators.required),
    dataEntrada: ['', [Validators.required]],
    dataSaida: [''],
    tipoPessoa: this.fb.nonNullable.control<TipoPessoaEstadia>('Paciente'),
    situacao: this.fb.nonNullable.control<SituacaoEstadia>('Em acompanhamento', Validators.required),
    tempoEstadia: [''],
    observacao: ['']
  });

  protected readonly formAcompanhante = this.fb.nonNullable.group({
    dataEntrada: ['', [Validators.required]],
    dataSaida: [''],
    grauParentesco: ['']
  });

  constructor() {
    this.quartoService.listar(false).subscribe((quartos) => this.quartos.set(quartos));

    if (this.estadiaId !== null) {
      this.estadiaService.buscar(this.estadiaId).subscribe({
        next: (estadia) => {
          this.form.patchValue({
            idQuarto: estadia.idQuarto,
            dataEntrada: estadia.dataEntrada.slice(0, 10),
            dataSaida: estadia.dataSaida?.slice(0, 10) ?? '',
            tipoPessoa: estadia.tipoPessoa,
            situacao: estadia.situacao,
            tempoEstadia: estadia.tempoEstadia ?? '',
            observacao: estadia.observacao ?? ''
          });
          this.situacaoAtual.set(estadia.situacao);
          this.idUsuarioOriginal.set(estadia.idUsuario);
          this.carregando.set(false);

          this.pessoaService.buscar(estadia.idPessoa).subscribe((pessoa) => {
            this.pessoaSelecionada.set({ id: pessoa.id, nome: pessoa.nome });
          });

          this.carregarAcompanhantes();
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados da estadia.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected selecionarPessoa(pessoa: { id: number; nome: string } | null): void {
    this.pessoaSelecionada.set(pessoa);
  }

  protected selecionarPessoaAcompanhante(pessoa: { id: number; nome: string } | null): void {
    this.pessoaAcompanhante.set(pessoa);
  }

  protected salvar(): void {
    if (this.form.invalid || this.pessoaSelecionada() === null) {
      this.form.markAllAsTouched();
      if (this.pessoaSelecionada() === null) {
        this.erro.set('Selecione a pessoa atendida.');
      }
      return;
    }

    const valores = this.form.getRawValue();
    const dados = {
      id_pessoa: this.pessoaSelecionada()!.id,
      id_quarto: valores.idQuarto!,
      id_usuario: this.idUsuarioOriginal() ?? this.auth.sessao()!.usuario_id,
      data_entrada: valores.dataEntrada,
      data_saida: valores.dataSaida || null,
      tempo_estadia: valores.tempoEstadia || null,
      tipo_pessoa: valores.tipoPessoa,
      situacao: valores.situacao,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.estadiaId !== null
        ? this.estadiaService.atualizar(this.estadiaId, dados)
        : this.estadiaService.criar({ ...dados, acompanhantes: this.paraAcompanhantesCreateDto() });

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/estadias');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected encerrar(): void {
    if (this.estadiaId === null || !confirm('Encerrar esta estadia? A situação será marcada como Finalizada.')) {
      return;
    }

    this.encerrando.set(true);
    this.erro.set(null);

    this.estadiaService.encerrar(this.estadiaId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/estadias');
      },
      error: (error) => {
        this.encerrando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected abrirFormAcompanhante(): void {
    this.pessoaAcompanhante.set(null);
    this.formAcompanhante.reset({ dataEntrada: '', dataSaida: '', grauParentesco: '' });
    this.formAcompanhanteAberto.set(true);
  }

  protected cancelarAcompanhante(): void {
    this.formAcompanhanteAberto.set(false);
  }

  protected salvarAcompanhante(): void {
    if (this.formAcompanhante.invalid || this.pessoaAcompanhante() === null) {
      this.formAcompanhante.markAllAsTouched();
      return;
    }

    const pessoa = this.pessoaAcompanhante()!;
    const valores = this.formAcompanhante.getRawValue();

    // Estadia ainda em criação (sem id): junta o acompanhante num array
    // local em vez de chamar a API — mesmo padrão de `itensLocais` em
    // emprestimo-cadastro.page.ts.
    if (this.estadiaId === null) {
      const acompanhante: EstadiaAcompanhante = {
        id: this.proximoIdAcompanhanteLocal--,
        idEstadia: 0,
        idPessoa: pessoa.id,
        dataEntrada: valores.dataEntrada,
        dataSaida: valores.dataSaida || null,
        grauParentesco: valores.grauParentesco || null
      };
      this.acompanhantesLocais.update((atuais) => [...atuais, acompanhante]);
      this.nomesAcompanhantes.update((mapa) => ({ ...mapa, [pessoa.id]: pessoa.nome }));
      this.formAcompanhanteAberto.set(false);
      return;
    }

    this.salvandoAcompanhante.set(true);

    this.estadiaService
      .adicionarAcompanhante(this.estadiaId, {
        id_pessoa: pessoa.id,
        data_entrada: valores.dataEntrada,
        data_saida: valores.dataSaida || null,
        grau_parentesco: valores.grauParentesco || null
      })
      .subscribe({
        next: () => {
          this.salvandoAcompanhante.set(false);
          this.formAcompanhanteAberto.set(false);
          this.carregarAcompanhantes();
        },
        error: (error) => {
          this.salvandoAcompanhante.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
  }

  private paraAcompanhantesCreateDto(): EstadiaAcompanhanteCreateDto[] {
    return this.acompanhantesLocais().map((acompanhante) => ({
      id_pessoa: acompanhante.idPessoa,
      data_entrada: acompanhante.dataEntrada,
      data_saida: acompanhante.dataSaida,
      grau_parentesco: acompanhante.grauParentesco
    }));
  }

  private carregarAcompanhantes(): void {
    if (this.estadiaId === null) {
      return;
    }
    this.estadiaService.listarAcompanhantes(this.estadiaId).subscribe((acompanhantes) => {
      this.acompanhantes.set(acompanhantes);
      const idsFaltantes = [...new Set(acompanhantes.map((a) => a.idPessoa))].filter(
        (id) => this.nomesAcompanhantes()[id] === undefined
      );
      idsFaltantes.forEach((id) => {
        this.pessoaService.buscar(id).subscribe((pessoa) => {
          this.nomesAcompanhantes.update((mapa) => ({ ...mapa, [pessoa.id]: pessoa.nome }));
        });
      });
    });
  }
}
