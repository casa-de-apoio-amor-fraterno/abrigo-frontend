import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { descreverErroHttp } from '../../../core/http/api-error';
import { ContatoService } from '../../data/contato/contato.service';
import { Contato, ContatoFormulario } from '../../data/contato/contato.model';

/**
 * Lista editável de contatos (telefone), reaproveitada em Pessoa e
 * Voluntário — normalização do campo `telefone` legado (texto livre sem
 * estrutura, ver `abrigo-backend/app/features/pessoas/pessoa.legacy.md`,
 * seção Contatos) numa tabela própria. `recursoBase` é a URL completa do
 * sub-recurso (`/api/pessoas/{id}/contatos` ou
 * `/api/voluntarios/{id}/contatos`) — este componente não sabe nem
 * precisa saber a qual entidade pertence.
 */
@Component({
  selector: 'app-contatos-tab',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './contatos-tab.component.html',
  styleUrl: './contatos-tab.component.scss'
})
export class ContatosTabComponent {
  // input() não-obrigatório de propósito, apesar deste componente sempre
  // precisar de um recursoBase real pra funcionar: usado dentro de
  // *ngTemplateOutlet (pessoa-cadastro/voluntario-cadastro), o mesmo padrão
  // que já causou NG0950 com input.required em avaliacao-social-tab/
  // composicao-familiar-tab — o binding não chega a tempo do check síncrono
  // de input obrigatório nesse cenário de content projection.
  readonly recursoBase = input<string>('');

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ContatoService);

  protected readonly colunas = ['numero', 'nomeContato', 'principal', 'acoes'];

  protected readonly contatos = signal<Contato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly formAberto = signal(false);
  protected readonly contatoEmEdicao = signal<Contato | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    numero: ['', [Validators.required]],
    nomeContato: [''],
    observacao: [''],
    principal: [false]
  });

  constructor() {
    // effect(), não chamada direta no construtor: no cenário de
    // *ngTemplateOutlet em que este componente é usado, o construtor roda
    // antes do Angular aplicar o valor do input (mesma causa do NG0950
    // documentado acima) — ler `recursoBase()` aqui pegaria o valor padrão
    // `''`. O effect roda depois, reativo, já com o valor real.
    effect(() => {
      if (this.recursoBase()) {
        this.carregar();
      }
    });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.recursoBase()).subscribe({
      next: (contatos) => {
        this.contatos.set(contatos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os contatos.');
        this.carregando.set(false);
      }
    });
  }

  protected novoContato(): void {
    this.contatoEmEdicao.set(null);
    this.form.reset({ numero: '', nomeContato: '', observacao: '', principal: false });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected editar(contato: Contato): void {
    this.contatoEmEdicao.set(contato);
    this.form.reset({
      numero: contato.numero,
      nomeContato: contato.nomeContato ?? '',
      observacao: contato.observacao ?? '',
      principal: contato.principal
    });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected cancelar(): void {
    this.formAberto.set(false);
  }

  protected remover(contato: Contato): void {
    if (!confirm(`Remover o contato ${contato.numero}?`)) {
      return;
    }

    this.service.remover(this.recursoBase(), contato.id).subscribe({
      next: () => this.carregar(),
      error: (error) => this.erro.set(descreverErroHttp(error.error))
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dados: ContatoFormulario = {
      numero: valores.numero,
      nomeContato: valores.nomeContato || null,
      observacao: valores.observacao || null,
      principal: valores.principal
    };

    this.salvando.set(true);
    this.erro.set(null);

    const emEdicao = this.contatoEmEdicao();
    const operacao = emEdicao
      ? this.service.atualizar(this.recursoBase(), emEdicao.id, dados)
      : this.service.criar(this.recursoBase(), dados);

    operacao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.carregar();
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
