import { ComposicaoFamiliarDto } from './composicao-familiar.dto';
import { ComposicaoFamiliar } from './composicao-familiar.model';

export function paraModel(dto: ComposicaoFamiliarDto): ComposicaoFamiliar {
  return {
    id: dto.id,
    idPessoa: dto.id_pessoa,
    nome: dto.nome,
    idade: dto.idade,
    grauParentesco: dto.grau_parentesco,
    estadoCivil: dto.estado_civil,
    renda: dto.renda,
    ocupacao: dto.ocupacao
  };
}
