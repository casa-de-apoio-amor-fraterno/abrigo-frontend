import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * As telas de cadastro abrem num MatDialog (ver CadastroDialogHostBase) por
 * cima da tela de consulta, mas são componentes de rota independentes — a
 * consulta não sabe quando o dialog fecha. Esse serviço avisa a consulta
 * (por listaUrl) pra recarregar a lista, senão o registro criado/editado só
 * aparece depois de um F5.
 */
@Injectable({ providedIn: 'root' })
export class ListaRefreshService {
  private readonly eventos = new Subject<string>();
  readonly eventos$ = this.eventos.asObservable();

  notificar(listaUrl: string): void {
    this.eventos.next(listaUrl);
  }
}

/**
 * Chame no constructor da página de consulta (contexto de injeção ativo)
 * pra recarregar a lista sempre que um dialog de cadastro dessa mesma
 * listaUrl fechar.
 */
export function escutarRefrescoDaLista(listaUrl: string, callback: () => void): void {
  inject(ListaRefreshService)
    .eventos$.pipe(
      filter((url) => url === listaUrl),
      takeUntilDestroyed()
    )
    .subscribe(callback);
}
