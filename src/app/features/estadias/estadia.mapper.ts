import {
  EstadiaAcompanhanteDto,
  EstadiaDto,
  EstadiaResumoDto,
  ListaEstadiasDto
} from './estadia.dto';
import { Estadia, EstadiaAcompanhante, EstadiaResumo, ListaEstadias } from './estadia.model';

export function paraResumoModel(dto: EstadiaResumoDto): EstadiaResumo {
  return {
    id: dto.id,
    idPessoa: dto.id_pessoa,
    idQuarto: dto.id_quarto,
    dataEntrada: dto.data_entrada,
    dataSaida: dto.data_saida,
    situacao: dto.situacao,
    tipoPessoa: dto.tipo_pessoa,
    tempoEstadiaValor: dto.tempo_estadia_valor,
    tempoEstadiaUnidade: dto.tempo_estadia_unidade
  };
}

export function paraListaModel(dto: ListaEstadiasDto): ListaEstadias {
  return { items: dto.items.map(paraResumoModel), total: dto.total };
}

export function paraModel(dto: EstadiaDto): Estadia {
  return {
    ...paraResumoModel(dto),
    idUsuario: dto.id_usuario,
    tempoEstadia: dto.tempo_estadia,
    tempoEstadiaValor: dto.tempo_estadia_valor,
    tempoEstadiaUnidade: dto.tempo_estadia_unidade,
    observacao: dto.observacao,
    ativo: dto.ativo
  };
}

export function paraAcompanhanteModel(dto: EstadiaAcompanhanteDto): EstadiaAcompanhante {
  return {
    id: dto.id,
    idEstadia: dto.id_estadia,
    idPessoa: dto.id_pessoa,
    dataEntrada: dto.data_entrada,
    dataSaida: dto.data_saida,
    grauParentesco: dto.grau_parentesco
  };
}
