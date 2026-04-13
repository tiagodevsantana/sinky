# Desafio Técnico — QA Engineer | Sinky

**Candidato:** Tiago Santana
**Data de entrega:** 13 abr 2026
**Aplicação avaliada:** Smart To-Do List (Next.js + NestJS + SQLite + IA via OpenRouter)

---

## Visão Geral

Este repositório contém todos os entregáveis do desafio técnico para a vaga de **QA Engineer** na Sinky. A estrutura completa é:

```
/
├── app/                    # Aplicação original fornecida (não modificada)
│   ├── backend/            # API NestJS (porta 3001)
│   ├── frontend/           # Next.js 14 (porta 3000)
│   └── docker-compose.yml
├── e2e/                    # Suíte de testes E2E (Playwright + TypeScript)
│   ├── pages/              # Page Objects (POM)
│   ├── fixtures/           # Fixtures customizados com setup/teardown via API
│   ├── mock-server/        # Servidor mock (alternativa ao Docker)
│   ├── tests/              # Arquivos de spec
│   └── playwright.config.ts
├── .github/
│   └── workflows/
│       └── e2e.yml         # Pipeline CI/CD (GitHub Actions)
├── PRD-REVIEW.md           # Revisão do documento de requisitos (11 issues)
├── BUG-REPORT.md           # Relatório de bugs (BUG-001 a BUG-015)
└── TEST-STRATEGY.md        # Estratégia de testes: análise de risco + pirâmide
```

---

## Entregáveis

### 1. PRD-REVIEW.md
Revisão do Product Requirements Document com **11 issues identificadas**: requisitos ausentes, critérios de aceitação incompletos e ambiguidades que, se não tratadas, levam diretamente a bugs em produção.

### 2. BUG-REPORT.md
Relatório completo com **15 bugs documentados** (BUG-001 a BUG-015), cada um contendo: severidade, prioridade, componente afetado, passos para reproduzir, resultado esperado vs. obtido, evidência de código e sugestão de correção.

**Bugs críticos:**
| ID | Severidade | Descrição |
|---|---|---|
| BUG-001 | Crítica | Toggle de conclusão não chama a API — estado não persiste após reload |
| BUG-003 | Alta | Falha na geração por IA é silenciosa — nenhum feedback ao usuário |
| BUG-015 | Alta | API Key transmitida em plaintext no corpo da requisição HTTP |

### 3. TEST-STRATEGY.md
Estratégia de testes baseada em análise de risco, pirâmide de testes (unitário 60% / integração 30% / E2E 10%) e proposta de processo (shift-left, DoR, DoD, CI/CD).

### 4. e2e/
Suíte Playwright completa com:
- **5 specs principais:** criação, conclusão, exclusão, estado vazio, tratamento de erros
- **2 specs bônus:** contratos de API (`api-contracts.spec.ts`) e acessibilidade (`accessibility.spec.ts`)
- **Page Object Model** com 3 POMs: `TaskListPage`, `TaskFormPage`, `AiGeneratorPage`
- **Fixtures customizados** com setup/teardown via API para isolamento de estado
- **Mock server** Node.js nativo para rodar sem Docker

### 5. CI/CD — GitHub Actions
Pipeline automatizado em `.github/workflows/e2e.yml` que executa a suíte completa a cada push/PR na branch `main`.

### 6. Allure Dashboard
Relatório visual com histórico de execuções publicado automaticamente no GitHub Pages após cada run do CI.

---

## Bugs Conhecidos que Causam Falhas nos Testes

Os testes abaixo **falham intencionalmente** — eles documentam bugs conhecidos e passarão automaticamente quando os bugs forem corrigidos (funcionam como testes de regressão):

| Arquivo de Spec | Bug | Descrição |
|---|---|---|
| `task-completion.spec.ts` | BUG-001 | Toggle não persiste após reload |
| `task-creation.spec.ts` | BUG-002 | Títulos só com espaços são aceitos |
| `error-handling.spec.ts` | BUG-003 | Erro de IA sem feedback na UI |
| `api-contracts.spec.ts` | BUG-004 | DELETE de ID inexistente retorna 204 |
| `empty-state.spec.ts` | BUG-012 | Sem estado vazio na UI |
| `error-handling.spec.ts` | BUG-010 | Botão não é desabilitado durante loading |
| `accessibility.spec.ts` | BUG-013 | Botão de exclusão sem aria-label |
| `api-contracts.spec.ts` | BUG-007 | `isCompleted` aceita valores não-booleanos |
| `api-contracts.spec.ts` | BUG-011 | Sem limite máximo de tamanho no título |

---

## Pré-requisitos

- **Node.js 18+** (para rodar os testes E2E e o mock server)
- **Docker + Docker Compose** (forma recomendada para subir a aplicação)
- **Git** (para clonar o repositório)

---

## Como Rodar a Aplicação

Os testes E2E precisam da aplicação rodando. Há duas formas: com Docker (recomendado) ou com o mock server Node.js (mais leve, sem banco real).

### Opção A — Docker (recomendado, usa o backend real)

```bash
# A partir da raiz do repositório
cd app
docker compose up --build -d

# Aguarde até os containers estarem saudáveis (~1-2 minutos na primeira vez)
# Para acompanhar os logs:
docker compose logs -f
```

Quando estiver pronto, você verá a mensagem `"Backend rodando em http://localhost:3001"`.

| Serviço | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (NestJS) | http://localhost:3001 |
| Swagger (docs da API) | http://localhost:3001/api/docs |

Para parar a aplicação:
```bash
docker compose down          # Para os containers (mantém os dados)
docker compose down -v       # Para os containers e apaga o banco
```

### Opção B — Mock Server Node.js (sem Docker, sem banco real)

Esta opção sobe um servidor mock em memória que simula o backend NestJS. Os dados são perdidos ao reiniciar o processo. Útil para CI/CD ou ambientes sem Docker.

**Terminal 1 — Mock API (substitui o backend NestJS):**
```bash
# A partir da raiz do repositório
node e2e/mock-server/server.js
# Saída esperada: "Mock API server running at http://localhost:3001"
```

**Terminal 2 — Frontend Next.js:**
```bash
cd app/frontend
npm install

# Build com a URL da API apontando para o mock
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run build

# Copiar arquivos estáticos para o diretório standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Iniciar o servidor (usar standalone — "npm start" não funciona com output: standalone)
PORT=3000 node .next/standalone/server.js
# Saída esperada: servidor rodando em http://localhost:3000
```

> **Atenção (Windows):** No PowerShell/CMD, substitua a sintaxe de variável de ambiente:
> ```powershell
> # PowerShell
> $env:NEXT_PUBLIC_API_URL="http://localhost:3001"; npm run build
> $env:PORT="3000"; node .next/standalone/server.js
> ```

---

## Como Instalar e Configurar os Testes E2E

Com a aplicação já rodando (qualquer uma das opções acima):

```bash
# Entrar no diretório dos testes
cd e2e

# Instalar dependências (Playwright, axe-core, TypeScript)
npm install

# Instalar os browsers que o Playwright usa (Chromium, por padrão)
npx playwright install --with-deps
```

> A flag `--with-deps` instala também as dependências de sistema (ffmpeg, libs de sistema) necessárias para os browsers. Em Linux/CI é obrigatória. Em macOS/Windows pode não ser necessária mas não causa problemas.

---

## Como Executar os Testes

Todos os comandos abaixo devem ser executados **dentro da pasta `e2e/`**.

### Rodar a suíte completa (modo headless)

```bash
npx playwright test
```

Executa todos os 7 arquivos de spec em modo headless (sem abrir o browser). Ao final, exibe um resumo no terminal com o número de testes passados, falhados e ignorados.

### Rodar com o browser visível

```bash
npx playwright test --headed
```

Abre o Chromium e executa os testes com o browser visível em tempo real. Útil para debugar e entender o fluxo da aplicação.

### Rodar em modo interativo (UI do Playwright)

```bash
npx playwright test --ui
```

Abre a interface gráfica do Playwright Test UI. Permite:
- Ver cada teste na árvore lateral
- Assistir a execução passo a passo com screenshots
- Inspecionar traces, logs e timeline
- Reexecutar testes individualmente

> Esta é a forma mais recomendada para explorar e debugar a suíte.

### Rodar um arquivo de spec específico

```bash
# Apenas testes de criação de tarefa
npx playwright test tests/task-creation.spec.ts

# Apenas testes de conclusão (inclui o que documenta o BUG-001)
npx playwright test tests/task-completion.spec.ts

# Apenas testes de exclusão
npx playwright test tests/task-deletion.spec.ts

# Apenas estado vazio (documenta o BUG-012)
npx playwright test tests/empty-state.spec.ts

# Apenas tratamento de erros via API mock (documenta BUG-003, BUG-010)
npx playwright test tests/error-handling.spec.ts

# [Bônus B1] Contratos de API (documenta BUG-004, BUG-007, BUG-011)
npx playwright test tests/api-contracts.spec.ts

# [Bônus B3] Auditoria de acessibilidade com axe-core (documenta BUG-013)
npx playwright test tests/accessibility.spec.ts
```

### Rodar um teste específico pelo nome

```bash
# Passa uma string que é comparada contra o título do test/describe
npx playwright test --grep "persists completion state after page reload"
```

### Ver o relatório HTML após a execução

```bash
npx playwright show-report
```

Abre o relatório HTML no browser. O relatório mostra cada teste com status, duração, screenshots (apenas em falhas) e vídeo (retido em falhas). Fica disponível em `e2e/playwright-report/`.

### Atalhos via npm scripts

```bash
npm test           # Equivalente a npx playwright test
npm run test:headed  # Equivalente a npx playwright test --headed
npm run test:ui    # Equivalente a npx playwright test --ui
npm run report     # Equivalente a npx playwright show-report
```

---

## Variáveis de Ambiente dos Testes

| Variável | Padrão | Descrição |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | URL do frontend (Next.js) |
| `API_URL` | `http://localhost:3001` | URL do backend (NestJS ou mock server) |

Para usar URLs diferentes do padrão:

```bash
# Bash/macOS/Linux
BASE_URL=http://staging.example.com API_URL=http://api.staging.example.com npx playwright test

# PowerShell (Windows)
$env:BASE_URL="http://staging.example.com"; $env:API_URL="http://api.staging.example.com"; npx playwright test
```

---

## Estrutura dos Testes em Detalhe

```
e2e/
├── pages/
│   ├── TaskListPage.ts       # POM: lista de tarefas (seletores e ações da lista)
│   ├── TaskFormPage.ts       # POM: formulário de criação manual
│   └── AiGeneratorPage.ts    # POM: seção de gerador de tarefas por IA
├── fixtures/
│   └── tasks.fixture.ts      # Fixture estendido: POMs + createTaskViaApi + cleanupTasks
├── mock-server/
│   └── server.js             # Servidor HTTP Node.js que simula o backend NestJS
├── tests/
│   ├── task-creation.spec.ts   # Happy path + edge cases de validação de título
│   ├── task-completion.spec.ts # Toggle de conclusão + persistência após reload (BUG-001)
│   ├── task-deletion.spec.ts   # Exclusão e verificação de ausência na lista
│   ├── empty-state.spec.ts     # UI quando não há tarefas (BUG-012)
│   ├── error-handling.spec.ts  # Cenários de erro via page.route() (BUG-003, BUG-010)
│   ├── api-contracts.spec.ts   # [B1] Contratos de schema da API (BUG-004, BUG-007, BUG-011)
│   └── accessibility.spec.ts   # [B3] Auditoria de acessibilidade com axe-core (BUG-013)
├── playwright.config.ts        # Configuração: baseURL, retries, reporter, projetos
├── package.json
└── README.md                   # Documentação detalhada da suíte E2E
```

### Decisões de design

**Page Object Model (POM):** cada página/componente principal tem seu próprio POM em `pages/`. Os POMs encapsulam seletores e ações, mantendo os specs legíveis e facilitando manutenção quando os seletores mudam.

**Seletores:** priorizam `data-testid` (já presentes no código da aplicação), seguidos de `role` e `aria-label`. XPath e seletores CSS frágeis são evitados.

**Isolamento de estado:** cada teste cria e limpa seu próprio estado. O fixture `cleanupTasks` deleta todas as tarefas via API no `beforeEach`. O fixture `createTaskViaApi` cria tarefas via API (mais rápido e confiável que via UI) e registra os IDs para limpeza automática no teardown.

**Testes como documentação de bugs:** testes marcados com `// BUG-XXX: This test is expected to FAIL` documentam comportamentos incorretos da aplicação atual. Eles passarão automaticamente quando os bugs forem corrigidos, servindo como testes de regressão.

---

## Configuração do Playwright

O arquivo `playwright.config.ts` usa as seguintes configurações relevantes:

| Configuração | Valor | Motivo |
|---|---|---|
| `fullyParallel` | `false` | Os testes compartilham o mesmo banco — serialização evita conflitos de estado |
| `workers` | `1` | Reforça a execução serial |
| `retries` | `2` em CI, `0` local | Absorve flakiness pontual em CI sem mascarar falhas reais localmente |
| `reporter` | `html` + `list` + `allure-playwright` | Relatório HTML, output no terminal e dados para o Allure dashboard |
| `trace` | `on-first-retry` | Trace capturado automaticamente na primeira retry para facilitar diagnóstico |
| `screenshot` | `only-on-failure` | Screenshots automáticos apenas em falhas |
| `video` | `retain-on-failure` | Vídeo retido apenas em falhas para economizar espaço |

---

## CI/CD — GitHub Actions

O workflow `.github/workflows/e2e.yml` é disparado automaticamente a cada `push` ou `pull_request` na branch `main`.

**O que o pipeline faz:**

| Etapa | Descrição |
|---|---|
| Mock API server | Sobe `e2e/mock-server/server.js` em background (porta 3001) |
| Build frontend | `npm ci` + `npm run build` com `NEXT_PUBLIC_API_URL` apontando para o mock |
| Start frontend | Servidor standalone Next.js na porta 3000 |
| Wait for servers | Aguarda os dois serviços responderem antes de iniciar os testes |
| Playwright | Instala Chromium + executa os 7 specs com `CI=true` (2 retries automáticos) |
| Allure report | Gera o relatório com histórico e publica no GitHub Pages |
| Upload artifact | Sobe o relatório HTML do Playwright como artefato por 30 dias |

---

## Allure Dashboard

O Allure Dashboard é publicado automaticamente no GitHub Pages após cada execução do CI.

**URL do dashboard:** `https://tiagodevsantana.github.io/sinky/`

**Para ativar (primeira vez):**
1. Acesse **Settings → Pages** no repositório
2. Em **Source**, selecione `Deploy from a branch`
3. Branch: `gh-pages` → pasta `/ (root)`
4. Salve — após o próximo run do CI o dashboard estará disponível

**O que o dashboard exibe:**
- Status geral da última execução (passou / falhou / ignorado)
- Histórico das últimas 20 execuções com trend de estabilidade
- Gráficos de duração e distribuição por categoria
- Detalhes de cada teste com steps, screenshots e traces

---

## Resultado Esperado ao Executar os Testes

Com a aplicação original (sem correções), a execução produz um resultado misto intencional:

- **Testes que passam:** criação básica de tarefa, exclusão, testes de contrato para cenários válidos, parte dos testes de erro
- **Testes que falham (documentando bugs):** persistência de conclusão (BUG-001), validação de espaços (BUG-002), feedback de erro de IA (BUG-003), contratos de API com dados inválidos (BUG-004, BUG-007, BUG-011), estado vazio (BUG-012), acessibilidade (BUG-013)

Esse resultado é esperado e está documentado. Cada falha aponta diretamente para um bug no `BUG-REPORT.md`.
