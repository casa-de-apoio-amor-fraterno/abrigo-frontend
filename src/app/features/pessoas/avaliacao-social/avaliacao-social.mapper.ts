import { AvaliacaoSocialDto } from './avaliacao-social.dto';
import { AvaliacaoSocial } from './avaliacao-social.model';

export function paraModel(dto: AvaliacaoSocialDto): AvaliacaoSocial {
  return {
    id: dto.id,
    idPessoa: dto.id_pessoa,
    fumante: dto.fumante,
    residencia: dto.residencia,
    energiaEletrica: dto.energia_eletrica,
    aguaEncanada: dto.agua_encanada,
    tipoConstrucao: dto.tipo_construcao,
    rendaMensalFamiliar: dto.renda_mensal_familiar,
    quantasPessoasContribuemFormacaoRenda: dto.quantas_pessoas_contribuem_formacao_renda,
    alguemRecebeBeneficioPrevidenciarioGoverno: dto.alguem_recebe_beneficio_previdenciario_governo,
    diagnostico: dto.diagnostico,
    tratamentoRealizado: dto.tratamento_realizado,
    casosCancerFamilia: dto.casos_cancer_familia,
    necessitaMedicamentoUsoContinuo: dto.necessita_medicamento_uso_continuo,
    medicamentoDisponibilizadoSus: dto.medicamento_disponibilizado_sus,
    custoMensalMedicamento: dto.custo_mensal_medicamento,
    alimentacaoEspecifica: dto.alimentacao_especifica,
    equipamentoParaLocomocao: dto.equipamento_para_locomocao,
    dataMovimento: dto.data_movimento
  };
}
