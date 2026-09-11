import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { AvaliacaoSocialTabComponent } from '../avaliacao-social/avaliacao-social-tab.component';
import { ComposicaoFamiliarTabComponent } from '../composicao-familiar/composicao-familiar-tab.component';
import { EstadoService } from '../../estados/estado.service';
import { Estado } from '../../estados/estado.model';
import { HospitalService } from '../../hospitais/hospital.service';
import { Hospital } from '../../hospitais/hospital.model';
import { MunicipioService } from '../../municipios/municipio.service';
import { Municipio } from '../../municipios/municipio.model';
import { PessoaService } from '../pessoa.service';
import { PaginaCadastroComponent } from '../../../shared/ui/pagina-cadastro/pagina-cadastro.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';
import { CapturaFotoComponent } from '../../../shared/ui/captura-foto/captura-foto.component';

@Component({
  selector: 'app-pessoa-cadastro-page',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    AvaliacaoSocialTabComponent,
    ComposicaoFamiliarTabComponent,
    CapturaFotoComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    PaginaCadastroComponent,
    CadastroAcoesComponent
  ],
  templateUrl: './pessoa-cadastro.page.html'
})
export class PessoaCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly pessoaService = inject(PessoaService);
  private readonly estadoService = inject(EstadoService);
  private readonly municipioService = inject(MunicipioService);
  private readonly hospitalService = inject(HospitalService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly pessoaId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.pessoaId !== null;

  // Avaliação Social/Composição Familiar são dados sensíveis (ver
  // `avaliacao_social.legacy.md`) — o backend já restringe os endpoints a
  // `Usuario.perfil == 'Assistente Social'` (`exigir_perfil`); aqui só
  // escondemos as abas de quem não tem esse perfil, pra não mostrar uma UI
  // que resultaria em 403. Só fazem sentido em edição: são sub-recursos de
  // uma pessoa que precisa existir antes.
  protected readonly mostrarAbasAssistenteSocial =
    this.modoEdicao && this.auth.temPerfil('Assistente Social');

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Foto (feature nova, 2026-09-11 — ver pessoa.legacy.md): só disponível em
  // edição, como Avaliação Social/Composição Familiar — precisa de um
  // `id_pessoa` já existente pra associar a foto no backend.
  protected readonly temFoto = signal(false);
  protected readonly fotoVersion = signal(0);
  protected readonly erroFoto = signal<string | null>(null);

  protected readonly estados = signal<Estado[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly hospitais = signal<Hospital[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    dataNascimento: ['', [Validators.required]],
    rg: [''],
    cpf: [''],
    profissao: [''],
    cartaoSus: [''],
    idEstado: this.fb.control<number | null>(null),
    idMunicipio: this.fb.control<number | null>(null),
    endereco: [''],
    pontoReferencia: [''],
    telefone: [''],
    idHospital: this.fb.control<number | null>(null),
    observacao: ['']
  });

  constructor() {
    this.estadoService.listar().subscribe((estados) => this.estados.set(estados));
    this.hospitalService.listar().subscribe((hospitais) => this.hospitais.set(hospitais));

    this.form.controls.idEstado.valueChanges.subscribe((idEstado) => {
      this.form.controls.idMunicipio.setValue(null);
      this.municipios.set([]);
      if (idEstado) {
        this.municipioService.listar({ idEstado }).subscribe((municipios) => this.municipios.set(municipios));
      }
    });

    if (this.pessoaId !== null) {
      this.pessoaService.buscar(this.pessoaId).subscribe({
        next: (pessoa) => {
          if (pessoa.id_estado) {
            this.municipioService
              .listar({ idEstado: pessoa.id_estado })
              .subscribe((municipios) => this.municipios.set(municipios));
          }

          this.form.patchValue({
            nome: pessoa.nome,
            dataNascimento: pessoa.data_nascimento,
            rg: pessoa.rg ?? '',
            cpf: pessoa.cpf ?? '',
            profissao: pessoa.profissao ?? '',
            cartaoSus: pessoa.cartao_sus ?? '',
            idEstado: pessoa.id_estado,
            idMunicipio: pessoa.id_municipio,
            endereco: pessoa.endereco ?? '',
            pontoReferencia: pessoa.ponto_referencia ?? '',
            telefone: pessoa.telefone ?? '',
            idHospital: pessoa.id_hospital,
            observacao: pessoa.observacao ?? ''
          });
          this.temFoto.set(pessoa.tem_foto);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados da pessoa.');
          this.carregando.set(false);
        }
      });
    }
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const formulario = {
      nome: valores.nome,
      data_nascimento: valores.dataNascimento,
      rg: valores.rg || null,
      cpf: valores.cpf || null,
      profissao: valores.profissao || null,
      cartao_sus: valores.cartaoSus || null,
      endereco: valores.endereco || null,
      ponto_referencia: valores.pontoReferencia || null,
      telefone: valores.telefone || null,
      id_hospital: valores.idHospital,
      id_municipio: valores.idMunicipio,
      id_estado: valores.idEstado,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    const operacao =
      this.pessoaId !== null
        ? this.pessoaService.atualizar(this.pessoaId, formulario)
        : this.pessoaService.criar(formulario);

    operacao.subscribe({
      next: () => {
        void this.router.navigateByUrl('/pessoas');
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected get fotoUrlAtual(): string | null {
    if (this.pessoaId === null || !this.temFoto()) {
      return null;
    }
    // cache-busting: sem isso, o navegador mostraria a foto antiga (mesma
    // URL) depois de trocar/remover.
    return `${this.pessoaService.fotoUrl(this.pessoaId)}?v=${this.fotoVersion()}`;
  }

  protected salvarFoto(arquivo: Blob): void {
    if (this.pessoaId === null) {
      return;
    }

    this.erroFoto.set(null);
    this.pessoaService.salvarFoto(this.pessoaId, arquivo).subscribe({
      next: () => {
        this.temFoto.set(true);
        this.fotoVersion.update((v) => v + 1);
      },
      error: (error) => this.erroFoto.set(descreverErroHttp(error.error))
    });
  }

  protected removerFoto(): void {
    if (this.pessoaId === null || !confirm('Remover a foto desta pessoa?')) {
      return;
    }

    this.erroFoto.set(null);
    this.pessoaService.removerFoto(this.pessoaId).subscribe({
      next: () => {
        this.temFoto.set(false);
        this.fotoVersion.update((v) => v + 1);
      },
      error: (error) => this.erroFoto.set(descreverErroHttp(error.error))
    });
  }
}
