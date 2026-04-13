import { test, expect } from '../fixtures/tasks.fixture';

test.describe('Criação de Tarefa', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    await cleanupTasks();
  });

  test('cria uma tarefa manualmente e exibe na lista imediatamente', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    const titulo = `Tarefa de teste ${Date.now()}`;

    await page.goto('/');
    await taskListPage.waitForLoaded();
    await taskFormPage.createTask(titulo);

    await expect(taskListPage.itemByTitle(titulo)).toBeVisible();
  });

  test('limpa o campo de título após criação bem-sucedida', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();
    await taskFormPage.createTask(`Tarefa limpar campo ${Date.now()}`);

    await expect(taskFormPage.titleInput).toHaveValue('');
  });

  test('não cria tarefa quando o título está vazio', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await taskFormPage.submit();

    await expect(taskListPage.items()).toHaveCount(0);
  });

  test('não cria tarefa quando o título contém apenas espaços em branco', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    // BUG-002: Este teste deve FALHAR com a implementação atual.
    // Títulos compostos apenas de espaços são aceitos pelo frontend e backend.
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await taskFormPage.titleInput.fill('     ');
    await taskFormPage.submit();

    await expect(taskListPage.items()).toHaveCount(0);
  });

  test('nova tarefa aparece sem recarregar a página (atualização otimista)', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    const titulo = `Tarefa otimista ${Date.now()}`;
    await page.goto('/');
    await taskListPage.waitForLoaded();
    await taskFormPage.createTask(titulo);

    await expect(taskListPage.itemByTitle(titulo)).toBeVisible();
  });

  test('contador de tarefas no cabeçalho atualiza após criação', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const contadorAntes = await taskListPage.taskCount.textContent();

    await taskFormPage.createTask(`Tarefa contador ${Date.now()}`);

    const contadorDepois = await taskListPage.taskCount.textContent();
    expect(contadorAntes).not.toEqual(contadorDepois);
  });

  test('nova tarefa não é marcada como concluída por padrão', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    const titulo = `Tarefa estado padrão ${Date.now()}`;
    await page.goto('/');
    await taskListPage.waitForLoaded();
    await taskFormPage.createTask(titulo);

    const item = taskListPage.itemByTitle(titulo);
    await expect(taskListPage.checkboxOf(item)).not.toBeChecked();
  });

  test('nova tarefa criada manualmente não possui badge de IA', async ({
    page,
    taskFormPage,
    taskListPage,
  }) => {
    const titulo = `Tarefa manual ${Date.now()}`;
    await page.goto('/');
    await taskListPage.waitForLoaded();
    await taskFormPage.createTask(titulo);

    const item = taskListPage.itemByTitle(titulo);
    await expect(taskListPage.aiBadgeOf(item)).not.toBeVisible();
  });
});
