export type TipoPessoaEstadia = 'Paciente' | 'Acompanhante';
export type SituacaoEstadia = 'Em acompanhamento' | 'Aguardando retorno' | 'Finalizada';

export interface EstadiaResumo {
  id: number;
  idPessoa: number;
  idQuarto: number;
  dataEntrada: string;
  dataSaida: string | null;
  situacao: SituacaoEstadia;
  tipoPessoa: TipoPessoaEstadia;
}

export interface ListaEstadias {
  items: EstadiaResumo[];
  total: number;
}

export interface Estadia extends EstadiaResumo {
  idUsuario: number;
  tempoEstadia: string | null;
  observacao: string | null;
  ativo: boolean | null;
}

export interface EstadiaAcompanhante {
  id: number;
  idEstadia: number;
  idPessoa: number;
  dataEntrada: string;
  dataSaida: string | null;
  grauParentesco: string | null;
}
