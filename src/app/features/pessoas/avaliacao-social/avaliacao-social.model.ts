export interface AvaliacaoSocial {
  id: number;
  idPessoa: number;
  fumante: boolean | null;
  residencia: string | null;
  energiaEletrica: boolean | null;
  aguaEncanada: boolean | null;
  tipoConstrucao: string | null;
  rendaMensalFamiliar: string | null;
  quantasPessoasContribuemFormacaoRenda: string | null;
  alguemRecebeBeneficioPrevidenciarioGoverno: string | null;
  diagnostico: string | null;
  tratamentoRealizado: string | null;
  casosCancerFamilia: string | null;
  necessitaMedicamentoUsoContinuo: boolean | null;
  medicamentoDisponibilizadoSus: boolean | null;
  custoMensalMedicamento: string | null;
  alimentacaoEspecifica: string | null;
  equipamentoParaLocomocao: string | null;
  dataMovimento: string | null;
}
