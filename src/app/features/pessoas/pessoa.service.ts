import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { paraEntradaDto as paraContatoEntradaDto } from '../../shared/data/contato/contato.mapper';
import { ContatoFormulario } from '../../shared/data/contato/contato.model';
import { ComposicaoFamiliarCreateDto } from './composicao-familiar/composicao-familiar.dto';
import { ListaPessoasDto, PessoaDto } from './pessoa.dto';
import { paraEntradaDto, paraListaModel, paraPessoaModel } from './pessoa.mapper';
import { ListaPessoas, Pessoa, PessoaFormulario } from './pessoa.model';

export interface ConsultaPessoasQuery {
  busca?: string;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/pessoas`;

  listar(query: ConsultaPessoasQuery): Observable<ListaPessoas> {
    const params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      take: String(query.take ?? 20)
    };
    if (query.busca) {
      params['busca'] = query.busca;
    }

    return this.http.get<ListaPessoasDto>(this.resource, { params }).pipe(map(paraListaModel));
  }

  buscar(id: number): Observable<Pessoa> {
    return this.http.get<PessoaDto>(`${this.resource}/${id}`).pipe(map(paraPessoaModel));
  }

  // Composição familiar e contatos são opcionais aqui e só fazem sentido na
  // criação — a pessoa ainda não tem id pra usar os sub-recursos próprios
  // (POST /pessoas/{id}/composicao-familiar, POST /pessoas/{id}/contatos),
  // então o backend aceita ambos aninhados no mesmo payload (ver
  // PessoaCreate em abrigo-backend/app/features/pessoas/schemas.py) e cria
  // tudo numa transação só.
  criar(
    formulario: PessoaFormulario,
    composicaoFamiliar: ComposicaoFamiliarCreateDto[] = [],
    contatos: ContatoFormulario[] = []
  ): Observable<Pessoa> {
    return this.http
      .post<PessoaDto>(this.resource, {
        ...paraEntradaDto(formulario),
        composicao_familiar: composicaoFamiliar,
        contatos: contatos.map(paraContatoEntradaDto)
      })
      .pipe(map(paraPessoaModel));
  }

  atualizar(id: number, formulario: PessoaFormulario): Observable<Pessoa> {
    return this.http
      .put<PessoaDto>(`${this.resource}/${id}`, paraEntradaDto(formulario))
      .pipe(map(paraPessoaModel));
  }

  /** URL direta da imagem (GET /api/pessoas/{id}/foto) — sem endpoint próprio
   * exigindo autenticação, então dá pra usar direto num `<img [src]>`. */
  fotoUrl(id: number): string {
    return `${this.resource}/${id}/foto`;
  }

  salvarFoto(id: number, arquivo: Blob): Observable<Pessoa> {
    const formData = new FormData();
    formData.append('arquivo', arquivo, 'foto.jpg');
    return this.http.put<PessoaDto>(`${this.resource}/${id}/foto`, formData).pipe(map(paraPessoaModel));
  }

  removerFoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}/foto`);
  }

  /** URL do sub-recurso de contatos — ver shared/ui/contatos-tab. */
  contatosUrl(id: number): string {
    return `${this.resource}/${id}/contatos`;
  }
}
