export type TipoPessoaEstadia = 'Paciente' | 'Acompanhante';
export type SituacaoEstadia = 'Em acompanhamento' | 'Aguardando retorno' | 'Finalizada';
export type UnidadeTempoEstadia = 'dias' | 'noites' | 'horas';

export interface EstadiaResumo {
  id: number;
  idPessoa: number;
  idQuarto: number;
  dataEntrada: string;
  dataSaida: string | null;
  situacao: SituacaoEstadia;
  tipoPessoa: TipoPessoaEstadia;
  tempoEstadiaValor: number | null;
  tempoEstadiaUnidade: UnidadeTempoEstadia | null;
}

export interface ListaEstadias {
  items: EstadiaResumo[];
  total: number;
}

export interface Estadia extends EstadiaResumo {
  idUsuario: number;
  /** Hospital deste atendimento específico — movido de `Pessoa.id_hospital`
   * (contextual à estadia, não permanente da pessoa; ver estadia.legacy.md). */
  idHospital: number | null;
  /** @deprecated Legado, somente leitura. Ver `tempoEstadiaValor`/`tempoEstadiaUnidade`. */
  tempoEstadia: string | null;
  tempoEstadiaValor: number | null;
  tempoEstadiaUnidade: UnidadeTempoEstadia | null;
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
