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

## Desenvolvimento

```bash
npm install
npm start
```

A aplicação sobe em `http://localhost:4200` e proxya chamadas `/api` para o
backend em `http://localhost:8000` (ver `proxy.conf.json`).

```bash
npm run build   # build de produção
npm test        # testes com Vitest
```

## Licença

[MIT](LICENSE).
