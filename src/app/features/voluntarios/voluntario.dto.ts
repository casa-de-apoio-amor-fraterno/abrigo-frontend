/** Espelha os schemas de abrigo-backend, app/features/voluntarios/schemas.py. */
export interface VoluntarioResumoDto {
  id: number;
  nome: string;
  telefone: string;
  setor: string | null;
}

export interface ListaVoluntariosDto {
  items: VoluntarioResumoDto[];
  total: number;
}

export interface VoluntarioDto {
  id: number;
  nome: string;
  telefone: string;
  setor: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  cpf: string | null;
  endereco: string | null;
  formacao: string | null;
  observacao: string | null;
  ativo: boolean;
}

export interface VoluntarioCreateDto {
  nome: string;
  telefone: string;
  setor?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  formacao?: string | null;
  observacao?: string | null;
}

export type VoluntarioUpdateDto = VoluntarioCreateDto;
