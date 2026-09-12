import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Rodapé padrão de formulário de Cadastro: um slot [extra] à esquerda pra
 * ação perigosa específica da entidade (Inativar, Encerrar estadia — o
 * botão em si fica na página, só a posição/espaçamento são compartilhados),
 * Cancelar (navega de volta via `voltarPara`, ou emite `cancelar` quando o
 * formulário é um sub-registro que só fecha in-place) e Salvar.
 */
@Component({
  selector: 'app-cadastro-acoes',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './cadastro-acoes.component.html'
})
export class CadastroAcoesComponent {
  readonly voltarPara = input<string | null>(null);
  readonly salvando = input<boolean>(false);
  readonly textoSalvar = input<string>('Salvar');
  readonly textoCancelar = input<string>('Cancelar');
  // Só precisa quando este componente é projetado fora do <form> que ele
  // deveria submeter (ex.: no popup de cadastro, o rodapé fica ao lado do
  // conteúdo rolável, não dentro do <form> — que também não pode envolver
  // tudo porque sub-recursos como Contatos têm o próprio <form> aninhado).
  // Usa o atributo HTML `form`, que associa um botão a um <form> pelo id
  // mesmo estando fora dele.
  readonly formularioId = input<string | null>(null);

  readonly cancelar = output<void>();
}
