import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <div class="placeholder">
      <span class="placeholder__emoji" aria-hidden="true">🚧</span>
      <h2>{{ titulo() }}</h2>
      <p>Esta rotina ainda está em desenvolvimento.</p>
    </div>
  `,
  styles: `
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 64px 24px;
      color: rgba(0, 0, 0, 0.6);
    }

    .placeholder__emoji {
      font-size: 40px;
      margin-bottom: 12px;
    }

    h2 {
      margin: 0 0 8px;
      color: var(--abrigo-ink);
    }
  `
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly titulo = toSignal(
    this.route.data.pipe(map((data) => (data['titulo'] as string) ?? 'Em construção')),
    { initialValue: 'Em construção' }
  );
}
