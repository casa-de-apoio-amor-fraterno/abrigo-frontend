import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ContratoDemoRequest {
  nomePessoa: string;
  textoContrato: string;
  assinaturaPngBase64: string;
}

/** Serviço do protótipo "assinar contrato no tablet" — ver app/features/
 * contrato_demo/router.py no backend. Substituir quando os contratos de
 * verdade (estadia/empréstimo) forem implementados. */
@Injectable({ providedIn: 'root' })
export class ContratoDemoService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/contrato-demo`;

  gerarPdf(dados: ContratoDemoRequest): Observable<Blob> {
    return this.http.post(
      `${this.resource}/gerar-pdf`,
      {
        nome_pessoa: dados.nomePessoa,
        texto_contrato: dados.textoContrato,
        assinatura_png_base64: dados.assinaturaPngBase64
      },
      { responseType: 'blob' }
    );
  }
}
