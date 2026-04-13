# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empty-state.spec.ts >> Estado Vazio >> estado vazio desaparece após criar a primeira tarefa
- Location: tests/empty-state.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('empty-state')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('empty-state')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "Smart To-Do" [level=1] [ref=e5]
        - paragraph [ref=e6]: Powered by Sinky
      - generic [ref=e7]: 0 tarefas
    - generic [ref=e8]:
      - heading "Gerar tarefas com IA" [level=2] [ref=e9]
      - paragraph [ref=e10]: Descreva um objetivo e a IA irá decompô-lo em subtarefas acionáveis.
      - textbox "Sua API Key do OpenRouter (sk-or-v1-...)" [ref=e11]
      - generic [ref=e12]:
        - 'textbox "Ex: Lançar um novo produto de software" [ref=e13]'
        - button "Gerar tarefas" [ref=e14] [cursor=pointer]
    - generic [ref=e16]:
      - textbox "Adicionar nova tarefa..." [ref=e17]
      - button "Adicionar" [ref=e18] [cursor=pointer]
    - list
  - alert [ref=e19]
```

# Test source

```ts
  1  | import { test, expect } from '../fixtures/tasks.fixture';
  2  | 
  3  | test.describe('Estado Vazio', () => {
  4  |   test.beforeEach(async ({ cleanupTasks }) => {
  5  |     // Garante que nenhuma tarefa existe antes de cada teste
  6  |     await cleanupTasks();
  7  |   });
  8  | 
  9  |   test('exibe o container da lista quando não há tarefas', async ({
  10 |     page,
  11 |     taskListPage,
  12 |   }) => {
  13 |     await page.goto('/');
  14 |     await taskListPage.waitForLoaded();
  15 | 
  16 |     // Usa toBeAttached pois uma <ul> vazia tem altura zero e Playwright
  17 |     // a considera "hidden" — comportamento relacionado ao BUG-012
  18 |     await expect(taskListPage.list).toBeAttached();
  19 |     await expect(taskListPage.items()).toHaveCount(0);
  20 |   });
  21 | 
  22 |   test('exibe zero no contador de tarefas quando não há tarefas', async ({
  23 |     page,
  24 |     taskListPage,
  25 |   }) => {
  26 |     await page.goto('/');
  27 |     await taskListPage.waitForLoaded();
  28 | 
  29 |     await expect(taskListPage.taskCount).toContainText('0');
  30 |   });
  31 | 
  32 |   test('exibe mensagem de estado vazio quando não há tarefas', async ({
  33 |     page,
  34 |     taskListPage,
  35 |   }) => {
  36 |     // BUG-012: Este teste deve FALHAR com a implementação atual.
  37 |     // A aplicação renderiza uma <ul> vazia sem nenhuma mensagem ou call-to-action.
  38 |     await page.goto('/');
  39 |     await taskListPage.waitForLoaded();
  40 | 
  41 |     await expect(taskListPage.items()).toHaveCount(0);
  42 | 
  43 |     // Espera algum elemento de estado vazio
  44 |     const estadoVazio = page.getByTestId('empty-state');
  45 |     await expect(estadoVazio).toBeVisible();
  46 |   });
  47 | 
  48 |   test('estado vazio desaparece após criar a primeira tarefa', async ({
  49 |     page,
  50 |     taskFormPage,
  51 |     taskListPage,
  52 |   }) => {
  53 |     // BUG-012: Também deve FALHAR — não existe elemento de estado vazio.
  54 |     await page.goto('/');
  55 |     await taskListPage.waitForLoaded();
  56 | 
  57 |     // Verifica que o estado vazio está visível
> 58 |     await expect(page.getByTestId('empty-state')).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  59 | 
  60 |     // Cria uma tarefa
  61 |     await taskFormPage.createTask(`Primeira tarefa ${Date.now()}`);
  62 | 
  63 |     // Estado vazio deve sumir
  64 |     await expect(page.getByTestId('empty-state')).not.toBeVisible();
  65 |     await expect(taskListPage.items()).toHaveCount(1);
  66 |   });
  67 | 
  68 |   test('gerador de IA e formulário de tarefa estão visíveis no estado vazio', async ({
  69 |     page,
  70 |     aiGeneratorPage,
  71 |     taskFormPage,
  72 |   }) => {
  73 |     await page.goto('/');
  74 | 
  75 |     await expect(aiGeneratorPage.container).toBeVisible();
  76 |     await expect(taskFormPage.form).toBeVisible();
  77 |   });
  78 | 
  79 |   test('indicador de carregamento é exibido durante o carregamento inicial', async ({
  80 |     page,
  81 |     taskListPage,
  82 |   }) => {
  83 |     await page.goto('/');
  84 |     // Após o carregamento concluir, o indicador deve estar oculto
  85 |     await taskListPage.waitForLoaded();
  86 |     await expect(taskListPage.loadingIndicator).not.toBeVisible();
  87 |   });
  88 | });
  89 | 
```