import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../auth/auth.service';
import { NAV_ITEMS, NAV_ITEMS_MOBILE_PRINCIPAIS } from '../../navigation/nav-items';

@Component({
  selector: 'app-shell-page',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule
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

  protected sair(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
