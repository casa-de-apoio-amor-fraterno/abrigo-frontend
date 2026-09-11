export interface ComposicaoFamiliar {
  id: number;
  idPessoa: number;
  nome: string;
  idade: string | null;
  grauParentesco: string;
  estadoCivil: string | null;
  renda: string | null;
  ocupacao: string | null;
}
