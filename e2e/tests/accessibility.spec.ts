/**
 * B3 — Testes de Acessibilidade
 * Usa @axe-core/playwright para auditar conformidade WCAG nos fluxos críticos.
 */
import { test, expect } from '../fixtures/tasks.fixture';
import AxeBuilder from '@axe-core/playwright';

test.describe('Acessibilidade (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ cleanupTasks }) => {
    await cleanupTasks();
  });

  test('página inicial não possui violações de acessibilidade críticas', async ({
    page,
    taskListPage,
  }) => {
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (resultado.violations.length > 0) {
      console.log(
        'Violações de acessibilidade encontradas:',
        resultado.violations.map((v) => ({
          id: v.id,
          impacto: v.impact,
          descricao: v.description,
          ocorrencias: v.nodes.length,
        })),
      );
    }

    expect(resultado.violations).toHaveLength(0);
  });

  test('ACESSIBILIDADE-001: botão de exclusão não possui nome acessível', async ({
    page,
    createTaskViaApi,
    taskListPage,
  }) => {
    // BUG-013: Botões de exclusão de tarefas não possuem aria-label.
    // Este teste documenta a violação diretamente.
    await createTaskViaApi(`Tarefa acessibilidade ${Date.now()}`);
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const resultado = await new AxeBuilder({ page })
      .include('[data-testid="task-delete-button"]')
      .withTags(['wcag2a'])
      .analyze();

    const violacaoBotao = resultado.violations.find(
      (v) => v.id === 'button-name' || v.id === 'label',
    );

    if (violacaoBotao) {
      console.log('[BUG-013 CONHECIDO] Botão de exclusão sem nome acessível:', violacaoBotao);
    }

    // Esta asserção documenta o estado esperado (sem violações):
    expect(resultado.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);
  });

  test('ACESSIBILIDADE-002: campo de título da tarefa não possui label associado', async ({
    page,
    taskListPage,
  }) => {
    // O campo de título usa apenas placeholder; não há elemento <label> associado.
    // Leitores de tela podem não anunciar corretamente o propósito do campo.
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const resultado = await new AxeBuilder({ page })
      .include('[data-testid="task-title-input"]')
      .withTags(['wcag2a'])
      .analyze();

    const violacaoLabel = resultado.violations.find((v) => v.id === 'label');
    if (violacaoLabel) {
      console.log('[ACESSIBILIDADE] Campo de título sem label:', violacaoLabel);
    }

    expect(resultado.violations.filter((v) => v.id === 'label')).toHaveLength(0);
  });

  test('ACESSIBILIDADE-003: campos do gerador de IA não possuem labels associados', async ({
    page,
    taskListPage,
  }) => {
    // Tanto o campo de API Key quanto o de objetivo usam apenas placeholders.
    await page.goto('/');
    await taskListPage.waitForLoaded();

    const resultado = await new AxeBuilder({ page })
      .include('[data-testid="ai-generator"]')
      .withTags(['wcag2a'])
      .analyze();

    const violacoesLabel = resultado.violations.filter((v) => v.id === 'label');
    if (violacoesLabel.length > 0) {
      console.log('[ACESSIBILIDADE] Campos do gerador de IA sem labels:', violacoesLabel);
    }

    expect(violacoesLabel).toHaveLength(0);
  });
});
