import { ListaPessoasDto, PessoaResumoDto } from './pessoa.dto';
import { ListaPessoas, PessoaResumo } from './pessoa.model';

export function paraModel(dto: PessoaResumoDto): PessoaResumo {
  return {
    id: dto.id,
    nome: dto.nome,
    cpf: dto.cpf,
    telefone: dto.telefone,
    data_nascimento: dto.data_nascimento
  };
}

export function paraListaModel(dto: ListaPessoasDto): ListaPessoas {
  return {
    items: dto.items.map(paraModel),
    total: dto.total
  };
}
