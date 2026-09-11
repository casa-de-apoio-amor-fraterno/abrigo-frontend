import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MaterialService } from '../../../features/materiais/material.service';
import { MaterialResumo } from '../../../features/materiais/material.model';

/** Campo de busca de Material por descrição — espelha "Consulta Rápida de
 * Material" do legado (`untFrmConsultaRapidaMaterial`), usado no picker de
 * item de Empréstimo. Só lista materiais disponíveis para empréstimo. */
@Component({
  selector: 'app-material-autocomplete',
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './material-autocomplete.component.html',
  styleUrl: './material-autocomplete.component.scss'
})
export class MaterialAutocompleteComponent {
  readonly label = input('Material');
  readonly valorInicial = input<{ id: number; descricao: string } | null>(null);
  readonly selecionado = output<{ id: number; descricao: string } | null>();

  private readonly materialService = inject(MaterialService);

  protected readonly termo = new FormControl('', { nonNullable: true });
  protected readonly opcoes = signal<MaterialResumo[]>([]);

  constructor() {
    this.termo.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => {
          // Mesma cautela de PessoaAutocompleteComponent: o MatAutocomplete
          // grava o objeto bruto no FormControl antes de (optionSelected).
          const busca = typeof texto === 'string' ? texto.trim() : '';
          if (busca.length < 2) {
            return [[] as MaterialResumo[]];
          }
          return this.materialService
            .listar({ busca, apenasDisponiveisEmprestimo: true, take: 10 })
            .pipe(switchMap((resultado) => [resultado.items]));
        }),
        takeUntilDestroyed()
      )
      .subscribe((itens) => this.opcoes.set(itens));

    effect(() => {
      const inicial = this.valorInicial();
      this.termo.setValue(inicial?.descricao ?? '', { emitEvent: false });
    });
  }

  protected selecionar(evento: MatAutocompleteSelectedEvent): void {
    const material = evento.option.value as MaterialResumo;
    this.termo.setValue(material.descricao, { emitEvent: false });
    this.selecionado.emit({ id: material.id, descricao: material.descricao });
  }
}
