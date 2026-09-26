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
  numeroPatrimonioMaterial: string | null;
}

export interface EmprestimoHistorico {
  id: number;
  idEmprestimo: number;
  idUsuario: number;
  tipo: string;
  observacao: string;
  dataCadastro: string;
}

/** Nível de urgência do vencimento — o front decide a partir de
 * `diasRestantes` (ver home.page.ts): "vencido" (dias < 0), "urgente"
 * (0–7 dias) ou "proximo" (8–14 dias, horizonte padrão do backend). */
export type NivelUrgenciaVencimento = 'proximo' | 'urgente' | 'vencido';

export interface AlertaVencimentoEmprestimo {
  idEmprestimo: number;
  idItem: number;
  idPessoa: number;
  nomePessoa: string;
  telefonePessoa: string | null;
  descricaoMaterial: string;
  numeroPatrimonioMaterial: string | null;
  dataDevolucao: string;
  diasRestantes: number;
}

/** "Comodato" é o termo original (assinado uma vez); "Renovação" é um
 * termo aditivo assinado a cada prorrogação de prazo — pode haver vários
 * por empréstimo. */
export type TipoContrato = 'Comodato' | 'Renovação';

/** Termo de responsabilidade assinado por toque/caneta — um empréstimo
 * pode ter vários (um "Comodato" + N "Renovação", ver `tipo`). O PDF em si
 * não vem nesse recurso, só os metadados; ver `EmprestimoService.obterPdfContrato`. */
export interface EmprestimoContrato {
  id: number;
  idEmprestimo: number;
  idUsuario: number;
  tipo: TipoContrato;
  dataAssinatura: string;
}
