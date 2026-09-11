import { ContatoDto, ContatoEntradaDto } from './contato.dto';
import { Contato, ContatoFormulario } from './contato.model';

export function paraModel(dto: ContatoDto): Contato {
  return {
    id: dto.id,
    numero: dto.numero,
    nomeContato: dto.nome_contato,
    observacao: dto.observacao,
    principal: dto.principal
  };
}

export function paraEntradaDto(formulario: ContatoFormulario): ContatoEntradaDto {
  return {
    numero: formulario.numero,
    nome_contato: formulario.nomeContato,
    observacao: formulario.observacao,
    principal: formulario.principal
  };
}
