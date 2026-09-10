export interface PessoaResumo {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
}

export interface ListaPessoas {
  items: PessoaResumo[];
  total: number;
}
