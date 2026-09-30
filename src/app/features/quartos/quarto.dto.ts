/** Espelha QuartoResponse (abrigo-backend, app/features/quartos/schemas.py). */
export interface QuartoDto {
  id: number;
  descricao: string | null;
  numero: string;
  leito: number;
  ativo: boolean;
}

export interface QuartoCreateDto {
  descricao: string | null;
  numero: string;
  leito: number;
}

export type QuartoUpdateDto = QuartoCreateDto;

export interface QuartoOcupanteDto {
  id_estadia: number;
  id_pessoa: number;
  nome_pessoa: string;
  data_entrada: string;
  /** Leito ocupado por um acompanhante (EstadiaAcompanhante.ocupa_leito),
   * não pelo titular da estadia — ver quartos/schemas.py. */
  acompanhante: boolean;
  /** Só quando o leito é de um EstadiaAcompanhante — id desse registro. */
  id_estadia_acompanhante: number | null;
}

/** Espelha QuartoOcupacaoResponse — ver o comentário do schema no backend
 * pra entender por que `ocupantes` não é simplesmente toda estadia não
 * Finalizada (dado sujo do legado infla essa contagem). */
export interface QuartoOcupacaoDto {
  id: number;
  numero: string;
  descricao: string | null;
  leito: number;
  ocupantes: QuartoOcupanteDto[];
  pendentes_revisao: QuartoOcupanteDto[];
}
