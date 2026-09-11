export interface MaterialResumo {
  id: number;
  descricao: string;
  situacao: string;
  disponivelEmprestimo: boolean;
}

export interface ListaMateriais {
  items: MaterialResumo[];
  total: number;
}

export interface Material extends MaterialResumo {
  codigoIdentificacao: string | null;
  local: string;
  observacao: string | null;
  motivoBaixa: string | null;
  ativo: boolean | null;
}
