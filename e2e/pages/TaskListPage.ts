import { Page, Locator } from '@playwright/test';

/**
 * Page Object para a seção de lista de tarefas.
 * Mapeia <ul data-testid="task-list"> e seus filhos.
 */
export class TaskListPage {
  readonly page: Page;
  readonly list: Locator;
  readonly loadingIndicator: Locator;
  readonly taskCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByTestId('task-list');
    this.loadingIndicator = page.getByTestId('tasks-loading');
    this.taskCount = page.getByTestId('task-count');
  }

  /** Retorna todos os itens da lista atualmente renderizados. */
  items(): Locator {
    return this.page.getByTestId('task-item');
  }

  /** Retorna o item cuja título corresponde exatamente ao texto informado. */
  itemByTitle(titulo: string): Locator {
    return this.page
      .getByTestId('task-item')
      .filter({ has: this.page.getByTestId('task-title').filter({ hasText: titulo }) });
  }

  /** Retorna o checkbox dentro de um item de tarefa. */
  checkboxOf(itemTarefa: Locator): Locator {
    return itemTarefa.getByTestId('task-checkbox');
  }

  /** Retorna o botão de exclusão dentro de um item de tarefa. */
  deleteButtonOf(itemTarefa: Locator): Locator {
    return itemTarefa.getByTestId('task-delete-button');
  }

  /** Retorna o badge de IA dentro de um item de tarefa (se existir). */
  aiBadgeOf(itemTarefa: Locator): Locator {
    return itemTarefa.getByTestId('task-ai-badge');
  }

  /**
   * Aguarda o carregamento inicial concluir.
   * Espera o indicador de carregamento sumir E a lista ser anexada ao DOM.
   */
  async waitForLoaded(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden' });
    await this.list.waitFor({ state: 'attached' });
  }

  /** Alterna o estado de conclusão de uma tarefa pelo título. */
  async toggleTask(titulo: string): Promise<void> {
    const item = this.itemByTitle(titulo);
    await this.checkboxOf(item).click();
  }

  /** Exclui uma tarefa pelo título. */
  async deleteTask(titulo: string): Promise<void> {
    const item = this.itemByTitle(titulo);
    await this.deleteButtonOf(item).click();
  }
}
