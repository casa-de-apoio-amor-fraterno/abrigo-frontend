import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { descreverErroHttp } from '../../../core/http/api-error';
import { MaterialService } from '../material.service';
import { CadastroDialogShellComponent } from '../../../shared/ui/cadastro-dialog-shell/cadastro-dialog-shell.component';
import { CadastroAcoesComponent } from '../../../shared/ui/cadastro-acoes/cadastro-acoes.component';
import { UploadFotoComponent } from '../../../shared/ui/upload-foto/upload-foto.component';

@Component({
  selector: 'app-material-cadastro-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    CadastroDialogShellComponent,
    CadastroAcoesComponent,
    UploadFotoComponent
  ],
  templateUrl: './material-cadastro.page.html'
})
export class MaterialCadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly materialService = inject(MaterialService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly materialId = this.route.snapshot.paramMap.get('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly modoEdicao = this.materialId !== null;

  protected readonly carregando = signal(this.modoEdicao);
  protected readonly salvando = signal(false);
  protected readonly inativando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly ativo = signal(true);

  // Foto: mesmo padrão de pessoa-cadastro.page.ts — na criação ainda não
  // existe `id_material` pra usar `PUT /materiais/{id}/foto`, então a foto
  // enviada fica local (Blob + object URL de prévia) e só é mandada depois
  // que `salvar()` cria o material e recebe o id.
  protected readonly temFoto = signal(false);
  protected readonly fotoVersion = signal(0);
  protected readonly erroFoto = signal<string | null>(null);
  protected readonly fotoLocal = signal<Blob | null>(null);
  protected readonly fotoLocalUrl = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    descricao: ['', [Validators.required]],
    codigoIdentificacao: [''],
    situacao: ['', [Validators.required]],
    local: ['', [Validators.required]],
    disponivelEmprestimo: [false],
    observacao: [''],
    motivoBaixa: ['']
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      const url = this.fotoLocalUrl();
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    if (this.materialId !== null) {
      this.materialService.buscar(this.materialId).subscribe({
        next: (material) => {
          this.form.patchValue({
            descricao: material.descricao,
            codigoIdentificacao: material.codigoIdentificacao ?? '',
            situacao: material.situacao,
            local: material.local,
            disponivelEmprestimo: material.disponivelEmprestimo,
            observacao: material.observacao ?? '',
            motivoBaixa: material.motivoBaixa ?? ''
          });
          this.ativo.set(material.ativo ?? true);
          this.temFoto.set(material.tem_foto);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os dados do material.');
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
    const dados = {
      descricao: valores.descricao,
      codigo_identificacao: valores.codigoIdentificacao || null,
      situacao: valores.situacao,
      local: valores.local,
      disponivel_emprestimo: valores.disponivelEmprestimo,
      observacao: valores.observacao || null,
      motivo_baixa: valores.motivoBaixa || null
    };

    this.salvando.set(true);
    this.erro.set(null);

    if (this.materialId !== null) {
      this.materialService.atualizar(this.materialId, dados).subscribe({
        next: () => void this.router.navigateByUrl('/materiais'),
        error: (error) => {
          this.salvando.set(false);
          this.erro.set(descreverErroHttp(error.error));
        }
      });
      return;
    }

    this.materialService.criar(dados).subscribe({
      next: (materialCriado) => {
        const foto = this.fotoLocal();
        if (!foto) {
          void this.router.navigateByUrl('/materiais');
          return;
        }

        // Material já foi criado nesse ponto — se o upload da foto falhar,
        // não desfaz a criação, só avisa (a foto pode ser adicionada
        // depois, em edição).
        this.materialService.salvarFoto(materialCriado.id, foto).subscribe({
          next: () => void this.router.navigateByUrl('/materiais'),
          error: (error) => {
            this.salvando.set(false);
            this.erro.set(`Material criado, mas não foi possível salvar a foto: ${descreverErroHttp(error.error)}`);
          }
        });
      },
      error: (error) => {
        this.salvando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected inativar(): void {
    if (this.materialId === null || !confirm('Inativar este material?')) {
      return;
    }

    this.inativando.set(true);
    this.erro.set(null);

    this.materialService.inativar(this.materialId).subscribe({
      next: () => {
        void this.router.navigateByUrl('/materiais');
      },
      error: (error) => {
        this.inativando.set(false);
        this.erro.set(descreverErroHttp(error.error));
      }
    });
  }

  protected get fotoUrlAtual(): string | null {
    if (this.materialId === null) {
      return this.fotoLocalUrl();
    }
    if (!this.temFoto()) {
      return null;
    }
    // cache-busting: sem isso, o navegador mostraria a foto antiga (mesma
    // URL) depois de trocar/remover.
    return `${this.materialService.fotoUrl(this.materialId)}?v=${this.fotoVersion()}`;
  }

  protected salvarFoto(arquivo: Blob): void {
    this.erroFoto.set(null);

    if (this.materialId === null) {
      const anterior = this.fotoLocalUrl();
      if (anterior) {
        URL.revokeObjectURL(anterior);
      }
      this.fotoLocal.set(arquivo);
      this.fotoLocalUrl.set(URL.createObjectURL(arquivo));
      return;
    }

    this.materialService.salvarFoto(this.materialId, arquivo).subscribe({
      next: () => {
        this.temFoto.set(true);
        this.fotoVersion.update((v) => v + 1);
      },
      error: (error) => this.erroFoto.set(descreverErroHttp(error.error))
    });
  }

  protected removerFoto(): void {
    if (this.materialId === null) {
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

    if (!confirm('Remover a foto deste material?')) {
      return;
    }

    this.erroFoto.set(null);
    this.materialService.removerFoto(this.materialId).subscribe({
      next: () => {
        this.temFoto.set(false);
        this.fotoVersion.update((v) => v + 1);
      },
      error: (error) => this.erroFoto.set(descreverErroHttp(error.error))
    });
  }
}
