/**
 * B1 — Testes de Contrato de API
 * Usa o contexto de requisição do Playwright para verificar contratos HTTP diretamente.
 */
import { test, expect } from '../fixtures/tasks.fixture';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

test.describe('Contratos de API', () => {
  test.describe('GET /tasks', () => {
    test('retorna 200 com um array', async ({ request }) => {
      const response = await request.get(`${API_URL}/tasks`);
      expect(response.status()).toBe(200);
      const corpo = await response.json();
      expect(Array.isArray(corpo)).toBe(true);
    });

    test('cada tarefa possui os campos obrigatórios com os tipos corretos', async ({
      request,
      createTaskViaApi,
    }) => {
      await createTaskViaApi(`Tarefa schema ${Date.now()}`);
      const response = await request.get(`${API_URL}/tasks`);
      const tarefas: unknown[] = await response.json();
      expect(tarefas.length).toBeGreaterThan(0);

      for (const tarefa of tarefas as Record<string, unknown>[]) {
        expect(typeof tarefa.id).toBe('string');
        expect(typeof tarefa.title).toBe('string');
        expect(typeof tarefa.isCompleted).toBe('boolean');
        expect(typeof tarefa.isAiGenerated).toBe('boolean');
        expect(typeof tarefa.createdAt).toBe('string');
        // Verifica formato UUID
        expect(tarefa.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        // Verifica data ISO 8601
        expect(new Date(tarefa.createdAt as string).toISOString()).toBe(tarefa.createdAt);
      }
    });
  });

  test.describe('POST /tasks', () => {
    test('retorna 201 e a tarefa criada com schema correto', async ({ request }) => {
      const titulo = `Tarefa via API ${Date.now()}`;
      const response = await request.post(`${API_URL}/tasks`, {
        data: { title: titulo },
      });

      expect(response.status()).toBe(201);
      const tarefa = await response.json();

      expect(tarefa.title).toBe(titulo);
      expect(tarefa.isCompleted).toBe(false);
      expect(tarefa.isAiGenerated).toBe(false);
      expect(typeof tarefa.id).toBe('string');

      // Limpeza
      await request.delete(`${API_URL}/tasks/${tarefa.id}`);
    });

    test('retorna 400 quando o campo título está ausente', async ({ request }) => {
      const response = await request.post(`${API_URL}/tasks`, {
        data: {},
      });
      expect(response.status()).toBe(400);
    });

    test('retorna 400 quando o título contém apenas espaços em branco', async ({ request }) => {
      // BUG-002: Este teste deve FALHAR. O backend aceita títulos com apenas espaços.
      const response = await request.post(`${API_URL}/tasks`, {
        data: { title: '    ' },
      });
      expect(response.status()).toBe(400);
    });

    test('retorna 400 quando o título excede 255 caracteres', async ({ request }) => {
      // BUG-011: Este teste deve FALHAR. Não há validação de MaxLength.
      const response = await request.post(`${API_URL}/tasks`, {
        data: { title: 'A'.repeat(256) },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /tasks/:id', () => {
    test('retorna 200 com a tarefa quando ela existe', async ({ request, createTaskViaApi }) => {
      const criada = await createTaskViaApi(`Buscar por ID ${Date.now()}`);
      const response = await request.get(`${API_URL}/tasks/${criada.id}`);
      expect(response.status()).toBe(200);
      const tarefa = await response.json();
      expect(tarefa.id).toBe(criada.id);
      expect(tarefa.title).toBe(criada.title);
    });

    test('retorna 404 quando a tarefa não existe', async ({ request }) => {
      const response = await request.get(
        `${API_URL}/tasks/00000000-0000-0000-0000-000000000000`,
      );
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /tasks/:id', () => {
    test('retorna 200 e tarefa atualizada ao marcar como concluída', async ({
      request,
      createTaskViaApi,
    }) => {
      const tarefa = await createTaskViaApi(`Patch concluir ${Date.now()}`);
      const response = await request.patch(`${API_URL}/tasks/${tarefa.id}`, {
        data: { isCompleted: true },
      });

      expect(response.status()).toBe(200);
      const atualizada = await response.json();
      expect(atualizada.isCompleted).toBe(true);
    });

    test('retorna 404 ao atualizar tarefa inexistente', async ({ request }) => {
      const response = await request.patch(
        `${API_URL}/tasks/00000000-0000-0000-0000-000000000000`,
        { data: { isCompleted: true } },
      );
      expect(response.status()).toBe(404);
    });

    test('retorna 400 quando isCompleted não é um booleano', async ({
      request,
      createTaskViaApi,
    }) => {
      // BUG-007: Este teste deve FALHAR. @IsBoolean() está ausente no UpdateTaskDto.
      const tarefa = await createTaskViaApi(`Patch inválido ${Date.now()}`);
      const response = await request.patch(`${API_URL}/tasks/${tarefa.id}`, {
        data: { isCompleted: 'banana' },
      });
      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /tasks/:id', () => {
    test('retorna 204 ao excluir uma tarefa existente', async ({ request, createTaskViaApi }) => {
      const tarefa = await createTaskViaApi(`Excluir contrato ${Date.now()}`);
      const response = await request.delete(`${API_URL}/tasks/${tarefa.id}`);
      expect(response.status()).toBe(204);
    });

    test('retorna 404 ao excluir tarefa inexistente', async ({ request }) => {
      // BUG-004: Este teste deve FALHAR. DELETE em ID inexistente retorna 204.
      const response = await request.delete(
        `${API_URL}/tasks/00000000-0000-0000-0000-000000000000`,
      );
      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /ai/generate', () => {
    test('retorna 400 quando o objetivo está ausente', async ({ request }) => {
      const response = await request.post(`${API_URL}/ai/generate`, {
        data: { apiKey: 'alguma-chave' },
      });
      expect(response.status()).toBe(400);
    });

    test('retorna 400 quando a apiKey está ausente', async ({ request }) => {
      const response = await request.post(`${API_URL}/ai/generate`, {
        data: { objective: 'Lançar um produto' },
      });
      expect(response.status()).toBe(400);
    });

    test('retorna 400 quando ambos os campos estão ausentes', async ({ request }) => {
      const response = await request.post(`${API_URL}/ai/generate`, {
        data: {},
      });
      expect(response.status()).toBe(400);
    });
  });
});
