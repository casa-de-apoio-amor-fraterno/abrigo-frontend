import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { AvaliacaoSocialTabComponent } from '../avaliacao-social/avaliacao-social-tab.component';
import { ComposicaoFamiliarTabComponent } from '../composicao-familiar/composicao-familiar-tab.component';
import { ComposicaoFamiliarCreateDto } from '../composicao-familiar/composicao-familiar.dto';
import { ContatoFormulario } from '../../../shared/data/contato/contato.model';
import { EstadoService } from '../../estados/estado.service';
import { Estado } from '../../estados/estado.model';
import { HospitalService } from '../../hospitais/hospital.service';
import { Hospital } from '../../hospitais/hospital.model';
import { MunicipioService } from '../../municipios/municipio.service';
import { Municipio } from '../../municipios/municipio.model';
import { PessoaService } from '../pessoa.service';
import {
  CadastroDialogAba,
  CadastroDialogShellComponent
} from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';
import { CapturaFotoComponent } from '../../../shared/ui/captura-foto/captura-foto.component';
import { ContatosTabComponent } from '../../../shared/ui/contatos-tab/contatos-tab.component';

@Component({
  selector: 'app-pessoa-cadastro-page',
  imports: [
    ReactiveFormsModule,
    AvaliacaoSocialTabComponent,
    ComposicaoFamiliarTabComponent,
    CapturaFotoComponent,
    ContatosTabComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CadastroDialogShellComponent,
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
  // que resultaria em 403.
  protected readonly podeVerAssistenteSocial = this.auth.temPerfil('Assistente Social');

  // Avaliação Social continua só em edição (registro próprio, não dá pra
  // juntar no POST de criação). Composição Familiar e Contatos já dão — ver
  // `composicaoFamiliarLocal`/`contatosLocais` e os DTOs aninhados em
  // `PessoaCreate` (abrigo-backend/app/features/pessoas/schemas.py) —
  // então ficam disponíveis também ao criar uma pessoa nova.
  protected readonly abas: CadastroDialogAba[] = [
    { id: 'dados', rotulo: 'Dados pessoais' },
    { id: 'endereco', rotulo: 'Endereço' },
    { id: 'atendimento', rotulo: 'Atendimento' },
    ...(this.modoEdicao && this.podeVerAssistenteSocial ? [{ id: 'avaliacao', rotulo: 'Avaliação Social' }] : []),
    ...(this.podeVerAssistenteSocial ? [{ id: 'composicao', rotulo: 'Composição Familiar' }] : []),
    { id: 'contatos', rotulo: 'Contatos' }
  ];
  protected readonly abaAtiva = signal('dados');

  protected readonly composicaoFamiliarLocal = signal<ComposicaoFamiliarCreateDto[]>([]);
  protected readonly contatosLocais = signal<ContatoFormulario[]>([]);

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Foto (feature nova, 2026-09-11 — ver pessoa.legacy.md): na criação
  // ainda não existe `id_pessoa` pra usar `PUT /pessoas/{id}/foto`, então a
  // foto capturada fica local (Blob + object URL de prévia, ver
  // `fotoLocal`/`fotoLocalUrl`) e só é enviada depois que `salvar()` cria a
  // pessoa e recebe o id.
  protected readonly temFoto = signal(false);
  protected readonly fotoVersion = signal(0);
  protected readonly erroFoto = signal<string | null>(null);
  protected readonly fotoLocal = signal<Blob | null>(null);
  protected readonly fotoLocalUrl = signal<string | null>(null);

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
    idHospital: this.fb.control<number | null>(null),
    observacao: ['']
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      const url = this.fotoLocalUrl();
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

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
      id_hospital: valores.idHospital,
      id_municipio: valores.idMunicipio,
      id_estado: valores.idEstado,
      observacao: valores.observacao || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    if (this.pessoaId !== null) {
      this.pessoaService.atualizar(this.pessoaId, formulario).subscribe({
        next: () => void this.router.navigateByUrl('/pessoas'),
        error: (error) => {
          this.salvando.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
      return;
    }

    this.pessoaService.criar(formulario, this.composicaoFamiliarLocal(), this.contatosLocais()).subscribe({
      next: (pessoaCriada) => {
        const foto = this.fotoLocal();
        if (!foto) {
          void this.router.navigateByUrl('/pessoas');
          return;
        }

        // Pessoa já foi criada nesse ponto — se o upload da foto falhar,
        // não desfaz a criação, só avisa (a foto pode ser adicionada
        // depois, em edição).
        this.pessoaService.salvarFoto(pessoaCriada.id, foto).subscribe({
          next: () => void this.router.navigateByUrl('/pessoas'),
          error: (error) => {
            this.salvando.set(false);
            this.erro.set(`Pessoa criada, mas não foi possível salvar a foto: ${descreverErroHttp(error.error)}`);
          }
        });
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected get contatosUrl(): string | null {
    return this.pessoaId === null ? null : this.pessoaService.contatosUrl(this.pessoaId);
  }

  protected get fotoUrlAtual(): string | null {
    if (this.pessoaId === null) {
      return this.fotoLocalUrl();
    }
    if (!this.temFoto()) {
      return null;
    }
    // cache-busting: sem isso, o navegador mostraria a foto antiga (mesma
    // URL) depois de trocar/remover.
    return `${this.pessoaService.fotoUrl(this.pessoaId)}?v=${this.fotoVersion()}`;
  }

  protected salvarFoto(arquivo: Blob): void {
    this.erroFoto.set(null);

    if (this.pessoaId === null) {
      const anterior = this.fotoLocalUrl();
      if (anterior) {
        URL.revokeObjectURL(anterior);
      }
      this.fotoLocal.set(arquivo);
      this.fotoLocalUrl.set(URL.createObjectURL(arquivo));
      return;
    }

    this.pessoaService.salvarFoto(this.pessoaId, arquivo).subscribe({
      next: () => {
        this.temFoto.set(true);
        this.fotoVersion.update((v) => v + 1);
      },
      error: (error) => this.erroFoto.set(descreverErroHttp(error.error))
    });
  }

  protected removerFoto(): void {
    if (this.pessoaId === null) {
      if (this.fotoLocal() && confirm('Remover a foto?')) {
        const anterior = this.fotoLocalUrl();
        if (anterior) {
          URL.revokeObjectURL(anterior);
        }
        this.fotoLocal.set(null);
        this.fotoLocalUrl.set(null);
      }
      return;
    }

    if (!confirm('Remover a foto desta pessoa?')) {
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
