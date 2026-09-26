/** Espelha `app/features/materiais/schemas.SituacaoMaterial` no backend —
 * lista fechada (era texto livre no legado). "Inutilizado" era "Baixado";
 * "Alocado" é novo: material disponibilizado em algum lugar do Abrigo ou
 * da CAAF (ex.: Bazar), fora de "Casa", mas ainda não emprestado. */
export type SituacaoMaterial = 'Disponível' | 'Alocado' | 'Emprestado' | 'Inutilizado';

export interface MaterialResumo {
  id: number;
  descricao: string;
  numeroPatrimonio: string | null;
  situacao: SituacaoMaterial;
  disponivelEmprestimo: boolean;
  tem_foto: boolean;
}

export interface ListaMateriais {
  items: MaterialResumo[];
  total: number;
}

export interface Material extends MaterialResumo {
  numeroPatrimonio: string | null;
  local: string;
  observacao: string | null;
  motivoBaixa: string | null;
  ativo: boolean | null;
}
