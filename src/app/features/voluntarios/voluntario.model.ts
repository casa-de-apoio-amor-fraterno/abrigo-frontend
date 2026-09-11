export interface VoluntarioResumo {
  id: number;
  nome: string;
  telefone: string;
  setor: string | null;
}

export interface ListaVoluntarios {
  items: VoluntarioResumo[];
  total: number;
}

export interface Voluntario extends VoluntarioResumo {
  dataNascimento: string | null;
  estadoCivil: string | null;
  cpf: string | null;
  endereco: string | null;
  formacao: string | null;
  observacao: string | null;
  ativo: boolean;
}
