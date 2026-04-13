import { test, expect } from '../fixtures/tasks.fixture';

test.describe('Exclusão de Tarefa', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    await cleanupTasks();
  });

  test('remove a tarefa da lista após clicar no botão de exclusão', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Excluir tarefa ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await expect(taskListPage.itemByTitle(tarefa.title)).toBeVisible();

    await taskListPage.deleteTask(tarefa.title);

    await expect(taskListPage.itemByTitle(tarefa.title)).not.toBeVisible();
  });

  test('tarefa excluída não reaparece após recarregar a página', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Exclusão permanente ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await taskListPage.deleteTask(tarefa.title);

    await page.reload();
    await taskListPage.waitForLoaded();

    await expect(taskListPage.itemByTitle(tarefa.title)).not.toBeVisible();
  });

  test('apenas a tarefa selecionada é removida, as demais permanecem', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const ts = Date.now();
    const tarefaA = await createTaskViaApi(`Manter A ${ts}`);
    const tarefaB = await createTaskViaApi(`Excluir B ${ts}`);
    const tarefaC = await createTaskViaApi(`Manter C ${ts}`);

    await page.goto('/');
    await taskListPage.waitForLoaded();

    await taskListPage.deleteTask(tarefaB.title);

    await expect(taskListPage.itemByTitle(tarefaA.title)).toBeVisible();
    await expect(taskListPage.itemByTitle(tarefaB.title)).not.toBeVisible();
    await expect(taskListPage.itemByTitle(tarefaC.title)).toBeVisible();
  });

  test('permite excluir uma tarefa já concluída', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Excluir concluída ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    // Primeiro conclui
    await taskListPage.toggleTask(tarefa.title);
    await expect(taskListPage.checkboxOf(taskListPage.itemByTitle(tarefa.title))).toBeChecked();

    // Depois exclui
    await taskListPage.deleteTask(tarefa.title);

    await expect(taskListPage.itemByTitle(tarefa.title)).not.toBeVisible();
  });

  test('contador de tarefas decrementa após exclusão', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const ts = Date.now();
    await createTaskViaApi(`Tarefa contagem 1 ${ts}`);
    await createTaskViaApi(`Tarefa contagem 2 ${ts}`);

    await page.goto('/');
    await taskListPage.waitForLoaded();

    await expect(taskListPage.taskCount).toContainText('2');

    await taskListPage.deleteTask(`Tarefa contagem 1 ${ts}`);

    await expect(taskListPage.items()).toHaveCount(1);
    await expect(taskListPage.taskCount).toContainText('1');
  });
});
