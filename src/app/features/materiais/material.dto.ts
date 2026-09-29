import { SituacaoMaterial } from './material.model';

/** Espelha os schemas de abrigo-backend, app/features/materiais/schemas.py. */
export interface MaterialResumoDto {
  id: number;
  descricao: string;
  numero_patrimonio: string | null;
  situacao: SituacaoMaterial;
  disponivel_emprestimo: boolean;
  tem_foto: boolean;
}

export interface ListaMateriaisDto {
  items: MaterialResumoDto[];
  total: number;
}

export interface MaterialDto {
  id: number;
  descricao: string;
  numero_patrimonio: string | null;
  disponivel_emprestimo: boolean;
  situacao: SituacaoMaterial;
  id_local: number;
  observacao: string | null;
  motivo_baixa: string | null;
  ativo: boolean | null;
  tem_foto: boolean;
}

export interface MaterialCreateDto {
  descricao: string;
  numero_patrimonio?: string | null;
  disponivel_emprestimo?: boolean;
  situacao: SituacaoMaterial;
  id_local: number;
  observacao?: string | null;
  motivo_baixa?: string | null;
}

export type MaterialUpdateDto = MaterialCreateDto;

export interface MaterialAlocarDto {
  id_local: number;
}
