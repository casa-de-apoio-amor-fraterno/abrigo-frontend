/** Espelha os schemas de abrigo-backend, app/features/composicao_familiar/schemas.py. */
export interface ComposicaoFamiliarDto {
  id: number;
  id_pessoa: number;
  nome: string;
  idade: string | null;
  grau_parentesco: string;
  estado_civil: string | null;
  renda: string | null;
  ocupacao: string | null;
}

export type ComposicaoFamiliarCreateDto = Omit<ComposicaoFamiliarDto, 'id' | 'id_pessoa'>;
export type ComposicaoFamiliarUpdateDto = ComposicaoFamiliarCreateDto;
