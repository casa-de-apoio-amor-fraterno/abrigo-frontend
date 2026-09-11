import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PessoaService } from '../../../features/pessoas/pessoa.service';
import { PessoaResumo } from '../../../features/pessoas/pessoa.model';

/** Campo de busca de Pessoa por nome/CPF, reutilizado onde o legado usa um
 * `TcxDBLookupComboBox` de pessoa (Estadia, EstadiaAcompanhante — e no
 * futuro o picker de Material em Empréstimo). Só emite `selecionada` com um
 * id real quando o usuário escolhe uma opção da lista. */
@Component({
  selector: 'app-pessoa-autocomplete',
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './pessoa-autocomplete.component.html',
  styleUrl: './pessoa-autocomplete.component.scss'
})
export class PessoaAutocompleteComponent {
  readonly label = input('Pessoa');
  readonly valorInicial = input<{ id: number; nome: string } | null>(null);
  readonly selecionada = output<{ id: number; nome: string } | null>();

  private readonly pessoaService = inject(PessoaService);

  protected readonly termo = new FormControl('', { nonNullable: true });
  protected readonly opcoes = signal<PessoaResumo[]>([]);

  constructor() {
    this.termo.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => {
          // Ao escolher uma opção, o MatAutocomplete grava o objeto
          // PessoaResumo bruto no FormControl (via ControlValueAccessor)
          // antes de disparar (optionSelected) — filtra esse caso aqui.
          const busca = typeof texto === 'string' ? texto.trim() : '';
          if (busca.length < 2) {
            return [[] as PessoaResumo[]];
          }
          return this.pessoaService.listar({ busca, take: 10 }).pipe(
            switchMap((resultado) => [resultado.items])
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((itens) => this.opcoes.set(itens));

    effect(() => {
      const inicial = this.valorInicial();
      this.termo.setValue(inicial?.nome ?? '', { emitEvent: false });
    });
  }

  protected selecionar(evento: MatAutocompleteSelectedEvent): void {
    const pessoa = evento.option.value as PessoaResumo;
    this.termo.setValue(pessoa.nome, { emitEvent: false });
    this.selecionada.emit({ id: pessoa.id, nome: pessoa.nome });
  }
}
