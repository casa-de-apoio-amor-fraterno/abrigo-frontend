# Abrigo — Frontend

Frontend Angular do sistema de gestão da **Casa de Apoio Amor Fraterno**.

> **Este é um projeto de uma organização sem fins lucrativos (ONG).** O
> código é aberto para que voluntários e desenvolvedores da comunidade
> possam contribuir gratuitamente com a manutenção e evolução do sistema
> usado pela instituição. Nenhuma receita é gerada a partir deste software;
> contribuições de código são bem-vindas via *pull request*.

## Contexto

Este projeto substitui o **abrigo-legacy** ("Argos — Controle de
Atendimento"), um sistema desktop em Delphi com banco MySQL usado hoje pela
Casa de Apoio Amor Fraterno para controlar atendimentos, estadias,
voluntários, empréstimos de materiais e acompanhamento social de pessoas
atendidas. A migração tem como objetivo levar o sistema para a web, mantendo
as mesmas regras de negócio e permitindo acesso remoto por múltiplos
usuários.

O backend consumido por este frontend é o [`abrigo-backend`](https://github.com/casa-de-apoio-amor-fraterno/abrigo-backend), escrito em Python (FastAPI).

## Tecnologias

- Angular (standalone components, sem NgModules)
- Angular Material + CDK
- TypeScript strict
- SCSS
- Angular Signals (estado local) + RxJS (HTTP/streams)
- Vitest (testes)

## Estrutura

```txt
src/
├── app/
│   ├── core/
│   │   ├── http/          -> interceptor de erro HTTP, tipos de erro de API
│   │   ├── layout/        -> shell visual (header, menu)
│   │   └── services/      -> serviços singleton globais
│   │
│   ├── features/
│   │   {area-de-negocio}/{modulo}/{rotina}/
│   │
│   ├── shared/
│   │   └── ui/            -> componentes reutilizáveis sem regra de negócio
│   │
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
│
├── environments/
└── styles.scss
```

Cada `feature` representa uma área de negócio do abrigo. Dentro de cada área,
os módulos agrupam rotinas relacionadas; a rotina é a menor unidade de
trabalho (uma tela ou fluxo).

### Mapeamento do sistema legado (Delphi) para as áreas do novo sistema

| Unit Delphi (`fonte/Unt/...`) | Área proposta no Angular (`features/...`) |
| --- | --- |
| `Pessoa` (cadastro, avaliação social, composição familiar) | `atendimento/pessoas/` |
| `Voluntario` | `atendimento/voluntarios/` |
| `Estadia` | `atendimento/estadias/` |
| `Emprestimo` | `patrimonio/emprestimos/` |
| `Material` | `patrimonio/materiais/` |
| `Procedimento` / `ProcedimentoRealizado` | `atendimento/procedimentos/` |
| `Acompanhamento` | `atendimento/acompanhamentos/` |
| `Hospital` / `Municipio` / `Estado` | `cadastros-base/` (domínios de apoio) |
| `Quarto` / `Disponibilidade` | `patrimonio/quartos/` |
| `Usuario` | `administracao/usuarios/` |

Essa divisão é um ponto de partida — ajuste conforme o domínio real for
detalhado durante a migração.

### Componentes compartilhados (`shared/ui`)

Sem regra de negócio — só estrutura/visual reaproveitada entre features.
Antes de criar um componente novo (ou duplicar markup entre páginas),
confira se já existe algo aqui:

| Componente | Uso |
| --- | --- |
| `acao-popover` | Popover fixo no canto inferior direito pra uma ação rápida sobre um item de lista sem sair da tela/lista (ex.: "Finalizar estadia" e "Devolver empréstimo" na busca global, "Finalizar estadia" ao clicar num leito na tela Início). Só a casca (ícone + título/subtítulo + Cancelar/Confirmar) é genérica — o campo do formulário é projetado via `<ng-content>`. |
| `pagina-consulta` | Casca comum das telas de Consulta: cabeçalho, área de filtros, estados de carregando/erro/vazio, wrapper da tabela e paginação. |
| `filtro-pills` | Filtro de situação em pills segmentados (substitui `mat-select` quando são só 3-4 opções fixas — empréstimos, estadias, solicitações de cadastro). |
| `detalhe-dialog` | Dialog de "visualizar" um item de lista (campos rótulo/valor + link Editar), com foto opcional à direita. |
| `cadastro-dialog-shell` + `cadastro-dialog-host` | Casca comum dos formulários de Cadastro abertos como popup/drawer à direita (`cadastro-dialog-host` é a base que abre o popup a partir da rota). |
| `cadastro-acoes` | Rodapé padrão de formulário de Cadastro (Cancelar/Salvar + slot pra ação perigosa tipo Inativar). |
| `captura-foto` | Captura de foto pela webcam do navegador — usado no cadastro de Pessoa e no auto-cadastro público de paciente. |
| `contatos-tab` | Lista de contatos (telefone) reaproveitada em Pessoa e Voluntário. |
| `pessoa-autocomplete` / `material-autocomplete` | Campo de busca com autocomplete de Pessoa/Material, usado nos pickers de Estadia/Empréstimo. |
| `placeholder-page` | Placeholder "em desenvolvimento" pra rotas ainda não implementadas. |

### Inventário de migração (`.legacy.md`)

Cada rotina migrada deve registrar sua origem em um `.legacy.md` ao lado dos
arquivos da rotina (ex.: `features/atendimento/pessoas/pessoa/pessoa.legacy.md`),
citando a unit Delphi de origem, as regras de negócio identificadas e o
status da migração (Mapeado | Em migração | Migrado | Validado).

## Convenções de nomes

```txt
pessoa.page.ts / .html / .scss / .spec.ts
pessoa-form.component.ts
pessoa.service.ts
pessoa.dto.ts        <- shape do payload retornado pela API
pessoa.mapper.ts      <- DTO (API) -> Model (tela)
pessoa.model.ts
pessoa.legacy.md
```

- kebab-case, sufixo por tipo de arquivo.
- Nomes de domínio em português.
- `core` não depende de `features`; `shared` não contém regra de negócio;
  chamadas HTTP ficam em `services`, nunca em componentes.

## Instalação e execução local

### Pré-requisitos

- **Node.js 20+** (o projeto foi criado com Angular CLI 21, que exige
  Node.js 20.19+ ou 22.12+) e **npm**
- Git
- O [`abrigo-backend`](https://github.com/casa-de-apoio-amor-fraterno/abrigo-backend)
  rodando localmente em `http://localhost:8000` (siga o README de lá primeiro
  — sem ele, a tela de login não consegue autenticar e as demais telas não
  carregam dados)

### Passo a passo

```bash
git clone https://github.com/casa-de-apoio-amor-fraterno/abrigo-frontend.git
cd abrigo-frontend

npm install
npm start
```

A aplicação sobe em `http://localhost:4200` e proxya chamadas `/api` para o
backend em `http://localhost:8000` (ver `proxy.conf.json`) — não precisa
configurar nada além de ter o backend rodando nessa porta.

Abra `http://localhost:4200` no navegador. A tela de login pede usuário e
senha de um usuário já criado no backend (ver a seção de instalação do
`abrigo-backend` — `python -m app.scripts.criar_usuario`).

### Testes e build

```bash
npm test        # testes com Vitest
npm run build   # build de produção (saída em dist/)
```

## Licença

[MIT](LICENSE).
