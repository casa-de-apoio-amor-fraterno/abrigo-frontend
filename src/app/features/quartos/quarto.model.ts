export interface Quarto {
  id: number;
  descricao: string | null;
  numero: string;
  leito: number;
  ativo: boolean;
}

export interface QuartoOcupante {
  idEstadia: number;
  idPessoa: number;
  nomePessoa: string;
  dataEntrada: string;
  /** Leito ocupado por um acompanhante, não pelo titular da estadia (ver
   * EstadiaAcompanhante.ocupaLeito) — usado pra colorir diferente. */
  acompanhante: boolean;
}

/**
 * Ocupação de um quarto (tela Início) — `ocupantes` são só as `leito`
 * estadias "Em acompanhamento" mais recentes; `pendentesRevisao` é o
 * excedente (estadias antigas prováveis de terem sido esquecidas sem
 * finalizar no legado, ver backend `service.listar_ocupacao`).
 */
export interface QuartoOcupacao {
  id: number;
  numero: string;
  descricao: string | null;
  leito: number;
  ocupantes: QuartoOcupante[];
  pendentesRevisao: QuartoOcupante[];
}
