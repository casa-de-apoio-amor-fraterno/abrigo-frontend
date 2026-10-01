import { DatePipe } from '@angular/common';
import { Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { descreverErroHttp } from '../../../core/http/api-error';
import { AssinaturaCanvasComponent } from '../../../shared/ui/assinatura-canvas/assinatura-canvas.component';
import { PessoaService } from '../../pessoas/pessoa.service';
import { Pessoa } from '../../pessoas/pessoa.model';
import { mascararCpf } from '../../../shared/util/cpf';
import { Emprestimo, EmprestimoItem, TipoContrato } from '../emprestimo.model';
import { EmprestimoService } from '../emprestimo.service';
import { LinkAssinaturaDialogComponent } from '../link-assinatura-dialog/link-assinatura-dialog.component';

export interface EmprestimoDetalheDialogData {
  emprestimoId: number;
  /** Navega direto pra edição (rota já visível por trás, ex.: aberto a
   * partir da própria listagem de empréstimos). Ignorado quando `aoEditar`
   * ou `acoesRapidas` é informado. */
  linkEditar?: unknown[];
  /** Abre a edição sem trocar de rota (ex.: popup aberto por cima da tela
   * Início, ver home.page.ts) — mesmo motivo/padrão de
   * `DetalheDialogData.aoEditar`. Ignorado quando `acoesRapidas` é `true`. */
  aoEditar?: () => void;
  /** Mostra as ações rápidas "Finalizar"/"Renovar empréstimo" ao lado da
   * edição (pedido do time, 2026-09-28): primeiro na tela Início
   * (home.page.ts) — ali sem `aoEditar`/`linkEditar`, então o popup fica só
   * com as ações rápidas, tirando a edição completa de dentro do "Ver" —
   * depois também na listagem de empréstimos (emprestimo-consulta.page.ts),
   * onde continuam lado a lado com "Editar empréstimo". */
  acoesRapidas?: boolean;
}

/** Popup de consulta rápida de um empréstimo — descrição completa (pessoa,
 * contrato, observação, situação em destaque) + a lista de itens
 * emprestados, cada um com material, patrimônio, datas e situação
 * própria. Antes usava o `DetalheDialogComponent` genérico só com Nº
 * contrato/situação (2026-09-26: "muito pobre em informações" — pedido do
 * time); esse aqui busca os dados completos (empréstimo + itens + pessoa)
 * em vez de depender só do que a listagem já tinha em mãos. */
@Component({
  selector: 'app-emprestimo-detalhe-dialog',
  imports: [
    DatePipe,
    RouterLink,
    AssinaturaCanvasComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './emprestimo-detalhe-dialog.component.html',
  styleUrl: './emprestimo-detalhe-dialog.component.scss'
})
export class EmprestimoDetalheDialogComponent {
  protected readonly dialogRef = inject<MatDialogRef<EmprestimoDetalheDialogComponent>>(MatDialogRef);
  protected readonly data = inject<EmprestimoDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly emprestimo = signal<Emprestimo | null>(null);
  protected readonly pessoa = signal<Pessoa | null>(null);
  protected readonly itens = signal<EmprestimoItem[]>([]);

  // Ações rápidas (só quando `data.acoesRapidas`, ver home.page.ts) —
  // "Finalizar" reaproveita o mesmo endpoint de devolução em massa já
  // usado em qualquer outro fluxo (EmprestimoService.devolver); "Renovar"
  // soma N dias à data prevista de devolução do empréstimo (pergunta feita
  // pelo time, 2026-09-28: "por quantos dias renovar") e, na sequência,
  // exige assinar o termo de renovação (pedido do time, 2026-09-28: "ao
  // confirmar renovação, precisamos assinar o contrato de renovação e
  // gerá-lo") — duas etapas dentro do mesmo popup: `dias` (quantidade) e
  // `assinar` (captura da assinatura via AssinaturaCanvasComponent, mesmo
  // componente usado na aba Contrato do cadastro completo).
  //
  // Sem um "Comodato" assinado, renovar sempre falhava com 409
  // (RenovacaoSemContratoOriginal, ver service.py) — o botão "Renovar
  // empréstimo" virava um beco sem saída. Troca de rótulo pedida pelo time
  // (2026-09-28): sem contrato original, o botão vira "Assinar contrato" e
  // pula direto pra etapa `assinar`, sem o passo de dias (assina o
  // "Comodato" original, sem mexer no prazo).
  protected readonly finalizando = signal(false);
  protected readonly renovando = signal(false);
  protected readonly renovarAberto = signal(false);
  protected readonly etapaRenovar = signal<'dias' | 'assinar'>('dias');
  protected readonly diasRenovacao = signal('');
  // Itens que voltam na renovação em vez de serem renovados (pedido do
  // time, 2026-09-30) — por padrão todo item ativo é renovado.
  protected readonly idsItensDevolver = signal<ReadonlySet<number>>(new Set());
  protected readonly erroAcao = signal<string | null>(null);
  protected readonly assinaturaCanvas = viewChild(AssinaturaCanvasComponent);
  protected readonly temContratoOriginal = signal(true);
  // Qual termo está sendo assinado nesta rodada do popup — decide se
  // `confirmarRenovar` chama `renovar()` antes (só faz sentido pra
  // "Renovação") e qual `tipo` mandar em `assinarContrato`.
  private tipoContratoPendente: TipoContrato = 'Renovação';
  // Marca que a chamada de `renovar()` (prazo + situação dos itens) já foi
  // aplicada com sucesso — se a assinatura do termo falhar depois (ex.:
  // 409 porque o empréstimo ainda não tem contrato de comodato original),
  // um novo clique em "Confirmar renovação" só tenta assinar de novo, sem
  // somar os dias outra vez.
  private renovacaoAplicada = false;

  constructor() {
    forkJoin({
      emprestimo: this.emprestimoService.buscar(this.data.emprestimoId),
      itens: this.emprestimoService.listarItens(this.data.emprestimoId),
      contratos: this.emprestimoService.listarContratos(this.data.emprestimoId)
    }).subscribe({
      next: ({ emprestimo, itens, contratos }) => {
        this.emprestimo.set(emprestimo);
        this.itens.set(itens);
        this.temContratoOriginal.set(contratos.some((c) => c.tipo === 'Comodato'));
        this.carregando.set(false);
        this.pessoaService.buscar(emprestimo.idPessoa).subscribe({
          next: (pessoa) => this.pessoa.set(pessoa),
          // Pessoa é só um complemento (telefone/CPF) — a tela continua
          // útil sem ela se a busca falhar por algum motivo.
          error: () => undefined
        });
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do empréstimo.');
        this.carregando.set(false);
      }
    });
  }

  protected cpfMascarado(cpf: string): string {
    return mascararCpf(cpf);
  }

  protected editar(): void {
    this.dialogRef.close();
    this.data.aoEditar?.();
  }

  protected finalizar(): void {
    const emp = this.emprestimo();
    const idUsuario = this.auth.sessao()?.usuario_id;
    if (!emp || idUsuario === undefined) {
      return;
    }

    this.finalizando.set(true);
    this.erroAcao.set(null);
    this.emprestimoService.devolver(emp.id, idUsuario).subscribe({
      next: () => {
        this.finalizando.set(false);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.finalizando.set(false);
        this.erroAcao.set(descreverErroHttp(error.error));
      }
    });
  }

  protected abrirRenovar(): void {
    this.erroAcao.set(null);
    this.diasRenovacao.set('');
    this.idsItensDevolver.set(new Set());
    this.tipoContratoPendente = 'Renovação';
    this.etapaRenovar.set('dias');
    this.renovacaoAplicada = false;
    this.renovarAberto.set(true);
  }

  /** Sem "Comodato" assinado ainda — pula direto pra etapa `assinar` (sem
   * dias, sem chamar `renovar()`): só o termo original, sem mexer no
   * prazo. */
  protected abrirAssinarComodato(): void {
    this.erroAcao.set(null);
    this.tipoContratoPendente = 'Comodato';
    this.etapaRenovar.set('assinar');
    this.renovacaoAplicada = false;
    this.renovarAberto.set(true);
  }

  protected itensAtivos(): EmprestimoItem[] {
    return this.itens().filter((item) => item.situacao !== 'Devolvido');
  }

  protected alternarDevolucao(item: EmprestimoItem, devolver: boolean): void {
    const ids = new Set(this.idsItensDevolver());
    if (devolver) {
      ids.add(item.id);
    } else {
      ids.delete(item.id);
    }
    this.idsItensDevolver.set(ids);
  }

  /** Contrato pendente: gera o link pra a pessoa assinar pelo próprio
   * celular (sem login, confirmando o CPF). */
  protected gerarLinkAssinatura(): void {
    const emp = this.emprestimo();
    if (!emp) {
      return;
    }
    this.dialog.open(LinkAssinaturaDialogComponent, {
      width: '480px',
      data: { emprestimoId: emp.id, nomePessoa: this.pessoa()?.nome ?? 'a pessoa' }
    });
  }

  protected cancelarRenovar(): void {
    this.renovarAberto.set(false);
    this.erroAcao.set(null);
  }

  /** Sai da etapa "dias" pra "assinar" — só valida a quantidade aqui; a
   * renovação em si só é enviada ao backend em `confirmarRenovar`, junto
   * com a assinatura. */
  protected continuarRenovar(): void {
    const dias = Number(this.diasRenovacao());
    if (!this.diasRenovacao() || !Number.isFinite(dias) || dias <= 0) {
      this.erroAcao.set('Informe um número de dias válido.');
      return;
    }
    if (this.idsItensDevolver().size >= this.itensAtivos().length) {
      this.erroAcao.set('Ao menos um item precisa ser renovado — para devolver todos, use "Finalizar".');
      return;
    }
    this.erroAcao.set(null);
    this.etapaRenovar.set('assinar');
  }

  protected podeAssinarRenovacao(): boolean {
    return !!this.assinaturaCanvas()?.obterAssinatura();
  }

  protected confirmarRenovar(): void {
    const emp = this.emprestimo();
    const idUsuario = this.auth.sessao()?.usuario_id;
    const assinatura = this.assinaturaCanvas()?.obterAssinatura();
    if (!emp || idUsuario === undefined || !assinatura) {
      return;
    }

    this.renovando.set(true);
    this.erroAcao.set(null);

    // "Comodato" (sem contrato original ainda) não renova prazo nenhum —
    // só assina o termo original, direto.
    if (this.tipoContratoPendente === 'Comodato' || this.renovacaoAplicada) {
      this.assinarContratoPendente(emp.id, assinatura);
      return;
    }

    const dias = Number(this.diasRenovacao());
    this.emprestimoService.renovar(emp.id, idUsuario, dias, [...this.idsItensDevolver()]).subscribe({
      next: (renovado) => {
        this.emprestimo.set(renovado);
        this.renovacaoAplicada = true;
        this.assinarContratoPendente(emp.id, assinatura);
      },
      error: (error) => {
        this.renovando.set(false);
        this.erroAcao.set(descreverErroHttp(error.error));
      }
    });
  }

  /** Gera e assina o termo pendente (`tipoContratoPendente`) — "Comodato"
   * (contrato original, ver `abrirAssinarComodato`) ou "Renovação" (termo
   * aditivo, chamado só depois que `renovar()` já aplicou o novo prazo,
   * pra o PDF refletir a data de devolução atualizada). Mesmo endpoint da
   * aba Contrato do cadastro completo, ver
   * `service.criar_contrato`/`_gerar_pdf_contrato`/`_gerar_pdf_termo_renovacao`
   * no backend. */
  private assinarContratoPendente(idEmprestimo: number, assinaturaPngBase64: string): void {
    this.emprestimoService.assinarContrato(idEmprestimo, assinaturaPngBase64, this.tipoContratoPendente).subscribe({
      next: () => {
        this.renovando.set(false);
        this.temContratoOriginal.set(true);
        this.dialogRef.close(true);
      },
      error: (error) => {
        // Se já era uma renovação, o prazo já foi alterado (só a
        // assinatura falhou) — deixa isso claro em vez de um erro
        // genérico, já que fechar o popup agora não desfaz a renovação.
        this.renovando.set(false);
        const prefixo = this.tipoContratoPendente === 'Renovação' ? 'O prazo já foi renovado. ' : '';
        this.erroAcao.set(`${prefixo}Não foi possível gerar o termo assinado: ${descreverErroHttp(error.error)}`);
      }
    });
  }
}
