import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Casca comum das telas de Cadastro (cabeçalho com link de voltar,
 * título/subtítulo e estado de carregando). O formulário em si — com seus
 * campos, seções e abas específicos de cada entidade — é projetado pela
 * página que usa este shell.
 */
@Component({
  selector: 'app-pagina-cadastro',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pagina-cadastro.component.html',
  styleUrl: './pagina-cadastro.component.scss'
})
export class PaginaCadastroComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly voltarPara = input.required<string>();
  readonly carregando = input<boolean>(false);
  readonly larguraMaxima = input<number>(860);
}
