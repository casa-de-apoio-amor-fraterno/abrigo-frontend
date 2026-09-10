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
