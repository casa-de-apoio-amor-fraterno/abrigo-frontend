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
  /** Leito ocupado por alguém no papel de acompanhante — seja o titular
   * de uma estadia com tipo_pessoa Acompanhante (tem leito próprio), seja
   * um EstadiaAcompanhante.ocupaLeito (acompanha a estadia de um paciente
   * e também ocupa leito). Usado pra colorir diferente. */
  acompanhante: boolean;
  /** Preenchido só quando o leito é de um EstadiaAcompanhante (não titular) —
   * finalizar registra a saída só dele, não da estadia do paciente. */
  idEstadiaAcompanhante: number | null;
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
