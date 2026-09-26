# Planejamento — Popups de "visualizar" dedicados por entidade

Contexto: o popup "visualizar" de Empréstimos usava o componente genérico
`shared/ui/detalhe-dialog/detalhe-dialog.component.ts` (só `{rotulo, valor}`
em lista, sem cor) e ficou "muito pobre em informações" (feedback do time,
2026-09-26). Resolvido criando um componente **dedicado**
(`features/emprestimos/detalhe-dialog/emprestimo-detalhe-dialog.component.ts`)
que busca os dados completos (empréstimo + itens + pessoa) e mostra a
situação como uma pill colorida no canto superior direito do cabeçalho,
além dos itens emprestados com material/patrimônio/datas/situação própria.

Este documento lista o mesmo tratamento pras outras 6 telas que ainda usam
o `DetalheDialogComponent` genérico — pra fazer numa sessão futura, uma
entidade por vez (cada uma é um componente próprio, no padrão já usado por
`emprestimo-detalhe-dialog` e `contratos-dialog`: arquivo `.ts` + `.html`
+ `.scss` dedicados, nunca vários componentes no mesmo arquivo).

## Progresso

- ✅ **Material** — `features/materiais/detalhe-dialog/material-detalhe-dialog.component.ts`
  (2026-09-26).
- ✅ **Estadia** — `features/estadias/detalhe-dialog/estadia-detalhe-dialog.component.ts`,
  inclui acompanhantes e histórico (2026-09-26).
- ✅ **Pessoa** — `features/pessoas/detalhe-dialog/pessoa-detalhe-dialog.component.ts`
  (2026-09-26). Avaliação Social e Composição Familiar ficaram de fora de
  propósito — já são abas da edição, resumo aqui só duplicaria.
- ✅ **Voluntario** — `features/voluntarios/detalhe-dialog/voluntario-detalhe-dialog.component.ts`
  (2026-09-26).
- ✅ **Quarto** — `features/quartos/detalhe-dialog/quarto-detalhe-dialog.component.ts`,
  inclui ocupantes atuais via `QuartoService.listarOcupacao()` (2026-09-26).
- ✅ **Hospital** — `features/hospitais/detalhe-dialog/hospital-detalhe-dialog.component.ts`
  (2026-09-26). Modelo enxuto — só a pill, sem pessoas/estadias vinculadas
  (nice-to-have do plano original, não implementado).

Todas as 6 telas migradas. Nenhuma tela de consulta usa mais o
`DetalheDialogComponent` genérico — ele continua existindo em
`shared/ui/detalhe-dialog/` só por enquanto, avaliar se vale remover numa
limpeza futura se nenhum outro lugar passar a usá-lo.

## Padrão a repetir (referência: `EmprestimoDetalheDialogComponent`)

1. Componente novo em `features/<entidade>/detalhe-dialog/`, recebendo só
   o id via `MAT_DIALOG_DATA` (não os campos já prontos que a listagem
   tinha em mãos) — busca os dados completos pela API no `constructor`
   (`forkJoin` quando precisar de mais de um endpoint).
2. Cabeçalho: nome/título à esquerda, pill de situação (`.consulta__badge`
   + `[class.consulta__badge--aviso]`/`--neutro`/`--erro`, classes já
   globais em `styles.scss`) à direita — **não** criar CSS de pill nova,
   reusar essas.
3. Corpo: todos os campos relevantes do model que hoje ficam de fora (ver
   lista por entidade abaixo), mais qualquer sub-recurso relacionado que
   enriqueça a consulta rápida.
4. Rodapé: "Fechar" + "Editar" — suportar tanto `linkEditar` (routerLink,
   quando a tela que abre já está na própria listagem) quanto `aoEditar`
   (callback, quando aberto de outro lugar sem trocar de rota, ver
   `home.page.ts` pro caso de Empréstimo) — mesma interface dupla que
   `EmprestimoDetalheDialogComponent`/`DetalheDialogData` já usam.
5. Atualizar a página de consulta correspondente pra abrir o componente
   novo no lugar do `DetalheDialogComponent` genérico.

## Por entidade

### Pessoa (`features/pessoas/`)
- Popup hoje: CPF, Telefone, Nascimento, foto.
- Adicionar: profissão, cartão SUS, endereço, ponto de referência,
  hospital vinculado (nome, via `id_hospital`), naturalidade
  (município/estado), observação, data de cadastro.
- Pill: `ativo` (Ativo/Inativo).
- Sub-recursos pra considerar: Avaliação Social e Composição Familiar
  (ambos já são features próprias) — avaliar se cabe um resumo aqui ou se
  é melhor só linkar pra aba correspondente na edição.

### Material (`features/materiais/`)
- Popup hoje: Nº Patrimônio, Situação (texto), Disponível p/ empréstimo.
- Adicionar: local, observação, motivo da inutilização (só quando
  situação = Inutilizado), foto (thumb).
- Pill: `situacao` (`Disponível`/`Alocado`/`Emprestado`/`Inutilizado`) —
  já é uma lista fechada (ver `material.model.ts`), boa candidata direta.

### Estadia (`features/estadias/`)
- Popup hoje: Tipo, Quarto, Entrada, Saída, Situação (texto).
- Adicionar: hospital do atendimento, tempo de estadia (valor + unidade),
  observação, usuário que cadastrou.
- Pill: `situacao` (`Em acompanhamento`/`Aguardando retorno`/`Finalizada`).
- Sub-recursos: lista de acompanhantes (`EstadiaAcompanhante`) e histórico
  de alteração (`EstadiaHistorico`) — nenhum aparece hoje no popup rápido,
  ambos agregam bastante (mesmo espírito da lista de itens que agregamos
  no de Empréstimo).

### Voluntario (`features/voluntarios/`)
- Popup hoje: Telefone, Setor.
- Adicionar: data de nascimento, estado civil, CPF, endereço, formação,
  observação.
- Pill: `ativo` (Ativo/Inativo).

### Quarto (`features/quartos/`)
- Popup hoje: Leito(s), Descrição, Status (texto).
- Pill: `ativo` (Ativo/Inativo) — já mostrado como texto, só trocar pra
  pill.
- Sub-recurso: ocupantes atuais do quarto (`QuartoOcupacao.ocupantes` /
  `pendentesRevisao`, já usados na tela Início) — mostrar quem está
  ocupando cada leito agora seria o maior ganho aqui.

### Hospital (`features/hospitais/`)
- Popup hoje: só Status.
- Model é enxuto (id, nome, ativo) — não há campo novo a adicionar além da
  pill.
- Pill: `ativo` (Ativo/Inativo).
- Avaliar (nice-to-have, não bloqueante): listar pessoas/estadias
  vinculadas a esse hospital, se fizer sentido pro fluxo de quem usa essa
  tela.

## Ordem sugerida

Pelo tamanho do ganho vs. esforço: **Material** e **Estadia** primeiro
(models já têm situação fechada pra pill + sub-recursos claros que faltam
— acompanhantes/histórico da estadia, motivo de inutilização do
material). **Pessoa** depois (mais campos, mas sem pill óbvia além de
ativo/inativo). **Voluntário**, **Quarto** e **Hospital** por último —
ganho menor, principalmente troca de texto por pill mais um ou dois
campos.
