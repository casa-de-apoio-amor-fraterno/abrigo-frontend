import { ContatoEntradaDto } from '../../shared/data/contato/contato.dto';

/** Espelha os schemas de abrigo-backend, app/features/voluntarios/schemas.py. */
export interface VoluntarioResumoDto {
  id: number;
  nome: string;
  telefone_principal: string | null;
  setor: string | null;
}

export interface ListaVoluntariosDto {
  items: VoluntarioResumoDto[];
  total: number;
}

export interface VoluntarioDto {
  id: number;
  nome: string;
  telefone_principal: string | null;
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
  setor?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  formacao?: string | null;
  observacao?: string | null;
  // Contatos aninhados: o voluntário ainda não existe pra usar o
  // sub-recurso próprio (POST /voluntarios/{id}/contatos), ver
  // VoluntarioCreate.contatos em
  // abrigo-backend/app/features/voluntarios/schemas.py.
  contatos?: ContatoEntradaDto[];
}

export type VoluntarioUpdateDto = VoluntarioCreateDto;
