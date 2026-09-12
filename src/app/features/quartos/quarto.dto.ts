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
