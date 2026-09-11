import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { descreverErroHttp } from '../../../core/http/api-error';
import { AvaliacaoSocialCreateDto } from './avaliacao-social.dto';
import { AvaliacaoSocial } from './avaliacao-social.model';
import { AvaliacaoSocialService } from './avaliacao-social.service';

/**
 * Aba "Avaliação Social" da tela de Pessoa. Espelha
 * `untFrmManutencaoAvaliacaoSocial` do legado: cada avaliação é um registro
 * histórico (sem exclusão, só criação/edição) — o backend não expõe DELETE
 * pra essa rotina, ver `avaliacao_social/router.py`.
 */
@Component({
  selector: 'app-avaliacao-social-tab',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule
  ],
  templateUrl: './avaliacao-social-tab.component.html',
  styleUrl: './avaliacao-social-tab.component.scss'
})
export class AvaliacaoSocialTabComponent {
  readonly pessoaId = input<number>(0);

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AvaliacaoSocialService);

  protected readonly avaliacoes = signal<AvaliacaoSocial[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly formAberto = signal(false);
  protected readonly avaliacaoEmEdicao = signal<AvaliacaoSocial | null>(null);

  protected readonly opcoesResidencia = ['Própria', 'Alugada', 'Cedida', 'Outros'];
  protected readonly opcoesTipoConstrucao = ['Madeira', 'Alvenaria', 'Outros'];

  protected readonly form = this.fb.nonNullable.group({
    fumante: this.fb.control<boolean | null>(null),
    residencia: [''],
    energiaEletrica: this.fb.control<boolean | null>(null),
    aguaEncanada: this.fb.control<boolean | null>(null),
    tipoConstrucao: [''],
    rendaMensalFamiliar: [''],
    quantasPessoasContribuemFormacaoRenda: [''],
    alguemRecebeBeneficioPrevidenciarioGoverno: [''],
    diagnostico: [''],
    tratamentoRealizado: [''],
    casosCancerFamilia: [''],
    necessitaMedicamentoUsoContinuo: this.fb.control<boolean | null>(null),
    medicamentoDisponibilizadoSus: this.fb.control<boolean | null>(null),
    custoMensalMedicamento: [''],
    alimentacaoEspecifica: [''],
    equipamentoParaLocomocao: [''],
    dataMovimento: ['']
  });

  constructor() {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.pessoaId()).subscribe({
      next: (avaliacoes) => {
        this.avaliacoes.set(avaliacoes);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as avaliações sociais.');
        this.carregando.set(false);
      }
    });
  }

  protected novaAvaliacao(): void {
    this.avaliacaoEmEdicao.set(null);
    this.form.reset({
      fumante: null,
      residencia: '',
      energiaEletrica: null,
      aguaEncanada: null,
      tipoConstrucao: '',
      rendaMensalFamiliar: '',
      quantasPessoasContribuemFormacaoRenda: '',
      alguemRecebeBeneficioPrevidenciarioGoverno: '',
      diagnostico: '',
      tratamentoRealizado: '',
      casosCancerFamilia: '',
      necessitaMedicamentoUsoContinuo: null,
      medicamentoDisponibilizadoSus: null,
      custoMensalMedicamento: '',
      alimentacaoEspecifica: '',
      equipamentoParaLocomocao: '',
      dataMovimento: ''
    });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected editar(avaliacao: AvaliacaoSocial): void {
    this.avaliacaoEmEdicao.set(avaliacao);
    this.form.reset({
      fumante: avaliacao.fumante,
      residencia: avaliacao.residencia ?? '',
      energiaEletrica: avaliacao.energiaEletrica,
      aguaEncanada: avaliacao.aguaEncanada,
      tipoConstrucao: avaliacao.tipoConstrucao ?? '',
      rendaMensalFamiliar: avaliacao.rendaMensalFamiliar ?? '',
      quantasPessoasContribuemFormacaoRenda: avaliacao.quantasPessoasContribuemFormacaoRenda ?? '',
      alguemRecebeBeneficioPrevidenciarioGoverno: avaliacao.alguemRecebeBeneficioPrevidenciarioGoverno ?? '',
      diagnostico: avaliacao.diagnostico ?? '',
      tratamentoRealizado: avaliacao.tratamentoRealizado ?? '',
      casosCancerFamilia: avaliacao.casosCancerFamilia ?? '',
      necessitaMedicamentoUsoContinuo: avaliacao.necessitaMedicamentoUsoContinuo,
      medicamentoDisponibilizadoSus: avaliacao.medicamentoDisponibilizadoSus,
      custoMensalMedicamento: avaliacao.custoMensalMedicamento ?? '',
      alimentacaoEspecifica: avaliacao.alimentacaoEspecifica ?? '',
      equipamentoParaLocomocao: avaliacao.equipamentoParaLocomocao ?? '',
      dataMovimento: avaliacao.dataMovimento?.slice(0, 10) ?? ''
    });
    this.erro.set(null);
    this.formAberto.set(true);
  }

  protected cancelar(): void {
    this.formAberto.set(false);
  }

  protected salvar(): void {
    const valores = this.form.getRawValue();
    const dados: AvaliacaoSocialCreateDto = {
      fumante: valores.fumante,
      residencia: valores.residencia || null,
      energia_eletrica: valores.energiaEletrica,
      agua_encanada: valores.aguaEncanada,
      tipo_construcao: valores.tipoConstrucao || null,
      renda_mensal_familiar: valores.rendaMensalFamiliar || null,
      quantas_pessoas_contribuem_formacao_renda: valores.quantasPessoasContribuemFormacaoRenda || null,
      alguem_recebe_beneficio_previdenciario_governo:
        valores.alguemRecebeBeneficioPrevidenciarioGoverno || null,
      diagnostico: valores.diagnostico || null,
      tratamento_realizado: valores.tratamentoRealizado || null,
      casos_cancer_familia: valores.casosCancerFamilia || null,
      necessita_medicamento_uso_continuo: valores.necessitaMedicamentoUsoContinuo,
      medicamento_disponibilizado_sus: valores.medicamentoDisponibilizadoSus,
      custo_mensal_medicamento: valores.custoMensalMedicamento || null,
      alimentacao_especifica: valores.alimentacaoEspecifica || null,
      equipamento_para_locomocao: valores.equipamentoParaLocomocao || null,
      data_movimento: valores.dataMovimento || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const emEdicao = this.avaliacaoEmEdicao();
    const operacao = emEdicao
      ? this.service.atualizar(this.pessoaId(), emEdicao.id, dados)
      : this.service.criar(this.pessoaId(), dados);

    operacao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.carregar();
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }
}
