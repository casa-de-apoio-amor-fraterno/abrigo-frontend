import { ListaSolicitacoesCadastroDto, SolicitacaoCadastroDto } from './solicitacao-cadastro.dto';
import { ListaSolicitacoesCadastro, SolicitacaoCadastro } from './solicitacao-cadastro.model';

export function paraModel(dto: SolicitacaoCadastroDto): SolicitacaoCadastro {
  return {
    id: dto.id,
    nome: dto.nome,
    cpf: dto.cpf,
    telefone: dto.telefone,
    dataNascimento: dto.data_nascimento,
    situacao: dto.situacao,
    dataSolicitacao: dto.data_solicitacao,
    temFoto: dto.tem_foto,
    idPessoa: dto.id_pessoa,
    idUsuarioAnalise: dto.id_usuario_analise,
    dataAnalise: dto.data_analise
  };
}

export function paraListaModel(dto: ListaSolicitacoesCadastroDto): ListaSolicitacoesCadastro {
  return { items: dto.items.map(paraModel), total: dto.total };
}
