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

/** "Comodato" é o termo original (assinado uma vez); "Renovação" é um
 * termo aditivo assinado a cada prorrogação de prazo — pode haver vários
 * por empréstimo. Ver EmprestimoContrato no backend. */
export type TipoContrato = 'Comodato' | 'Renovação';

export interface EmprestimoItemResumoDto {
  situacao: SituacaoEmprestimo | null;
  descricao_material: string;
  numero_patrimonio_material: string | null;
}

export interface EmprestimoResumoDto {
  id: number;
  id_pessoa: number;
  situacao: SituacaoEmprestimo;
  numero_contrato: string | null;
  data_devolucao: string | null;
  itens?: EmprestimoItemResumoDto[];
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
  // Prazo do aluguel — nível empréstimo, não item (ver models.Emprestimo no
  // backend): um único prazo vale pra todos os itens do mesmo empréstimo.
  data_emprestimo: string | null;
  /** Prevista, não a data real da devolução — ver `data_devolucao_efetiva`. */
  data_devolucao: string | null;
  /** Gravada automaticamente pelo backend quando `situacao` vira "Devolvido". */
  data_devolucao_efetiva: string | null;
}

export interface EmprestimoCreateDto {
  id_pessoa: number;
  id_usuario: number;
  numero_contrato?: string | null;
  observacao?: string | null;
  data_emprestimo?: string | null;
  data_devolucao?: string | null;
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
  situacao: SituacaoEmprestimo | null;
  renovacao: string | null;
  /** Anexados pelo backend a partir de `Material` — não são colunas de
   * `emprestimo_item` (ver EmprestimoItemResponse em
   * abrigo-backend/app/features/emprestimos/schemas.py). */
  descricao_material: string;
  tem_foto_material: boolean;
  numero_patrimonio_material: string | null;
}

export interface EmprestimoRenovarDto {
  id_usuario: number;
  dias: number;
  /** Itens devolvidos na própria renovação; os demais não devolvidos são renovados. */
  ids_itens_devolver?: number[];
}

export interface EmprestimoItemCreateDto {
  id_material: number;
  // Quem registrou a inclusão/edição — só usado pelo backend pra gravar
  // `EmprestimoHistorico`, não é persistido no item em si.
  id_usuario: number;
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

/** Espelha AlertaVencimentoEmprestimo (abrigo-backend,
 * app/features/emprestimos/schemas.py) — item ainda não devolvido com a
 * devolução prevista perto ou já passada, usado no painel da tela Início. */
export interface AlertaVencimentoEmprestimoDto {
  id_emprestimo: number;
  id_item: number;
  id_pessoa: number;
  nome_pessoa: string;
  telefone_pessoa: string | null;
  descricao_material: string;
  numero_patrimonio_material: string | null;
  data_devolucao: string;
  dias_restantes: number;
}

export interface EmprestimoContratoDto {
  id: number;
  id_emprestimo: number;
  id_usuario: number;
  tipo: TipoContrato;
  data_assinatura: string;
}
