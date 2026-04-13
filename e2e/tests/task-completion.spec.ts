import { test, expect } from '../fixtures/tasks.fixture';

test.describe('Conclusão de Tarefa', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    await cleanupTasks();
  });

  test('marca tarefa como concluída com feedback visual', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Concluir tarefa ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const item = taskListPage.itemByTitle(tarefa.title);
    const checkbox = taskListPage.checkboxOf(item);

    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Verificar feedback visual: título deve ter tachado (line-through)
    const tituloEl = item.getByTestId('task-title');
    await expect(tituloEl).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('persiste o estado de conclusão após recarregar a página', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    // BUG-001: Este teste deve FALHAR com a implementação atual.
    // toggleComplete não chama PATCH /tasks/:id, portanto o estado nunca é salvo.
    const tarefa = await createTaskViaApi(`Persistir conclusão ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    await taskListPage.toggleTask(tarefa.title);
    await expect(taskListPage.checkboxOf(taskListPage.itemByTitle(tarefa.title))).toBeChecked();

    // Recarrega e verifica persistência
    await page.reload();
    await taskListPage.waitForLoaded();

    await expect(taskListPage.checkboxOf(taskListPage.itemByTitle(tarefa.title))).toBeChecked();
  });

  test('permite desmarcar (desconcluir) uma tarefa já concluída', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Toggle duplo ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const item = taskListPage.itemByTitle(tarefa.title);
    const checkbox = taskListPage.checkboxOf(item);

    // Conclui
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Desconclui
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('persiste o estado de desconclusão após recarregar a página', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    // BUG-001: Também deve FALHAR — desconcluir também não é persistido.
    const tarefa = await createTaskViaApi(`Persistir desconclusão ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const item = taskListPage.itemByTitle(tarefa.title);
    const checkbox = taskListPage.checkboxOf(item);

    await checkbox.click(); // conclui
    await checkbox.click(); // desconclui
    await expect(checkbox).not.toBeChecked();

    await page.reload();
    await taskListPage.waitForLoaded();

    await expect(taskListPage.checkboxOf(taskListPage.itemByTitle(tarefa.title))).not.toBeChecked();
  });

  test('tarefa concluída exibe cor de texto esmaecida', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    const tarefa = await createTaskViaApi(`Estilo visual ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const item = taskListPage.itemByTitle(tarefa.title);
    await taskListPage.checkboxOf(item).click();

    const tituloEl = item.getByTestId('task-title');
    // Tarefas concluídas devem ter cor cinza esmaecida
    await expect(tituloEl).toHaveCSS('color', 'rgb(156, 163, 175)');
  });
});
