import { GrauParentesco } from './grau-parentesco';

export interface ComposicaoFamiliar {
  id: number;
  idPessoa: number;
  nome: string;
  idade: string | null;
  grauParentesco: GrauParentesco;
  estadoCivil: string | null;
  renda: string | null;
  ocupacao: string | null;
}
