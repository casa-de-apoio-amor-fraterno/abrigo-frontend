/** Espelha os schemas de abrigo-backend, app/features/estadias/schemas.py. */
export type TipoPessoaEstadiaDto = 'Paciente' | 'Acompanhante';
export type SituacaoEstadiaDto = 'Em acompanhamento' | 'Aguardando retorno' | 'Finalizada';
export type UnidadeTempoEstadiaDto = 'dias' | 'noites' | 'horas';

export interface EstadiaResumoDto {
  id: number;
  id_pessoa: number;
  id_quarto: number;
  data_entrada: string;
  data_saida: string | null;
  situacao: SituacaoEstadiaDto;
  tipo_pessoa: TipoPessoaEstadiaDto;
  tempo_estadia_valor: number | null;
  tempo_estadia_unidade: UnidadeTempoEstadiaDto | null;
}

export interface ListaEstadiasDto {
  items: EstadiaResumoDto[];
  total: number;
}

export interface EstadiaDto extends EstadiaResumoDto {
  id_usuario: number;
  /** @deprecated Legado, somente leitura. Ver `tempo_estadia_valor`/`tempo_estadia_unidade`. */
  tempo_estadia: string | null;
  tempo_estadia_valor: number | null;
  tempo_estadia_unidade: UnidadeTempoEstadiaDto | null;
  observacao: string | null;
  ativo: boolean | null;
}

export interface EstadiaCreateDto {
  id_pessoa: number;
  id_quarto: number;
  id_usuario: number;
  data_entrada: string;
  data_saida?: string | null;
  tempo_estadia_valor?: number | null;
  tempo_estadia_unidade?: UnidadeTempoEstadiaDto | null;
  tipo_pessoa?: TipoPessoaEstadiaDto;
  situacao: SituacaoEstadiaDto;
  observacao?: string | null;
  // Acompanhantes aninhados: a estadia ainda não existe pra usar o
  // sub-recurso próprio (POST /estadias/{id}/acompanhantes), ver
  // EstadiaCreate.acompanhantes em
  // abrigo-backend/app/features/estadias/schemas.py.
  acompanhantes?: EstadiaAcompanhanteCreateDto[];
}

export type EstadiaUpdateDto = EstadiaCreateDto;

export interface EstadiaAcompanhanteDto {
  id: number;
  id_estadia: number;
  id_pessoa: number;
  data_entrada: string;
  data_saida: string | null;
  grau_parentesco: string | null;
}

export interface EstadiaAcompanhanteCreateDto {
  id_pessoa: number;
  data_entrada: string;
  data_saida?: string | null;
  grau_parentesco?: string | null;
}
