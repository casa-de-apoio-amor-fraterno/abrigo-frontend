import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { descreverErroHttp } from '../../../core/http/api-error';
import { EstadoService } from '../../estados/estado.service';
import { Estado } from '../../estados/estado.model';
import { HospitalService } from '../../hospitais/hospital.service';
import { Hospital } from '../../hospitais/hospital.model';
import { MunicipioService } from '../../municipios/municipio.service';
import { Municipio } from '../../municipios/municipio.model';
import { PessoaService } from '../pessoa.service';

@Component({
  selector: 'app-pessoa-cadastro-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './pessoa-cadastro.page.html',
  styleUrl: './pessoa-cadastro.page.scss'
})
export class PessoaCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly pessoaService = inject(PessoaService);
  private readonly estadoService = inject(EstadoService);
  private readonly municipioService = inject(MunicipioService);
  private readonly hospitalService = inject(HospitalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly pessoaId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.pessoaId !== null;

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

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
}
