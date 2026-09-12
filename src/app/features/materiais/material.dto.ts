/** Espelha os schemas de abrigo-backend, app/features/materiais/schemas.py. */
export interface MaterialResumoDto {
  id: number;
  descricao: string;
  codigo_identificacao: string | null;
  situacao: string;
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
  codigo_identificacao: string | null;
  disponivel_emprestimo: boolean;
  situacao: string;
  local: string;
  observacao: string | null;
  motivo_baixa: string | null;
  ativo: boolean | null;
  tem_foto: boolean;
}

export interface MaterialCreateDto {
  descricao: string;
  codigo_identificacao?: string | null;
  disponivel_emprestimo?: boolean;
  situacao: string;
  local: string;
  observacao?: string | null;
  motivo_baixa?: string | null;
}

export type MaterialUpdateDto = MaterialCreateDto;
