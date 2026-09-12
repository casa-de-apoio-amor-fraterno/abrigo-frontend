export interface EmprestimoResumo {
  id: number;
  idPessoa: number;
  situacao: string;
  numeroContrato: string | null;
}

export interface ListaEmprestimos {
  items: EmprestimoResumo[];
  total: number;
}

export interface Emprestimo extends EmprestimoResumo {
  idUsuario: number;
  observacao: string | null;
  ativo: boolean;
}

export interface EmprestimoItem {
  id: number;
  idEmprestimo: number;
  idMaterial: number;
  dataEmprestimo: string | null;
  /** Prevista, não a data real da devolução — ver `dataDevolucaoEfetiva`. */
  dataDevolucao: string | null;
  /** Gravada automaticamente pelo backend quando `situacao` vira "Devolvido". */
  dataDevolucaoEfetiva: string | null;
  situacao: string | null;
  renovacao: string | null;
}

export interface EmprestimoHistorico {
  id: number;
  idEmprestimo: number;
  idUsuario: number;
  tipo: string;
  observacao: string;
  dataCadastro: string;
}
