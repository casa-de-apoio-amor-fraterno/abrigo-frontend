import { MaterialLocalDto } from './material-local.dto';
import { MaterialLocal } from './material-local.model';

export function paraModel(dto: MaterialLocalDto): MaterialLocal {
  return { id: dto.id, nome: dto.nome, ativo: dto.ativo };
}
