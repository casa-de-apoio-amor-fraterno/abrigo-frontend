# Atividades — Frontend

Levantamento das telas do sistema legado Delphi (`abrigo-legacy/fonte/Unt/`)
cruzado com o que já existe no `abrigo-frontend` e o que já está pronto no
`abrigo-backend` (ver `abrigo-backend/docs/atividades.md`, que tem o
levantamento equivalente do banco/backend). O backend hoje tem CRUD completo
pronto para **todas** as entidades abaixo, exceto onde marcado — o trabalho
que falta aqui é só de UI.

## Inventário de telas por entidade (legado)

| Entidade | Telas no legado | Frontend hoje |
| --- | --- | --- |
| `Pessoa` | Consulta, Manutenção (com sub-abas: Avaliação Social, Composição Familiar, Observações, Histórico de alteração), Relatório | ✅ Consulta (+ exportar CSV), ✅ Manutenção com abas de Avaliação Social/Composição Familiar (guardadas por perfil). Relatório → export CSV, não réplica do PDF. |
| `Usuario` | Login, Manutenção, Alterar Senha, Consulta | ✅ Login. ❌ Manutenção (decisão: gestão de usuário fica por CLI — `app/scripts/criar_usuario.py` no backend — não por UI, ver `abrigo-backend/README.md`) |
| `Estado`/`Municipio`/`Hospital` | Sem tela própria no legado (só usados como combo em `Pessoa`) | ❌ Sem UI própria, por design — aparecem como `<select>` no formulário de `Pessoa` |
| `Quarto` | Consulta, Manutenção | ✅ Consulta (+ exportar CSV) + Manutenção (`features/quartos/`) |
| `Estadia` | Consulta, Manutenção (grid de leitos disponíveis + grid de acompanhantes), Consulta com Foto, Relatório | ✅ Consulta (+ exportar CSV) + Manutenção com acompanhantes (`features/estadias/`) — sem filtro de "leitos disponíveis" (gap conhecido, ver item 5). ❌ Consulta com Foto. Relatório → export CSV. |
| `Voluntario` | Consulta, Manutenção | ✅ Consulta (+ exportar CSV) + Manutenção (`features/voluntarios/`) |
| `Material` | Consulta, Manutenção, Consulta Rápida (usada dentro do picker de item de empréstimo), Relatório | ✅ Consulta (+ exportar CSV) + Manutenção (`features/materiais/`) + picker (`material-autocomplete`, usado em Empréstimo). Relatório → export CSV. |
| `Emprestimo` | Consulta, Manutenção (dados + aba de itens do empréstimo + aba Observações + aba Histórico), Relatório | ✅ Consulta (+ exportar CSV) + Manutenção com itens e histórico real (`features/emprestimos/`) — aba Observações dobrada dentro de Dados. Relatório → export CSV. |
| `Disponibilidade`, `Procedimento`/`ProcedimentoRealizado` | Existem no legado, mas **0 registros em produção** | ⏸️ Deliberadamente fora do escopo por enquanto (decisão espelhada do backend) |

**Backlog de páginas completo (itens 1-9) concluído em 2026-09-11.** Restam
só os gaps conhecidos documentados junto de cada item (ex.: relatório
impresso 1:1 do legado não replicado — virou export CSV; sincronização
Material↔Empréstimo; filtro de leitos disponíveis em Estadia) e telas
fora de escopo por decisão deliberada (Usuário, Disponibilidade,
Procedimento — ver tabela abaixo).

## Gaps que não são só "falta a tela"

1. **Não existe guarda de rota/UI por perfil no frontend.** O backend já
   protege `avaliação social` e `composição familiar` com
   `exigir_perfil("assistente_social")` (403 pra quem não for) — o
   frontend não sabe disso ainda. Sem tratamento, um usuário sem esse
   perfil veria essas abas/rotas e tomaria um erro 403 cru do
   `apiErrorInterceptor`, em vez de a aba simplesmente não aparecer. **Fazer
   antes de construir as telas de Avaliação Social/Composição Familiar**:
   guardar o perfil do usuário logado (o backend precisa devolver o `perfil`
   na resposta de login — hoje `SessaoResponse` só tem `nome`/`token`; ver
   `abrigo-backend/app/features/auth/schemas.py`) e usar isso pra
   esconder/mostrar a aba e redirecionar em caso de 403.
2. ✅ **Resolvido (2026-09-11)** — `shared/ui/pagina-cadastro/` (cabeçalho
   com voltar, título/subtítulo e estado de carregando) e
   `shared/ui/cadastro-acoes/` (rodapé Cancelar/Salvar, com slot `[extra]`
   pra ação perigosa específica — Inativar, Encerrar estadia). Usados nas 6
   telas de Manutenção (Pessoa, Quarto, Voluntário, Material, Estadia,
   Empréstimo). O `<form>` em si (campos/seções) continua em cada página —
   variam demais entre entidades pra valer a pena forçar um componente
   genérico — mas toda a moldura repetida (cabeçalho, loading, rodapé de
   ações) agora vem de um só lugar.
3. ✅ **Resolvido (2026-09-11)** — `shared/ui/pagina-consulta/` (cabeçalho,
   área de filtros, estados de carregando/erro/vazio, wrapper da tabela e
   paginação). Usado nas 6 telas de Consulta. A `<table>` em si fica em
   cada página (colunas variam por entidade), projetada dentro do shell via
   content projection.

   **Achado ao extrair:** boa parte das classes BEM (`.consulta__tabela`,
   `.cadastro__grade`, `.cadastro__acoes`, etc.) precisou ir pro
   `src/styles.scss` **global**, não para o `.scss` dos componentes de
   shell — o Angular escopa CSS pelo componente que *autora* o elemento no
   próprio template, não por onde ele acaba renderizado via content
   projection. Como o `<form>`/`<table>` de cada página continuam sendo
   autorados pela própria página (só a moldura ao redor é do shell), o
   CSS compartilhado desses elementos não tinha como viver só no `.scss`
   dos componentes novos. Também foram unificados alguns pares de classes
   antes duplicadas com nomes ligeiramente diferentes por entidade
   (`consulta__status`/`consulta__situacao` → `consulta__badge`;
   `cadastro__inativar`/`cadastro__encerrar` → `cadastro__acao-perigo`;
   `cadastro__acompanhantes`/`cadastro__itens-cabecalho` →
   `cadastro__subsecao`/`cadastro__subsecao-cabecalho`, etc.).

   Build (`ng build`) e testes (`ng test`) passando; conferido visualmente
   no navegador contra o backend real (consulta, cadastro simples, abas de
   Pessoa e Empréstimo, subseção de acompanhantes de Estadia) sem
   regressão visual.
4. ✅ **Resolvido (item 9, 2026-09-11)** — botão "Exportar CSV" em todas
   as telas de Consulta, em vez de replicar os relatórios impressos do
   Delphi.
5. ✅ **Resolvido (item 9, 2026-09-11)** — busca mestre implementada em
   `features/busca/busca.page`.

## Backlog de páginas (ordem sugerida)

Segue a mesma lógica de dependência do backend: o que desbloqueia mais
coisa primeiro.

1. ✅ **Cadastro/edição de Pessoa** — maior entidade do sistema, e
   pré-requisito pra Avaliação Social/Composição Familiar (que são abas
   dela, não telas independentes). **Implementado (2026-09-11):**
   `features/pessoas/cadastro/pessoa-cadastro.page` cobre criação e edição
   num formulário só, com combo Estado → Município em cascata (reaproveita
   os serviços de apoio de `estados`/`municipios`/`hospitais`). Testado de
   ponta a ponta contra o backend real. O gap 2 (componente de formulário
   reutilizável) **não foi extraído ainda** — o formulário de Pessoa ficou
   direto na página; extrair antes de replicar o padrão nas próximas telas
   de Manutenção.
2. ✅ **Guarda de perfil no frontend** (gap 1). **Implementado (2026-09-11):**
   `core/auth/perfil.guard.ts` (`CanActivateFn`, lê `data.perfis` da rota,
   redireciona pra `/inicio` se o perfil não bater) + `AuthService.temPerfil()`.
   `SessaoResponse` do backend ganhou o campo `perfil` (`schemas.py`,
   `service.gerar_sessao`, `router.py`); `AuthService.sessao` agora persiste a
   sessão inteira em `localStorage` (`abrigo.sessao`, não só o token) e é
   reidratada no construtor — antes disso `nome`/`perfil` sumiam a cada
   F5, só o token sobrevivia. **Achado (mais um caso de
   [[feedback-verificar-antes-de-supor]]):** `exigir_perfil("assistente_social")`
   no backend nunca batia com nenhum usuário real — o dump de produção só tem
   `perfil = 'Assistente Social'` ou `'Geral'` (com maiúscula e espaço), não
   o snake_case assumido ao implementar a feature 7. Os testes não pegavam
   porque as fixtures usavam o mesmo snake_case inventado. Corrigido nos dois
   routers (`avaliacao_social`, `composicao_familiar`) e nas fixtures de
   teste pra usar os valores reais.
3. ✅ **Avaliação Social + Composição Familiar** — abas dentro da tela de
   Pessoa, visíveis só para perfil `Assistente Social`. **Implementado
   (2026-09-11):** `features/pessoas/avaliacao-social/avaliacao-social-tab.component`
   e `.../composicao-familiar/composicao-familiar-tab.component`, injetados
   como abas (`mat-tab-group`) em `pessoa-cadastro.page` só quando
   `modoEdicao && auth.temPerfil('Assistente Social')` — em modo de criação
   as abas ficam escondidas (são sub-recurso de uma pessoa que já existe).
   Campos/opções (residência, tipo de construção, grupos Moradia/Renda/Saúde)
   espelham `untFrmManutencaoAvaliacaoSocial.dfm` do legado; Composição
   Familiar usa uma tabela editável (nome/idade/parentesco/estado civil/
   renda/ocupação) com criar/editar/excluir, espelhando a grade do legado.
   Avaliação Social não tem exclusão na UI (o backend não expõe DELETE —
   cada avaliação é um registro histórico, nunca substituído).

   **Achado técnico:** usar `input.required<number>()` pro `pessoaId` dos
   componentes de aba quebrava com `NG0950` (`mat-tab-group` cria o corpo
   de todas as abas, incluindo as inativas, então o binding não chega a
   tempo do check síncrono de input obrigatório). Trocado por
   `input<number>(0)` (não obrigatório) — as abas só existem quando
   `pessoaId` já é real (gate no pai), então o valor default nunca é usado
   de verdade.

   Testado de ponta a ponta contra o backend real: criação de avaliação
   social, criação/edição/exclusão de membro da composição familiar, e
   confirmação de que um usuário com perfil `Geral` (login `secretaria`)
   não vê as abas — só o formulário de Dados.
4. ✅ **Quartos** — pequeno, CRUD simples, pré-requisito de UX de Estadia
   (grid de leitos disponíveis). **Implementado (2026-09-11):**
   `features/quartos/consulta/quarto-consulta.page` (lista com filtro
   client-side por número/leito/descrição — sem paginação nem busca no
   servidor, a lista é pequena, ~24 quartos; toggle "Mostrar inativos") e
   `features/quartos/cadastro/quarto-cadastro.page` (criar/editar, com ação
   "Inativar" — o backend só tem inativação lógica via `DELETE`, sem
   endpoint de reativação, então a UI não oferece reativar). Rotas
   `/quartos`, `/quartos/novo`, `/quartos/:id/editar` e item de navegação
   novo em `nav-items.ts` (o legado tem botão próprio `btnQuarto` no menu
   principal — confirmado em `untMain.pas` antes de decidir dar um item de
   nav dedicado, diferente de estado/município/hospital que só existem como
   combo). Testado de ponta a ponta contra o backend real: criar, editar,
   filtrar, alternar "Mostrar inativos" e inativar (via chamada direta à
   API, mesma limitação do `confirm()` nativo já registrada no item 3).
5. ✅ **Estadias** — feature central: Manutenção com seleção de quarto,
   radio de tipo de pessoa/situação, grid de acompanhantes
   (`EstadiaAcompanhante`) e botão de encerrar. **Implementado
   (2026-09-11):** `features/estadias/consulta/estadia-consulta.page`
   (lista paginada, filtro por situação — padrão "Em acompanhamento") e
   `features/estadias/cadastro/estadia-cadastro.page` (form completo +
   seção de acompanhantes, só visível em edição). Rotas `/estadias`,
   `/estadias/novo`, `/estadias/:id/editar`.

   **Decisão de escopo:** o combo de quarto do legado tem um toggle
   "Leitos"/"Disponíveis" (`edtQuarto` em `untFrmManutencaoEstadia.dfm`) —
   o backend novo não modela ocupação de leito nenhuma (`Quarto` não tem
   contagem de vagas, `Estadia` só referencia `id_quarto`), então calcular
   "disponibilidade" exigiria uma feature nova no backend. Descartado por
   ora: o select de quarto lista todos (ativos e inativos, estes
   desabilitados) sem filtrar por ocupação — fica registrado aqui como
   gap conhecido, não implementado silenciosamente.

   **Novo componente compartilhado:** `shared/ui/pessoa-autocomplete/`
   (busca por nome/CPF com debounce, usa `PessoaService.listar({busca})`)
   — usado duas vezes nesta tela (pessoa da estadia e pessoa do
   acompanhante) e already projetado para reaproveitar no picker de
   Material de Empréstimo (item 8).

   **Backend ganhou `usuario_id` na sessão** (`SessaoResponse`,
   `auth/schemas.py` e `service.py`) — a criação de `Estadia` exige
   `id_usuario` (quem registrou) e o frontend não tinha esse dado
   disponível antes, só `nome`/`perfil`/`token`.

   **Dois bugs reais encontrados e corrigidos durante o teste end-to-end**
   (mais casos de [[feedback-verificar-antes-de-supor]] — só apareceram
   testando contra dados/fluxo reais, não no `tsc`):
   1. `PessoaAutocompleteComponent`: ao selecionar uma opção, o
      `MatAutocomplete` escreve o objeto `PessoaResumo` bruto no
      `FormControl` via `ControlValueAccessor` **antes** de disparar
      `(optionSelected)` — o pipe de busca (`texto.trim()`) quebrava com
      `TypeError` porque `texto` não era string nesse instante. Corrigido
      com guarda de tipo.
   2. `descreverErroHttp` (`core/http/api-error.ts`) só tratava
      `detail` como `string` — um 422 de validação do FastAPI/Pydantic
      manda `detail` como **lista** de `{loc, msg}`, e o código antigo
      renderizava `"[object Object]"` na tela em vez da mensagem real.
      Esse bug já existia desde a feature de Pessoa (afeta qualquer form
      do app que bata num 422), só nunca tinha aparecido porque nenhum
      teste anterior tinha forçado um erro de validação de verdade.
      Corrigido para extrair `msg` de cada item da lista.

   Testado de ponta a ponta contra o backend real: autocomplete de pessoa
   (estadia e acompanhante), seleção de quarto, criar estadia nova,
   adicionar acompanhante, encerrar estadia (`situacao` → Finalizada,
   `ativo` → false, botão "Encerrar" some da UI depois). 93 testes do
   backend continuam passando.
6. ✅ **Voluntários** — CRUD simples. **Implementado (2026-09-11):**
   `features/voluntarios/consulta/voluntario-consulta.page` e
   `.../cadastro/voluntario-cadastro.page`, mesmo padrão de Pessoa
   (busca paginada + form + inativação lógica). Rotas `/voluntarios`,
   `/voluntarios/novo`, `/voluntarios/:id/editar` — item de nav já
   existia. Sem achados de schema novos (a feature 4 do backend já tinha
   verificado os campos reais). Testado de ponta a ponta contra o backend
   real: listar, buscar, criar, editar, inativar.
7. ✅ **Materiais** — CRUD simples, pré-requisito de Empréstimos (picker de
   item — "Consulta Rápida" do legado). **Implementado (2026-09-11):**
   `features/materiais/consulta/material-consulta.page` e
   `.../cadastro/material-cadastro.page`, mesmo padrão de Pessoa/Voluntário.
   Rotas `/materiais`, `/materiais/novo`, `/materiais/:id/editar` — item de
   nav já existia.

   **`situacao` e `local` ficaram como texto livre na UI (não select)** —
   decisão deliberada, não só espelhando o model do backend (que já tinha
   documentado `situacao` como `TcxDBTextEdit`), mas confirmada de novo
   contra o dump real: apesar de existir um arquivo de constantes no legado
   (`CasaApoio.Material.Constants.pas`) com valores fixos pra `situacao`
   ('Emprestado'/'Disponível'/'Pendente'/'Renovado'/'Devolvido') e `local`
   ('Casa'/'Empréstimo'), o dado real de produção tem `local = 'Bazar'`
   também (confirmado ao editar um material real durante o teste) — um
   valor que não está nas constantes. Um `<select>` fechado teria
   escondido/quebrado esse registro real. Mais um caso de
   [[feedback-verificar-antes-de-supor]]: a existência de constantes no
   código não significa que a coluna é um enum de verdade.

   O picker "Consulta Rápida" em si (autocomplete de material pra usar
   dentro de Empréstimo) fica pro item 8, quando for realmente necessário —
   mesma lógica usada pro `pessoa-autocomplete` no item 5.

   Testado de ponta a ponta contra o backend real: listar, buscar, criar,
   editar, inativar. 93 testes do backend continuam passando (sem mudança
   de backend nesta parte).
8. ✅ **Empréstimos** — Manutenção com aba de itens (grid material + datas +
   situação/renovação), reaproveitando o picker de Material do item 7.
   **Implementado (2026-09-11):**
   `features/emprestimos/consulta/emprestimo-consulta.page` (lista
   paginada, filtro por situação) e `.../cadastro/emprestimo-cadastro.page`
   (abas Dados / Itens do empréstimo / Histórico de alteração — só em modo
   de edição, igual ao padrão de abas de Pessoa). Novo componente
   compartilhado `shared/ui/material-autocomplete/`, mesma lógica do
   `pessoa-autocomplete` (item 5), filtrando só materiais com
   `disponivel_emprestimo = true`. Rotas `/emprestimos`,
   `/emprestimos/novo`, `/emprestimos/:id/editar`. Aba "Observações" do
   legado foi dobrada dentro da aba "Dados" (é o mesmo campo `observacao`
   do Empréstimo — só decisão de UI, sem perda de funcionalidade).

   **Achado que virou trabalho de backend:** ao ler a tela de manutenção do
   legado, apareceu um script `Criar tabela emprestimo_historico.sql`
   (2026-09-09, mesmo autor do usuário) criando uma trilha de auditoria de
   alterações do empréstimo — tabela que **não existe no dump de produção**
   usado na migração original (foi criada no legado depois do dump).
   Perguntei ao usuário se implementava agora ou deixava documentado como
   gap; escolheu implementar. Backend ganhou `EmprestimoHistorico`
   (migração `0010`), registrado automaticamente (nunca escrito direto
   pelo cliente) em `service.py` — replica a lógica exata do legado
   (`untDtmManutencaoEmprestimo.pas`): criar empréstimo → "Inclusão";
   mudar observação → "Alteração" (só o trecho novo se a observação
   cresceu por acréscimo, "de X para Y" se foi substituição total; nada se
   não mudou); incluir/editar item → "Item incluído"/"Item alterado" com a
   descrição do material formatada igual ao legado. Ver
   `abrigo-backend/app/features/emprestimos/emprestimo.legacy.md` pra
   detalhes completos. 7 testes novos no backend (100 no total).

   **Gap conhecido, não implementado:** o legado também sincroniza
   `Material.situacao` automaticamente a cada item incluído/editado/
   removido (ex.: material vira "Emprestado" quando um item é criado) — o
   backend novo não replica esse side-effect ainda. Só histórico foi
   pedido nesta rodada; registrado no `emprestimo.legacy.md` do backend
   pra decidir depois.

   Testado de ponta a ponta contra o backend real e o Postgres local: abrir
   empréstimo real com observação longa, ver item real carregado, editar
   observação por acréscimo e confirmar que o histórico registrou só o
   trecho novo, adicionar item novo via autocomplete de material (filtrado
   a "disponível para empréstimo") e confirmar o registro "Item incluído"
   no histórico, criar empréstimo novo do zero e confirmar "Inclusão"
   automática mostrando o nome do usuário logado.
9. ✅ **Relatórios / exportação** e **busca mestre** — depois de tudo acima
   ter tela própria (gaps 4 e 5). **Implementado (2026-09-11):**
   - **Busca mestre** (`features/busca/busca.page`, rota `/busca` — a
     barra de busca do topo já apontava pra lá desde o início, era só
     placeholder): busca em paralelo por Pessoas e Materiais (têm `busca`
     no backend) e Voluntários (idem); Estadias não tem busca por texto no
     backend (`EstadiaResumoResponse` não expõe nome da pessoa, e o
     endpoint só filtra por `id_pessoa`/`situacao`) — resolvido buscando
     as pessoas primeiro e usando `id_pessoa` pra achar as estadias
     delas (até 5 pessoas, pra não estourar de requisições). Reage a
     nova busca feita pela barra do topo mesmo já estando em `/busca`
     (assina `queryParamMap`, não só o snapshot inicial — o Angular
     reaproveita o componente na mesma rota). Cada resultado linka pra
     tela de edição correspondente.
   - **Exportação CSV**: em vez de replicar os relatórios impressos do
     Delphi (gap 4 já sugeria isso), botão "Exportar CSV" em todas as 6
     telas de Consulta (Pessoas, Quartos, Estadias, Voluntários,
     Materiais, Empréstimos), via util compartilhado
     `shared/util/csv.ts` (`exportarCsv`, com BOM UTF-8 pra abrir certo
     no Excel em pt-BR). Exporta o resultado completo do filtro atual
     (até 2000-5000 registros, não só a página visível). **CPF mascarado
     no export de Pessoas** — mesma regra de minimização de LGPD da tela
     de consulta (`mascararCpf`), porque um CSV é mais fácil de
     compartilhar/perder do que a tela.

   Testado contra o backend real: busca mestre com resultados reais nas 4
   seções (inclusive clicando um resultado e chegando na tela de edição
   certa) e reagindo a nova busca pela barra do topo sem sair da página;
   exportação de CSV verificada lendo o `Blob` gerado (não só disparando o
   download) — conteúdo, cabeçalhos e mascaramento de CPF confirmados.

## Referências

- Inventário de tabelas/FKs do banco real: `abrigo-backend/docs/atividades.md`
- Decisões de schema por entidade: `abrigo-backend/app/features/*/*.legacy.md`
- Padrão de arquivos por rotina (dto/mapper/model/service/page): README deste
  repositório
