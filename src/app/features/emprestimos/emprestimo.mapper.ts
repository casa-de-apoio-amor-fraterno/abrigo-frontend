import {
  EmprestimoDto,
  EmprestimoHistoricoDto,
  EmprestimoItemDto,
  EmprestimoResumoDto,
  ListaEmprestimosDto
} from './emprestimo.dto';
import {
  Emprestimo,
  EmprestimoHistorico,
  EmprestimoItem,
  EmprestimoResumo,
  ListaEmprestimos
} from './emprestimo.model';

export function paraResumoModel(dto: EmprestimoResumoDto): EmprestimoResumo {
  return {
    id: dto.id,
    idPessoa: dto.id_pessoa,
    situacao: dto.situacao,
    numeroContrato: dto.numero_contrato
  };
}

export function paraListaModel(dto: ListaEmprestimosDto): ListaEmprestimos {
  return { items: dto.items.map(paraResumoModel), total: dto.total };
}

export function paraModel(dto: EmprestimoDto): Emprestimo {
  return {
    ...paraResumoModel(dto),
    idUsuario: dto.id_usuario,
    observacao: dto.observacao,
    ativo: dto.ativo
  };
}

export function paraItemModel(dto: EmprestimoItemDto): EmprestimoItem {
  return {
    id: dto.id,
    idEmprestimo: dto.id_emprestimo,
    idMaterial: dto.id_material,
    dataEmprestimo: dto.data_emprestimo,
    dataDevolucao: dto.data_devolucao,
    dataDevolucaoEfetiva: dto.data_devolucao_efetiva,
    situacao: dto.situacao,
    renovacao: dto.renovacao
  };
}

export function paraHistoricoModel(dto: EmprestimoHistoricoDto): EmprestimoHistorico {
  return {
    id: dto.id,
    idEmprestimo: dto.id_emprestimo,
    idUsuario: dto.id_usuario,
    tipo: dto.tipo,
    observacao: dto.observacao,
    dataCadastro: dto.data_cadastro
  };
}
