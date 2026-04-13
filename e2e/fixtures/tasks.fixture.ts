import { test as base, APIRequestContext, request } from '@playwright/test';
import { TaskFormPage } from '../pages/TaskFormPage';
import { TaskListPage } from '../pages/TaskListPage';
import { AiGeneratorPage } from '../pages/AiGeneratorPage';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface Tarefa {
  id: string;
  title: string;
  isCompleted: boolean;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface TasksFixture {
  /** Page Objects */
  taskListPage: TaskListPage;
  taskFormPage: TaskFormPage;
  aiGeneratorPage: AiGeneratorPage;

  /**
   * Cria uma tarefa via API e registra para limpeza automática após o teste.
   * Retorna o objeto da tarefa criada.
   */
  createTaskViaApi: (titulo: string) => Promise<Tarefa>;

  /**
   * Exclui todas as tarefas existentes via API.
   * Chamado automaticamente no beforeEach para isolar o estado de cada teste.
   */
  cleanupTasks: () => Promise<void>;
}

/**
 * Fixture estendido que:
 * 1. Fornece instâncias dos Page Objects
 * 2. Rastreia tarefas criadas durante o teste
 * 3. Limpa automaticamente as tarefas criadas via API no teardown
 */
export const test = base.extend<TasksFixture>({
  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page));
  },

  taskFormPage: async ({ page }, use) => {
    await use(new TaskFormPage(page));
  },

  aiGeneratorPage: async ({ page }, use) => {
    await use(new AiGeneratorPage(page));
  },

  createTaskViaApi: async ({}, use) => {
    const idsCriados: string[] = [];
    let contextoApi: APIRequestContext;

    contextoApi = await request.newContext({ baseURL: API_URL });

    const criarTarefa = async (titulo: string): Promise<Tarefa> => {
      const response = await contextoApi.post('/tasks', {
        data: { title: titulo },
      });
      const tarefa: Tarefa = await response.json();
      idsCriados.push(tarefa.id);
      return tarefa;
    };

    await use(criarTarefa);

    // Teardown: exclui todas as tarefas criadas neste teste
    for (const id of idsCriados) {
      await contextoApi.delete(`/tasks/${id}`).catch(() => {
        // A tarefa pode já ter sido excluída pelo próprio teste — sem problema
      });
    }
    await contextoApi.dispose();
  },

  cleanupTasks: async ({}, use) => {
    await use(async () => {
      const contextoApi = await request.newContext({ baseURL: API_URL });
      const response = await contextoApi.get('/tasks');
      const tarefas: Tarefa[] = await response.json();
      await Promise.all(tarefas.map((t) => contextoApi.delete(`/tasks/${t.id}`)));
      await contextoApi.dispose();
    });
  },
});

export { expect } from '@playwright/test';
