/** Espelha os schemas de abrigo-backend, app/features/emprestimos/schemas.py. */
export interface EmprestimoResumoDto {
  id: number;
  id_pessoa: number;
  situacao: string;
  numero_contrato: string | null;
}

export interface ListaEmprestimosDto {
  items: EmprestimoResumoDto[];
  total: number;
}

export interface EmprestimoDto {
  id: number;
  id_pessoa: number;
  id_usuario: number;
  situacao: string;
  numero_contrato: string | null;
  observacao: string | null;
  ativo: boolean;
}

export interface EmprestimoCreateDto {
  id_pessoa: number;
  id_usuario: number;
  situacao: string;
  numero_contrato?: string | null;
  observacao?: string | null;
}

export type EmprestimoUpdateDto = EmprestimoCreateDto;

export interface EmprestimoItemDto {
  id: number;
  id_emprestimo: number;
  id_material: number;
  data_emprestimo: string | null;
  data_devolucao: string | null;
  situacao: string | null;
  renovacao: string | null;
}

export interface EmprestimoItemCreateDto {
  id_material: number;
  data_emprestimo?: string | null;
  data_devolucao?: string | null;
  situacao?: string | null;
  renovacao?: string | null;
}

export type EmprestimoItemUpdateDto = EmprestimoItemCreateDto;
