/** Espelha os schemas de abrigo-backend, app/features/avaliacao_social/schemas.py. */
export interface AvaliacaoSocialDto {
  id: number;
  id_pessoa: number;
  fumante: boolean | null;
  residencia: string | null;
  energia_eletrica: boolean | null;
  agua_encanada: boolean | null;
  tipo_construcao: string | null;
  renda_mensal_familiar: string | null;
  quantas_pessoas_contribuem_formacao_renda: string | null;
  alguem_recebe_beneficio_previdenciario_governo: string | null;
  diagnostico: string | null;
  tratamento_realizado: string | null;
  casos_cancer_familia: string | null;
  necessita_medicamento_uso_continuo: boolean | null;
  medicamento_disponibilizado_sus: boolean | null;
  custo_mensal_medicamento: string | null;
  alimentacao_especifica: string | null;
  equipamento_para_locomocao: string | null;
  data_movimento: string | null;
}

export type AvaliacaoSocialCreateDto = Omit<AvaliacaoSocialDto, 'id' | 'id_pessoa'>;
export type AvaliacaoSocialUpdateDto = AvaliacaoSocialCreateDto;
