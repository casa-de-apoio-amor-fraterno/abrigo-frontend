/** Espelha PessoaResumoResponse (abrigo-backend, app/features/pessoas/schemas.py). */
export interface PessoaResumoDto {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
}

export interface ListaPessoasDto {
  items: PessoaResumoDto[];
  total: number;
}

/** Espelha PessoaBase/PessoaCreate/PessoaUpdate (mesmo shape de entrada). */
export interface PessoaEntradaDto {
  nome: string;
  data_nascimento: string;
  rg: string | null;
  cpf: string | null;
  profissao: string | null;
  cartao_sus: string | null;
  endereco: string | null;
  ponto_referencia: string | null;
  telefone: string | null;
  id_hospital: number | null;
  id_municipio: number | null;
  id_estado: number | null;
  observacao: string | null;
}

/** Espelha PessoaResponse. */
export interface PessoaDto extends PessoaEntradaDto {
  id: number;
  ativo: boolean;
  data_cadastro: string | null;
}
