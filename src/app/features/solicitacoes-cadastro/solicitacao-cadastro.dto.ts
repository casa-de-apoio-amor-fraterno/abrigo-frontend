/** Espelha os schemas de abrigo-backend, app/features/solicitacoes_cadastro/schemas.py. */
export type SituacaoSolicitacaoCadastroDto = 'Pendente' | 'Aprovada' | 'Revogada';

export interface SolicitacaoCadastroDto {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string;
  situacao: SituacaoSolicitacaoCadastroDto;
  data_solicitacao: string;
  tem_foto: boolean;
  id_pessoa: number | null;
  id_usuario_analise: number | null;
  data_analise: string | null;
}

export interface ListaSolicitacoesCadastroDto {
  items: SolicitacaoCadastroDto[];
  total: number;
}
