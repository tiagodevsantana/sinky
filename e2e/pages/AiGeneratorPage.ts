import { Page, Locator } from '@playwright/test';

/**
 * Page Object para a seção do gerador de tarefas por IA.
 * Mapeia <div data-testid="ai-generator">.
 */
export class AiGeneratorPage {
  readonly page: Page;
  readonly container: Locator;
  readonly apiKeyInput: Locator;
  readonly objectiveInput: Locator;
  readonly generateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('ai-generator');
    this.apiKeyInput = page.getByTestId('ai-api-key-input');
    this.objectiveInput = page.getByTestId('ai-objective-input');
    this.generateButton = page.getByTestId('ai-generate-button');
  }

  /** Preenche o campo de API Key. */
  async setApiKey(apiKey: string): Promise<void> {
    await this.apiKeyInput.fill(apiKey);
  }

  /** Preenche o campo de objetivo. */
  async setObjective(objetivo: string): Promise<void> {
    await this.objectiveInput.fill(objetivo);
  }

  /** Clica no botão de gerar. Não aguarda a conclusão. */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Preenche os campos e clica em gerar, aguardando o retorno do estado de carregamento
   * (tanto em sucesso quanto em erro).
   */
  async generate(objetivo: string, apiKey: string): Promise<void> {
    await this.setApiKey(apiKey);
    await this.setObjective(objetivo);
    await this.clickGenerate();
    await this.generateButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      () =>
        (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
          ?.textContent
          ?.trim() !== 'Carregando...',
    );
  }

  /** Retorna true se o botão está no estado de carregamento. */
  async estaCarregando(): Promise<boolean> {
    const texto = await this.generateButton.textContent();
    return texto?.includes('Carregando') ?? false;
  }
}
