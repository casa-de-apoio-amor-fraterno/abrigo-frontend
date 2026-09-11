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
| `Pessoa` | Consulta, Manutenção (com sub-abas: Avaliação Social, Composição Familiar, Observações, Histórico de alteração), Relatório | ✅ Consulta (`features/pessoas/consulta/`). ❌ Manutenção (cadastro/edição) e sub-abas. ❌ Relatório |
| `Usuario` | Login, Manutenção, Alterar Senha, Consulta | ✅ Login. ❌ Manutenção (decisão: gestão de usuário fica por CLI — `app/scripts/criar_usuario.py` no backend — não por UI, ver `abrigo-backend/README.md`) |
| `Estado`/`Municipio`/`Hospital` | Sem tela própria no legado (só usados como combo em `Pessoa`) | ❌ Sem UI própria — vão aparecer como `<select>` no formulário de `Pessoa` quando ele existir. Serviços de apoio já existem (`features/estados/`, `.../municipios/`, `.../hospitais/`) |
| `Quarto` | Consulta, Manutenção | ❌ Nenhuma tela ainda. Serviço de apoio já existe (`features/quartos/`) — usado tanto numa tela própria de cadastro quanto como combo/grid de "leitos disponíveis" dentro de `Estadia` |
| `Estadia` | Consulta, Manutenção (grid de leitos disponíveis + grid de acompanhantes), Consulta com Foto, Relatório | ❌ Rota placeholder (`app.routes.ts`). Serviço de apoio já existe (`features/estadias/`) |
| `Voluntario` | Consulta, Manutenção | ❌ Rota placeholder. Serviço de apoio já existe (`features/voluntarios/`) |
| `Material` | Consulta, Manutenção, Consulta Rápida (usada dentro do picker de item de empréstimo), Relatório | ❌ Rota placeholder. Serviço de apoio já existe (`features/materiais/`) |
| `Emprestimo` | Consulta, Manutenção (dados + aba de itens do empréstimo + aba Observações + aba Histórico), Relatório | ❌ Rota placeholder. Serviço de apoio já existe (`features/emprestimos/`) |
| `Disponibilidade`, `Procedimento`/`ProcedimentoRealizado` | Existem no legado, mas **0 registros em produção** | ⏸️ Deliberadamente fora do escopo por enquanto (decisão espelhada do backend) |

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
2. **Sem componente de formulário reutilizável ainda.** Todas as telas de
   Manutenção que faltam construir têm formulários parecidos (campos +
   validação + salvar/cancelar). Vale extrair um padrão comum
   (`shared/ui/`) antes de replicar a mesma estrutura 6+ vezes.
3. **Sem componente de tabela/grid reutilizável.** A tela de consulta de
   `Pessoa` (`pessoa-consulta.page.ts`) tem uma tabela HTML simples com
   paginação manual, escrita direto na página — vale extrair antes de
   copiar esse padrão para `Estadia`, `Voluntario`, `Material`, `Emprestimo`
   (todas vão precisar da mesma busca + tabela + paginação).
4. **Relatórios do legado (PDF/impressão) não têm equivalente definido
   ainda.** Deixar pra depois das telas de cadastro/consulta — pode virar
   export CSV/XLSX em vez de replicar o relatório impresso do Delphi (mais
   simples de implementar e mais útil num sistema web).
5. **Busca mestre (`/busca`, barra superior) ainda é placeholder.** Só faz
   sentido implementar de verdade depois que pelo menos `Pessoa` e
   `Estadia` tiverem telas de detalhe pra onde os resultados possam
   apontar.

## Backlog de páginas (ordem sugerida)

Segue a mesma lógica de dependência do backend: o que desbloqueia mais
coisa primeiro.

1. **Cadastro/edição de Pessoa** — maior entidade do sistema, e
   pré-requisito pra Avaliação Social/Composição Familiar (que são abas
   dela, não telas independentes). Extrair aqui os componentes
   reutilizáveis de formulário (gap 2).
2. **Guarda de perfil no frontend** (gap 1) — antes de expor Avaliação
   Social/Composição Familiar.
3. **Avaliação Social + Composição Familiar** — abas dentro da tela de
   Pessoa, visíveis só para perfil `assistente_social`.
4. **Quartos** — pequeno, CRUD simples, pré-requisito de UX de Estadia
   (grid de leitos disponíveis).
5. **Estadias** — feature central: Manutenção com seleção de quarto
   disponível, radio de tipo de pessoa/situação, grid de acompanhantes
   (`EstadiaAcompanhante`) e botão de encerrar (usa
   `POST /api/estadias/{id}/encerrar`, já pronto no backend).
6. **Voluntários** — CRUD simples.
7. **Materiais** — CRUD simples, pré-requisito de Empréstimos (picker de
   item — "Consulta Rápida" do legado).
8. **Empréstimos** — Manutenção com aba de itens (grid material + datas +
   situação/renovação), reaproveitando o picker de Material do item 7.
9. **Relatórios / exportação** e **busca mestre** — depois de tudo acima
   ter tela própria (gaps 4 e 5).

## Referências

- Inventário de tabelas/FKs do banco real: `abrigo-backend/docs/atividades.md`
- Decisões de schema por entidade: `abrigo-backend/app/features/*/*.legacy.md`
- Padrão de arquivos por rotina (dto/mapper/model/service/page): README deste
  repositório
