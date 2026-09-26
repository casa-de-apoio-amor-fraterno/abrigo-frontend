import { Component, computed, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface CadastroDialogAba {
  id: string;
  rotulo: string;
}

/**
 * Casca comum dos formulários de Cadastro quando abertos em popup (ver
 * shared/ui/cadastro-dialog-host — o componente que abre esse popup a
 * partir da rota). Cabeçalho com título e botão de fechar, pills opcionais
 * pra formulários grandes demais pra uma seção só (autoradas pela própria
 * página via `abas`/`abaAtiva`) e um botão "Próximo" que anda pelas pills.
 * O rodapé (Cancelar/Salvar) continua sendo autorado por cada página via
 * app-cadastro-acoes, projetado no slot [acoes].
 */
@Component({
  selector: 'app-cadastro-dialog-shell',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cadastro-dialog-shell.component.html',
  styleUrl: './cadastro-dialog-shell.component.scss'
})
export class CadastroDialogShellComponent {
  protected readonly dialogRef = inject(MatDialogRef<unknown>);

  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly carregando = input<boolean>(false);
  readonly abas = input<CadastroDialogAba[]>([]);
  readonly abaAtiva = model<string>('');

  protected readonly mostrarPills = computed(() => this.abas().length > 1);

  protected selecionarAba(id: string): void {
    this.abaAtiva.set(id);
  }
}
