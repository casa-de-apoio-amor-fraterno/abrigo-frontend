import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Injetado só pra instanciar o serviço cedo (aplica o tema salvo antes do
  // primeiro paint) — providedIn: 'root' não instancia sozinho sem alguém
  // injetar.
  private readonly theme = inject(ThemeService);
}
