import { HospitalDto } from './hospital.dto';
import { Hospital } from './hospital.model';

export function paraModel(dto: HospitalDto): Hospital {
  return { id: dto.id, nome: dto.nome, ativo: dto.ativo };
}
