import { ListaPessoasDto, PessoaDto, PessoaEntradaDto, PessoaResumoDto } from './pessoa.dto';
import { ListaPessoas, Pessoa, PessoaFormulario, PessoaResumo } from './pessoa.model';

export function paraModel(dto: PessoaResumoDto): PessoaResumo {
  return {
    id: dto.id,
    nome: dto.nome,
    cpf: dto.cpf,
    telefone: dto.telefone,
    data_nascimento: dto.data_nascimento,
    tem_foto: dto.tem_foto
  };
}

export function paraListaModel(dto: ListaPessoasDto): ListaPessoas {
  return {
    items: dto.items.map(paraModel),
    total: dto.total
  };
}

export function paraPessoaModel(dto: PessoaDto): Pessoa {
  return {
    id: dto.id,
    nome: dto.nome,
    data_nascimento: dto.data_nascimento,
    rg: dto.rg,
    cpf: dto.cpf,
    profissao: dto.profissao,
    cartao_sus: dto.cartao_sus,
    endereco: dto.endereco,
    ponto_referencia: dto.ponto_referencia,
    telefone: dto.telefone,
    id_hospital: dto.id_hospital,
    id_municipio: dto.id_municipio,
    id_estado: dto.id_estado,
    observacao: dto.observacao,
    ativo: dto.ativo,
    data_cadastro: dto.data_cadastro,
    tem_foto: dto.tem_foto
  };
}

export function paraEntradaDto(formulario: PessoaFormulario): PessoaEntradaDto {
  return {
    nome: formulario.nome,
    data_nascimento: formulario.data_nascimento,
    rg: formulario.rg,
    cpf: formulario.cpf,
    profissao: formulario.profissao,
    cartao_sus: formulario.cartao_sus,
    endereco: formulario.endereco,
    ponto_referencia: formulario.ponto_referencia,
    telefone: formulario.telefone,
    id_hospital: formulario.id_hospital,
    id_municipio: formulario.id_municipio,
    id_estado: formulario.id_estado,
    observacao: formulario.observacao
  };
}
