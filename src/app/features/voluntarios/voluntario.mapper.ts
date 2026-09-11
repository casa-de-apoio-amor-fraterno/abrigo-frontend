import { ListaVoluntariosDto, VoluntarioDto, VoluntarioResumoDto } from './voluntario.dto';
import { ListaVoluntarios, Voluntario, VoluntarioResumo } from './voluntario.model';

export function paraResumoModel(dto: VoluntarioResumoDto): VoluntarioResumo {
  return { id: dto.id, nome: dto.nome, telefonePrincipal: dto.telefone_principal, setor: dto.setor };
}

export function paraListaModel(dto: ListaVoluntariosDto): ListaVoluntarios {
  return { items: dto.items.map(paraResumoModel), total: dto.total };
}

export function paraModel(dto: VoluntarioDto): Voluntario {
  return {
    ...paraResumoModel(dto),
    dataNascimento: dto.data_nascimento,
    estadoCivil: dto.estado_civil,
    cpf: dto.cpf,
    endereco: dto.endereco,
    formacao: dto.formacao,
    observacao: dto.observacao,
    ativo: dto.ativo
  };
}
