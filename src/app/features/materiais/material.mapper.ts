import { ListaMateriaisDto, MaterialDto, MaterialResumoDto } from './material.dto';
import { ListaMateriais, Material, MaterialResumo } from './material.model';

export function paraResumoModel(dto: MaterialResumoDto): MaterialResumo {
  return {
    id: dto.id,
    descricao: dto.descricao,
    codigoIdentificacao: dto.codigo_identificacao,
    situacao: dto.situacao,
    disponivelEmprestimo: dto.disponivel_emprestimo
  };
}

export function paraListaModel(dto: ListaMateriaisDto): ListaMateriais {
  return { items: dto.items.map(paraResumoModel), total: dto.total };
}

export function paraModel(dto: MaterialDto): Material {
  return {
    ...paraResumoModel(dto),
    local: dto.local,
    observacao: dto.observacao,
    motivoBaixa: dto.motivo_baixa,
    ativo: dto.ativo
  };
}
