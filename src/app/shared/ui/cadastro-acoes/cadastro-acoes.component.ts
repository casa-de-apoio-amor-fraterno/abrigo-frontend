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

  readonly cancelar = output<void>();
}
