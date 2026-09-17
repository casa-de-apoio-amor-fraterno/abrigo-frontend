import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { RELATORIOS_DISPONIVEIS } from './relatorio.service';

@Component({
  selector: 'app-relatorios-dashboard-page',
  imports: [RouterLink, MatIconModule],
  templateUrl: './relatorios-dashboard.page.html',
  styleUrl: './relatorios-dashboard.page.scss'
})
export class RelatoriosDashboardPage {
  protected readonly relatorios = RELATORIOS_DISPONIVEIS;
}
