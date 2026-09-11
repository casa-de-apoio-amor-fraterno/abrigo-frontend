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
  dataDevolucao: string | null;
  situacao: string | null;
  renovacao: string | null;
}
