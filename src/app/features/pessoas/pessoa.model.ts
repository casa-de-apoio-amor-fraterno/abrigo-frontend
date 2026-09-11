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

export interface PessoaFormulario {
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

export interface Pessoa extends PessoaFormulario {
  id: number;
  ativo: boolean;
  data_cadastro: string | null;
}
