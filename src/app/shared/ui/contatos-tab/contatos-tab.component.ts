import { Component, effect, inject, signal, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ContatoService } from '../../data/contato/contato.service';
import { Contato, ContatoFormulario } from '../../data/contato/contato.model';
import { ContatoFormDialogComponent } from './contato-form-dialog.component';

/**
 * Lista de contatos (telefone), reaproveitada em Pessoa e Voluntário —
 * normalização do campo `telefone` legado (texto livre sem estrutura, ver
 * `abrigo-backend/app/features/pessoas/pessoa.legacy.md`, seção Contatos).
 * `recursoBase` é a URL completa do sub-recurso
 * (`/api/pessoas/{id}/contatos` ou `/api/voluntarios/{id}/contatos`) —
 * este componente não sabe nem precisa saber a qual entidade pertence.
 * Novo/editar/remover contato abrem em popup próprio (ver
 * contato-form-dialog.component.ts) — antes era um formulário inline que
 * trocava de lugar com a lista dentro do mesmo popup de cadastro.
 */
@Component({
  selector: 'app-contatos-tab',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
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

  // Modo local (dono ainda não existe — ex.: pessoa em criação): sem
  // recursoBase, então em vez de chamar a API a cada contato, junta tudo
  // num array local e avisa o formulário-pai via `contatosLocaisChange` pra
  // mandar tudo junto no POST de criação (mesmo padrão de
  // `ComposicaoFamiliarTabComponent`/`membrosLocaisChange`). Continua
  // opt-in (não inferido de `!recursoBase()`) porque Voluntário reaproveita
  // este componente sem suporte a contatos aninhados no backend ainda.
  readonly modoLocal = input<boolean>(false);
  readonly contatosLocaisChange = output<ContatoFormulario[]>();

  private readonly service = inject(ContatoService);
  private readonly dialog = inject(MatDialog);

  protected readonly contatos = signal<Contato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  private proximoIdLocal = -1;

  constructor() {
    // effect(), não chamada direta no construtor: no cenário de
    // *ngTemplateOutlet em que este componente é usado, o construtor roda
    // antes do Angular aplicar o valor do input (mesma causa do NG0950
    // documentado acima) — ler `recursoBase()`/`modoLocal()` aqui pegaria o
    // valor padrão. O effect roda depois, reativo, já com o valor real.
    effect(() => {
      if (this.modoLocal()) {
        this.carregando.set(false);
      } else if (this.recursoBase()) {
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
    this.abrirFormulario(null);
  }

  protected editar(contato: Contato): void {
    this.abrirFormulario(contato);
  }

  private abrirFormulario(contato: Contato | null): void {
    this.dialog
      .open(ContatoFormDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        autoFocus: false,
        data: { recursoBase: this.recursoBase(), contato, modoLocal: this.modoLocal() }
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (!resultado) {
          return;
        }

        if (resultado.tipo === 'persistido') {
          this.carregar();
          return;
        }

        if (resultado.tipo === 'local-salvar') {
          const local: Contato = { id: contato?.id ?? this.proximoIdLocal--, ...resultado.dados };
          this.contatos.update((atuais) =>
            contato ? atuais.map((c) => (c.id === local.id ? local : c)) : [...atuais, local]
          );
        } else if (resultado.tipo === 'local-remover' && contato) {
          this.contatos.update((atuais) => atuais.filter((c) => c.id !== contato.id));
        }

        this.emitirContatosLocais();
      });
  }

  private emitirContatosLocais(): void {
    this.contatosLocaisChange.emit(
      this.contatos().map((c) => ({
        numero: c.numero,
        nomeContato: c.nomeContato,
        observacao: c.observacao,
        principal: c.principal
      }))
    );
  }
}
