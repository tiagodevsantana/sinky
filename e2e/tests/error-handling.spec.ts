import { test, expect } from '../fixtures/tasks.fixture';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

test.describe('Tratamento de Erros', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    await cleanupTasks();
  });

  test.describe('API indisponível (GET /tasks falha)', () => {
    test('exibe mensagem de erro ou lista vazia quando a API está fora do ar', async ({ page }) => {
      // NOVO BUG DESCOBERTO: Quando GET /tasks retorna 500, o React lança uma rejeição
      // de Promise não tratada (fetchTasks não tem bloco catch). Sem um ErrorBoundary,
      // toda a árvore de componentes é desmontada, deixando a página em branco.
      // Este teste documenta o comportamento ESPERADO (algo deve ser exibido) e irá
      // FALHAR até que um ErrorBoundary ou try/catch seja adicionado ao fetchTasks.

      await page.route(`${API_URL}/tasks`, (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro Interno do Servidor', statusCode: 500 }),
        });
      });

      await page.goto('/');
      await page.waitForTimeout(2000);

      // A página deve exibir ALGO útil — não uma tela em branco.
      const lista = page.getByTestId('task-list');
      const mensagemErro = page.getByTestId('error-message');

      const temMensagemErro = await mensagemErro.isVisible().catch(() => false);
      const temLista = await lista.isVisible().catch(() => false);

      // Esta asserção FALHA até que fetchTasks tenha tratamento de erro adequado.
      expect(temMensagemErro || temLista).toBeTruthy();
    });
  });

  test.describe('POST /tasks falha', () => {
    test('mantém a lista inalterada quando a criação de tarefa falha', async ({
      page,
      taskFormPage,
      taskListPage,
    }) => {
      await page.goto('/');
      await taskListPage.waitForLoaded();

      await page.route(`${API_URL}/tasks`, (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Erro Interno do Servidor', statusCode: 500 }),
          });
        } else {
          route.continue();
        }
      });

      await taskFormPage.titleInput.fill(`Tarefa erro ${Date.now()}`);
      await taskFormPage.submit();

      // A lista deve permanecer vazia (tarefa não foi criada)
      await expect(taskListPage.items()).toHaveCount(0);
    });
  });

  test.describe('PATCH /tasks/:id falha (toggle de conclusão)', () => {
    test('mantém o item visível na lista quando a atualização falha', async ({
      page,
      createTaskViaApi,
      taskListPage,
    }) => {
      const tarefa = await createTaskViaApi(`Patch falha ${Date.now()}`);
      await page.goto('/');
      await taskListPage.waitForLoaded();

      await page.route(`${API_URL}/tasks/${tarefa.id}`, (route) => {
        if (route.request().method() === 'PATCH') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Erro Interno do Servidor', statusCode: 500 }),
          });
        } else {
          route.continue();
        }
      });

      const item = taskListPage.itemByTitle(tarefa.title);
      await taskListPage.checkboxOf(item).click();

      // Aguarda qualquer tratamento assíncrono
      await page.waitForTimeout(500);

      // O item deve permanecer visível e a aplicação não deve ter travado
      await expect(item).toBeVisible();
    });
  });

  test.describe('Erros na geração por IA', () => {
    test('exibe mensagem de erro quando a API de IA retorna 401 (chave inválida)', async ({
      page,
      aiGeneratorPage,
    }) => {
      // BUG-003: Este teste deve FALHAR com a implementação atual.
      // Erros da geração de IA são engolidos silenciosamente em AiGenerator.tsx.
      await page.goto('/');

      await page.route(`${API_URL}/ai/generate`, (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Chave de API inválida', statusCode: 401 }),
        });
      });

      await aiGeneratorPage.objectiveInput.fill('Lançar um produto');
      await aiGeneratorPage.apiKeyInput.fill('chave-invalida');
      await aiGeneratorPage.clickGenerate();

      await page.waitForFunction(
        () =>
          (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
            ?.textContent
            ?.trim() !== 'Carregando...',
        { timeout: 15000 },
      );

      // O usuário deve ver uma mensagem de erro
      const elementoErro = page.locator('[data-testid="ai-error-message"]');
      await expect(elementoErro).toBeVisible();
    });

    test('exibe mensagem de erro quando a API de IA atinge timeout', async ({
      page,
      aiGeneratorPage,
    }) => {
      // BUG-003: Este teste deve FALHAR com a implementação atual.
      await page.goto('/');

      await page.route(`${API_URL}/ai/generate`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Gateway Timeout', statusCode: 504 }),
        });
      });

      await aiGeneratorPage.objectiveInput.fill('Testar timeout');
      await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
      await aiGeneratorPage.clickGenerate();

      await page.waitForFunction(
        () =>
          (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
            ?.textContent
            ?.trim() !== 'Carregando...',
        { timeout: 15000 },
      );

      const elementoErro = page.locator('[data-testid="ai-error-message"]');
      await expect(elementoErro).toBeVisible();
    });

    test('preserva o texto do objetivo após erro na geração por IA', async ({
      page,
      aiGeneratorPage,
    }) => {
      // BUG-003 + PRD-005: o objetivo não deve ser apagado em caso de erro.
      await page.goto('/');

      await page.route(`${API_URL}/ai/generate`, (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro no servidor', statusCode: 500 }),
        });
      });

      const objetivo = 'Lançar um produto de software';
      await aiGeneratorPage.objectiveInput.fill(objetivo);
      await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
      await aiGeneratorPage.clickGenerate();

      await page.waitForFunction(
        () =>
          (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
            ?.textContent
            ?.trim() !== 'Carregando...',
        { timeout: 15000 },
      );

      // O objetivo deve ser mantido no campo para que o usuário possa tentar novamente
      await expect(aiGeneratorPage.objectiveInput).toHaveValue(objetivo);
    });

    test('botão de geração é desabilitado durante o carregamento para evitar requisições duplicadas', async ({
      page,
      aiGeneratorPage,
    }) => {
      // BUG-010: Este teste deve FALHAR com a implementação atual.
      // O botão não possui atributo disabled durante o carregamento.
      await page.goto('/');

      await page.route(`${API_URL}/ai/generate`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await aiGeneratorPage.objectiveInput.fill('Testar desabilitar botão');
      await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
      await aiGeneratorPage.clickGenerate();

      // Durante o carregamento, o botão deve estar desabilitado
      await expect(aiGeneratorPage.generateButton).toBeDisabled();
    });
  });

  test.describe('DELETE /tasks/:id falha', () => {
    test('mantém a tarefa na lista quando a exclusão falha', async ({
      page,
      createTaskViaApi,
      taskListPage,
    }) => {
      const tarefa = await createTaskViaApi(`Exclusão falha ${Date.now()}`);
      await page.goto('/');
      await taskListPage.waitForLoaded();

      await page.route(`${API_URL}/tasks/${tarefa.id}`, (route) => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Erro Interno do Servidor', statusCode: 500 }),
          });
        } else {
          route.continue();
        }
      });

      await taskListPage.deleteTask(tarefa.title);

      // A tarefa deve permanecer visível pois a exclusão falhou
      await page.waitForTimeout(500);
      await expect(taskListPage.itemByTitle(tarefa.title)).toBeVisible();
    });
  });
});
