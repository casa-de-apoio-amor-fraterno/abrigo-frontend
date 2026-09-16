/**
 * Situação de empréstimo/item: combo fechado no legado — só 3 estados
 * reais. `situacao` do cabeçalho (`Emprestimo`) não é digitada pelo
 * usuário: é calculada pelo backend a partir dos itens (prioridade
 * Renovado > Pendente > Devolvido) — o front só exibe.
 */
export type SituacaoEmprestimo = 'Pendente' | 'Renovado' | 'Devolvido';

export interface EmprestimoResumo {
  id: number;
  idPessoa: number;
  situacao: SituacaoEmprestimo;
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
  situacao: SituacaoEmprestimo | null;
  renovacao: string | null;
  /** Anexados pelo backend a partir do material — ver EmprestimoItemDto. */
  descricaoMaterial: string;
  temFotoMaterial: boolean;
}

export interface EmprestimoHistorico {
  id: number;
  idEmprestimo: number;
  idUsuario: number;
  tipo: string;
  observacao: string;
  dataCadastro: string;
}

/** Termo de responsabilidade assinado por toque/caneta — um por empréstimo
 * (`EmprestimoContrato.id_emprestimo` é `unique` no backend). O PDF em si
 * não vem nesse recurso, só os metadados; ver `EmprestimoService.obterPdfContrato`. */
export interface EmprestimoContrato {
  id: number;
  idEmprestimo: number;
  idUsuario: number;
  dataAssinatura: string;
}
