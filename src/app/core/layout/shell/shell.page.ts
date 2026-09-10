import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';

import { AuthService } from '../../auth/auth.service';
import { NAV_ITEMS, NAV_ITEMS_MOBILE_PRINCIPAIS } from '../../navigation/nav-items';

@Component({
  selector: 'app-shell-page',
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule
  ],
  templateUrl: './shell.page.html',
  styleUrl: './shell.page.scss'
})
export class ShellPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;
  protected readonly navItensPrincipais = NAV_ITEMS.slice(0, NAV_ITEMS_MOBILE_PRINCIPAIS);
  protected readonly navItensSecundarios = NAV_ITEMS.slice(NAV_ITEMS_MOBILE_PRINCIPAIS);
  protected readonly sessao = this.auth.sessao;

  protected readonly termoBusca = signal('');

  protected buscar(): void {
    const termo = this.termoBusca().trim();
    if (!termo) {
      return;
    }
    void this.router.navigate(['/busca'], { queryParams: { q: termo } });
  }

  protected sair(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
