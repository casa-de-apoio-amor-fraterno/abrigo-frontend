import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Popover fixo no canto inferior direito pra uma ação rápida sobre um item
 * de lista (ex.: "Finalizar estadia" na busca global, "Devolver
 * empréstimo") — sem precisar sair da tela/lista pra abrir o cadastro
 * completo. Só a casca (cabeçalho + rodapé Cancelar/Confirmar) é
 * genérica; o conteúdo (o campo em si) é projetado por quem usa.
 */
@Component({
  selector: 'app-acao-popover',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './acao-popover.component.html',
  styleUrl: './acao-popover.component.scss'
})
export class AcaoPopoverComponent {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly erro = input<string | null>(null);
  readonly confirmando = input<boolean>(false);
  readonly textoConfirmar = input<string>('Confirmar');

  readonly cancelar = output<void>();
  readonly confirmar = output<void>();
}
