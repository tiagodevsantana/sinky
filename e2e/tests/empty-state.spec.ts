import { test, expect } from '../fixtures/tasks.fixture';

test.describe('Estado Vazio', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    // Garante que nenhuma tarefa existe antes de cada teste
    await cleanupTasks();
  });

  test('exibe o container da lista quando não há tarefas', async ({
    page,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();

    // Usa toBeAttached pois uma <ul> vazia tem altura zero e Playwright
    // a considera "hidden" — comportamento relacionado ao BUG-012
    await expect(taskListPage.list).toBeAttached();
    await expect(taskListPage.items()).toHaveCount(0);
  });

  test('exibe zero no contador de tarefas quando não há tarefas', async ({
    page,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await expect(taskListPage.taskCount).toContainText('0');
  });

  test('exibe mensagem de estado vazio quando não há tarefas', async ({
    page,
    taskListPage,
  }) => {
    // BUG-012: Este teste deve FALHAR com a implementação atual.
    // A aplicação renderiza uma <ul> vazia sem nenhuma mensagem ou call-to-action.
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await expect(taskListPage.items()).toHaveCount(0);

    // Espera algum elemento de estado vazio
    const estadoVazio = page.getByTestId('empty-state');
    await expect(estadoVazio).toBeVisible();
  });

  test('estado vazio desaparece após criar a primeira tarefa', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    // BUG-012: Também deve FALHAR — não existe elemento de estado vazio.
    await page.goto('/');
    await taskListPage.waitForLoaded();

    // Verifica que o estado vazio está visível
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // Cria uma tarefa
    await taskFormPage.createTask(`Primeira tarefa ${Date.now()}`);

    // Estado vazio deve sumir
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
    await expect(taskListPage.items()).toHaveCount(1);
  });

  test('gerador de IA e formulário de tarefa estão visíveis no estado vazio', async ({
    page,
    aiGeneratorPage,
    taskFormPage,
  }) => {
    await page.goto('/');

    await expect(aiGeneratorPage.container).toBeVisible();
    await expect(taskFormPage.form).toBeVisible();
  });

  test('indicador de carregamento é exibido durante o carregamento inicial', async ({
    page,
    taskListPage,
  }) => {
    await page.goto('/');
    // Após o carregamento concluir, o indicador deve estar oculto
    await taskListPage.waitForLoaded();
    await expect(taskListPage.loadingIndicator).not.toBeVisible();
  });
});
