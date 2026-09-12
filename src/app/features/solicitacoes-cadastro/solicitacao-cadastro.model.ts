/**
 * Situação de uma solicitação de auto-cadastro (feature nova, sem
 * equivalente no legado) — pendente até um usuário do sistema aprovar
 * (vira `Pessoa`) ou revogar (descartada).
 */
export type SituacaoSolicitacaoCadastro = 'Pendente' | 'Aprovada' | 'Revogada';

export interface SolicitacaoCadastro {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string;
  situacao: SituacaoSolicitacaoCadastro;
  dataSolicitacao: string;
  temFoto: boolean;
  idPessoa: number | null;
  idUsuarioAnalise: number | null;
  dataAnalise: string | null;
}

export interface ListaSolicitacoesCadastro {
  items: SolicitacaoCadastro[];
  total: number;
}
