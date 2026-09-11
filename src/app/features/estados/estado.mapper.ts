import { EstadoDto } from './estado.dto';
import { Estado } from './estado.model';

export function paraModel(dto: EstadoDto): Estado {
  return { id: dto.id, nome: dto.nome, uf: dto.uf };
}
