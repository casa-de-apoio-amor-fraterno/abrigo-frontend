import {
  AlertaVencimentoEmprestimoDto,
  EmprestimoContratoDto,
  EmprestimoDto,
  EmprestimoHistoricoDto,
  EmprestimoItemDto,
  EmprestimoResumoDto,
  ListaEmprestimosDto
} from './emprestimo.dto';
import {
  AlertaVencimentoEmprestimo,
  Emprestimo,
  EmprestimoContrato,
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
    numeroContrato: dto.numero_contrato,
    dataDevolucao: dto.data_devolucao
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
    ativo: dto.ativo,
    dataEmprestimo: dto.data_emprestimo,
    dataDevolucaoEfetiva: dto.data_devolucao_efetiva
  };
}

export function paraItemModel(dto: EmprestimoItemDto): EmprestimoItem {
  return {
    id: dto.id,
    idEmprestimo: dto.id_emprestimo,
    idMaterial: dto.id_material,
    situacao: dto.situacao,
    renovacao: dto.renovacao,
    descricaoMaterial: dto.descricao_material,
    temFotoMaterial: dto.tem_foto_material,
    numeroPatrimonioMaterial: dto.numero_patrimonio_material
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

export function paraAlertaVencimentoModel(dto: AlertaVencimentoEmprestimoDto): AlertaVencimentoEmprestimo {
  return {
    idEmprestimo: dto.id_emprestimo,
    idItem: dto.id_item,
    idPessoa: dto.id_pessoa,
    nomePessoa: dto.nome_pessoa,
    telefonePessoa: dto.telefone_pessoa,
    descricaoMaterial: dto.descricao_material,
    numeroPatrimonioMaterial: dto.numero_patrimonio_material,
    dataDevolucao: dto.data_devolucao,
    diasRestantes: dto.dias_restantes
  };
}

export function paraContratoModel(dto: EmprestimoContratoDto): EmprestimoContrato {
  return {
    id: dto.id,
    idEmprestimo: dto.id_emprestimo,
    idUsuario: dto.id_usuario,
    tipo: dto.tipo,
    dataAssinatura: dto.data_assinatura
  };
}
