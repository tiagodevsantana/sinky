import { Page, Locator } from '@playwright/test';

/**
 * Page Object para o formulário de criação manual de tarefas.
 * Mapeia <form data-testid="task-form">.
 */
export class TaskFormPage {
  readonly page: Page;
  readonly form: Locator;
  readonly titleInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('task-form');
    this.titleInput = page.getByTestId('task-title-input');
    this.submitButton = page.getByTestId('task-submit-button');
  }

  /**
   * Preenche o título e submete o formulário.
   * Aguarda o botão ser reabilitado após a submissão.
   */
  async createTask(titulo: string): Promise<void> {
    await this.titleInput.fill(titulo);
    await this.submitButton.click();
    await this.submitButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      () => !document.querySelector('[data-testid="task-submit-button"]')?.hasAttribute('disabled'),
    );
  }

  /** Retorna o valor atual do campo de título. */
  async getTitleValue(): Promise<string> {
    return this.titleInput.inputValue();
  }

  /** Submete o formulário sem alterar o valor atual do campo. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
