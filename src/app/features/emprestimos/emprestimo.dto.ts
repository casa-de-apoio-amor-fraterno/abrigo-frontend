/** Espelha os schemas de abrigo-backend, app/features/emprestimos/schemas.py. */

/**
 * Situação de empréstimo/item: combo fechado no legado — só 3 estados
 * reais. `Emprestimo.situacao` (cabeçalho) não é digitada pelo usuário:
 * é calculada pelo backend a partir dos itens (prioridade Renovado >
 * Pendente > Devolvido, ver `_recalcular_situacao` em
 * abrigo-backend/app/features/emprestimos/service.py) — por isso não
 * aparece em `EmprestimoCreateDto`/`EmprestimoUpdateDto`, só nas
 * respostas.
 */
export type SituacaoEmprestimo = 'Pendente' | 'Renovado' | 'Devolvido';

export interface EmprestimoResumoDto {
  id: number;
  id_pessoa: number;
  situacao: SituacaoEmprestimo;
  numero_contrato: string | null;
}

export interface ListaEmprestimosDto {
  items: EmprestimoResumoDto[];
  total: number;
}

export interface EmprestimoDto {
  id: number;
  id_pessoa: number;
  id_usuario: number;
  situacao: SituacaoEmprestimo;
  numero_contrato: string | null;
  observacao: string | null;
  ativo: boolean;
}

export interface EmprestimoCreateDto {
  id_pessoa: number;
  id_usuario: number;
  numero_contrato?: string | null;
  observacao?: string | null;
  // Itens aninhados: o empréstimo ainda não existe pra usar o sub-recurso
  // próprio (POST /emprestimos/{id}/itens), então o front manda os itens
  // junto na criação (ver EmprestimoCreate.itens em
  // abrigo-backend/app/features/emprestimos/schemas.py).
  itens?: EmprestimoItemCreateDto[];
}

export type EmprestimoUpdateDto = EmprestimoCreateDto;

export interface EmprestimoItemDto {
  id: number;
  id_emprestimo: number;
  id_material: number;
  data_emprestimo: string | null;
  /** Prevista, não a data real da devolução — ver `data_devolucao_efetiva`. */
  data_devolucao: string | null;
  /** Gravada automaticamente pelo backend quando `situacao` vira "Devolvido". */
  data_devolucao_efetiva: string | null;
  situacao: SituacaoEmprestimo | null;
  renovacao: string | null;
}

export interface EmprestimoItemCreateDto {
  id_material: number;
  // Quem registrou a inclusão/edição — só usado pelo backend pra gravar
  // `EmprestimoHistorico`, não é persistido no item em si.
  id_usuario: number;
  data_emprestimo?: string | null;
  data_devolucao?: string | null;
  situacao?: SituacaoEmprestimo | null;
  renovacao?: string | null;
}

export type EmprestimoItemUpdateDto = EmprestimoItemCreateDto;

export interface EmprestimoHistoricoDto {
  id: number;
  id_emprestimo: number;
  id_usuario: number;
  tipo: string;
  observacao: string;
  data_cadastro: string;
}
