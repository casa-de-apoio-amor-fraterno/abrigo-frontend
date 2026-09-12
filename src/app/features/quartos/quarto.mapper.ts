import { QuartoDto, QuartoOcupacaoDto, QuartoOcupanteDto } from './quarto.dto';
import { Quarto, QuartoOcupacao, QuartoOcupante } from './quarto.model';

export function paraModel(dto: QuartoDto): Quarto {
  return { id: dto.id, descricao: dto.descricao, numero: dto.numero, leito: dto.leito, ativo: dto.ativo };
}

function paraOcupanteModel(dto: QuartoOcupanteDto): QuartoOcupante {
  return {
    idEstadia: dto.id_estadia,
    idPessoa: dto.id_pessoa,
    nomePessoa: dto.nome_pessoa,
    dataEntrada: dto.data_entrada
  };
}

export function paraOcupacaoModel(dto: QuartoOcupacaoDto): QuartoOcupacao {
  return {
    id: dto.id,
    numero: dto.numero,
    descricao: dto.descricao,
    leito: dto.leito,
    ocupantes: dto.ocupantes.map(paraOcupanteModel),
    pendentesRevisao: dto.pendentes_revisao.map(paraOcupanteModel)
  };
}
