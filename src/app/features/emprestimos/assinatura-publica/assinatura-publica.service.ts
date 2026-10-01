import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface ResumoAssinaturaPublica {
  nome_pessoa: string;
  numero_contrato: string | null;
  itens: { descricao: string; numero_patrimonio: string | null }[];
  data_inicio: string;
  data_termino: string;
  dias: number;
}

/** Endpoints públicos (sem login) da assinatura remota do contrato — ver
 * abrigo-backend, app/features/emprestimos/router_publico.py. Toda chamada
 * com dados reenvia os 4 últimos dígitos do CPF: o backend não guarda sessão. */
@Injectable({ providedIn: 'root' })
export class AssinaturaPublicaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/assinatura`;

  situacao(token: string): Observable<{ valido: boolean; expira_em: string }> {
    return this.http.get<{ valido: boolean; expira_em: string }>(`${this.resource}/${token}`);
  }

  verificar(token: string, cpfFinal: string): Observable<ResumoAssinaturaPublica> {
    return this.http.post<ResumoAssinaturaPublica>(`${this.resource}/${token}/verificar`, { cpf_final: cpfFinal });
  }

  previa(token: string, cpfFinal: string): Observable<Blob> {
    return this.http.post(`${this.resource}/${token}/previa`, { cpf_final: cpfFinal }, { responseType: 'blob' });
  }

  assinar(token: string, cpfFinal: string, assinaturaPngBase64: string): Observable<{ assinado: boolean }> {
    return this.http.post<{ assinado: boolean }>(`${this.resource}/${token}/assinar`, {
      cpf_final: cpfFinal,
      assinatura_png_base64: assinaturaPngBase64
    });
  }
}
