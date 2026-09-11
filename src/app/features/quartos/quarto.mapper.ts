import { QuartoDto } from './quarto.dto';
import { Quarto } from './quarto.model';

export function paraModel(dto: QuartoDto): Quarto {
  return { id: dto.id, descricao: dto.descricao, numero: dto.numero, leito: dto.leito, ativo: dto.ativo };
}
