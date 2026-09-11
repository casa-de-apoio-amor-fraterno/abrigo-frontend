import { MunicipioDto } from './municipio.dto';
import { Municipio } from './municipio.model';

export function paraModel(dto: MunicipioDto): Municipio {
  return { id: dto.id, nome: dto.nome, idEstado: dto.id_estado };
}
