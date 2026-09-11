/** Espelha QuartoResponse (abrigo-backend, app/features/quartos/schemas.py). */
export interface QuartoDto {
  id: number;
  descricao: string | null;
  numero: string;
  leito: string;
  ativo: boolean;
}

export interface QuartoCreateDto {
  descricao: string | null;
  numero: string;
  leito: string;
}

export type QuartoUpdateDto = QuartoCreateDto;
