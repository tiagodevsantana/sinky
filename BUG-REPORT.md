vi qu# BUG-REPORT — Smart To-Do List

**Auditor:** Tiago Santana
**Data:** 13 abr 2026
**Versão da aplicação:** conforme repositório (Docker Compose)
**Método:** Revisão de código-fonte + testes exploratórios via Swagger e interface

---

## [BUG-001] Toggle de conclusão não persiste no banco de dados

**Severidade:** Crítica
**Prioridade:** P1
**Componente:** Frontend | Backend

### Descrição

A função `toggleComplete` em `useTasks.ts` atualiza apenas o estado local do React, **sem realizar nenhuma chamada à API** (`PATCH /tasks/:id`). Ao recarregar a página, todas as tarefas marcadas como concluídas voltam ao estado original.

### Passos para Reproduzir

1. Acessar http://localhost:3000
2. Criar uma tarefa manualmente
3. Marcar a tarefa como concluída (clicar no checkbox)
4. Verificar que a tarefa exibe feedback visual de "concluída"
5. Recarregar a página (F5)

### Resultado Esperado

A tarefa deve continuar marcada como concluída após o reload.

### Resultado Obtido

A tarefa retorna ao estado "pendente". Nenhuma requisição `PATCH` é enviada ao backend.

### Evidência

`app/frontend/src/hooks/useTasks.ts`, linha 33–36:
```ts
const toggleComplete = async (id: string) => {
  setTasks((prev) =>
    prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
  );
};
```
Ausência completa de chamada `api.patch(...)`. O comentário no próprio arquivo confirma o bug: `"BUG-001: toggleComplete atualiza apenas o estado local."`.

### Sugestão de Correção

```ts
const toggleComplete = async (id: string) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const { data } = await api.patch<Task>(`/tasks/${id}`, {
    isCompleted: !task.isCompleted,
  });
  setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
};
```

---

## [BUG-002] Títulos compostos apenas de espaços em branco são aceitos

**Severidade:** Alta
**Prioridade:** P2
**Componente:** Frontend | Backend

### Descrição

O formulário de criação de tarefas não aplica `.trim()` antes da validação. Títulos como `"   "` (somente espaços) passam pela verificação `if (!title)` no frontend e também são aceitos pelo backend (o DTO usa apenas `@IsString()`, sem `@IsNotEmpty()` ou `@Trim()`).

### Passos para Reproduzir

1. Acessar http://localhost:3000
2. No campo "Adicionar nova tarefa...", inserir apenas espaços (ex: `"     "`)
3. Clicar em "Adicionar"

### Resultado Esperado

O sistema deve rejeitar a submissão e exibir mensagem de erro: "O título não pode estar vazio."

### Resultado Obtido

Uma tarefa é criada com título composto apenas de espaços, aparecendo como item vazio na lista. Via `POST /tasks` com `{ "title": "   " }` o backend retorna `201 Created`.

### Evidência

`app/frontend/src/components/TaskForm.tsx`, linha 16: `if (!title) return;` (sem `.trim()`).
`app/backend/src/tasks/dto/create-task.dto.ts`: ausência de `@IsNotEmpty()`.

### Sugestão de Correção

Frontend: `if (!title.trim()) return;`
Backend DTO: adicionar `@IsNotEmpty()` e `@Transform(({ value }) => value.trim())`.

---

## [BUG-003] Falha na geração de tarefas por IA é silenciosa para o usuário

**Severidade:** Alta
**Prioridade:** P2
**Componente:** Frontend | UX

### Descrição

O componente `AiGenerator.tsx` captura erros no bloco `catch` mas não atualiza nenhum estado de erro na UI. Quando a geração falha (API Key inválida, timeout, resposta mal formatada), o spinner some e nada acontece — o usuário não recebe nenhuma mensagem de erro.

### Passos para Reproduzir

1. Acessar http://localhost:3000
2. Inserir uma API Key **inválida** no campo correspondente
3. Digitar qualquer objetivo (ex: "Lançar um produto")
4. Clicar em "Gerar tarefas"
5. Aguardar o spinner desaparecer

### Resultado Esperado

Uma mensagem de erro deve ser exibida, ex: "Falha ao gerar tarefas. Verifique sua API Key e tente novamente."

### Resultado Obtido

O spinner desaparece silenciosamente. Nenhuma mensagem é exibida. O erro é apenas logado no `console.error`.

### Evidência

`app/frontend/src/components/AiGenerator.tsx`, linhas 23–26:
```ts
} catch (err) {
  // BUG-003: Erro capturado mas nenhum estado de erro é atualizado na UI.
  console.error(err);
}
```

### Sugestão de Correção

Adicionar estado `errorMessage` e exibir em um `<p>` vermelho abaixo do botão quando preenchido.

---

## [BUG-004] DELETE em ID inexistente retorna 204 No Content (sem erro)

**Severidade:** Média
**Prioridade:** P3
**Componente:** Backend | API

### Descrição

O endpoint `DELETE /tasks/:id` não verifica se a tarefa existe antes de executar o DELETE. O TypeORM executa `repository.delete(id)` e, mesmo que nenhuma linha seja afetada, retorna `204 No Content`.

### Passos para Reproduzir

1. Acessar http://localhost:3001/api/docs (Swagger)
2. Chamar `DELETE /tasks/00000000-0000-0000-0000-000000000000` (UUID inexistente)

### Resultado Esperado

`404 Not Found` com body: `{ "error": "Task not found" }`.

### Resultado Obtido

`204 No Content` — como se a exclusão tivesse sido bem-sucedida.

### Evidência

`app/backend/src/tasks/tasks.service.ts`, linhas 39–42:
```ts
async remove(id: string): Promise<void> {
  // BUG-004: Sem verificação de existência
  await this.tasksRepository.delete(id);
}
```

### Sugestão de Correção

```ts
async remove(id: string): Promise<void> {
  await this.findOne(id); // lança NotFoundException se não existir
  await this.tasksRepository.delete(id);
}
```

---

## [BUG-005] Contador de tarefas no header não reflete mudanças em tempo real

**Severidade:** Baixa
**Prioridade:** P4
**Componente:** Frontend | UX

### Descrição

O componente `Header` recebe `taskCount` como prop. No `Header.tsx`, o comentário afirma que o valor não é reativo. Embora em React os re-renders do componente pai atualizem as props, na arquitetura atual o `Header` é isolado do contexto de estado e não exibe o valor correto de forma consistente durante operações otimistas (ex: criação de tarefa via IA que ainda não retornou).

### Passos para Reproduzir

1. Observar o contador no header ao criar/deletar tarefas rapidamente em sequência.

### Resultado Esperado

O contador deve refletir sempre o número exato de tarefas na lista.

### Resultado Obtido

Em cenários de operações concorrentes (múltiplas criações via IA), o contador pode mostrar valor desatualizado momentaneamente.

### Evidência

`app/frontend/src/components/Header.tsx`: comentário indica prop estática; `page.tsx` linha 15: `<Header taskCount={tasks.length} />`.

---

## [BUG-006] Modelo de IA no código diverge do documentado no README

**Severidade:** Média
**Prioridade:** P2
**Componente:** Backend | Documentação

### Descrição

O README e o PRD mencionam o modelo `mistralai/mistral-7b-instruct:free`, mas o `ai.service.ts` usa `google/gemma-3-4b-it:free`. Essa divergência indica uma mudança não documentada que pode afetar a qualidade dos resultados e a capacidade de seguir o formato JSON esperado.

### Passos para Reproduzir

1. Ler `app/README.md` — menciona `mistralai/mistral-7b-instruct:free`
2. Ler `app/backend/src/ai/ai.service.ts` linha 12 — `model: 'google/gemma-3-4b-it:free'`

### Resultado Esperado

O modelo documentado deve ser o mesmo que está em uso, ou a mudança deve estar documentada com justificativa.

### Resultado Obtido

Divergência entre documentação e implementação. Usuários e QA não têm rastreabilidade do modelo em uso.

### Evidência

`app/backend/src/ai/ai.service.ts`, linha 12: `model: 'google/gemma-3-4b-it:free'`.

---

## [BUG-007] Campo `isCompleted` aceita valores não-booleanos na API

**Severidade:** Média
**Prioridade:** P3
**Componente:** Backend | API

### Descrição

O `UpdateTaskDto` não tem o decorator `@IsBoolean()` no campo `isCompleted`. Com `ValidationPipe` ativo, valores como `"banana"` ou `1` são enviados e aceitos sem erro de validação.

### Passos para Reproduzir

1. Acessar http://localhost:3001/api/docs
2. Chamar `PATCH /tasks/:id` com body: `{ "isCompleted": "qualquer_string" }`

### Resultado Esperado

`400 Bad Request`: "isCompleted must be a boolean value."

### Resultado Obtido

`200 OK` — a tarefa é atualizada com o valor inválido (que pode ser interpretado como truthy/falsy de forma não determinística).

### Evidência

`app/backend/src/tasks/dto/update-task.dto.ts`, linha 11: ausência de `@IsBoolean()`.

### Sugestão de Correção

```ts
@IsOptional()
@IsBoolean()
isCompleted?: boolean;
```

---

## [BUG-008] Listagem de tarefas sem ordenação definida

**Severidade:** Média
**Prioridade:** P3
**Componente:** Backend | API

### Descrição

O método `findAll()` em `tasks.service.ts` não define nenhuma ordenação (`ORDER BY`). A ordem das tarefas retornadas depende do banco de dados e pode variar entre recarregamentos.

### Passos para Reproduzir

1. Criar 3+ tarefas em sequência
2. Chamar `GET /tasks`
3. Recarregar a aplicação várias vezes

### Resultado Esperado

As tarefas devem aparecer sempre em ordem consistente (ex: cronológica, pela `createdAt`).

### Resultado Obtido

A ordem das tarefas pode variar entre chamadas, especialmente após operações de escrita.

### Evidência

`app/backend/src/tasks/tasks.service.ts`, linha 17: `return this.tasksRepository.find();` (sem `order`).

### Sugestão de Correção

```ts
return this.tasksRepository.find({ order: { createdAt: 'ASC' } });
```

---

## [BUG-009] Shapes de resposta de erro inconsistentes entre endpoints

**Severidade:** Baixa
**Prioridade:** P4
**Componente:** Backend | API

### Descrição

Erros "not found" retornam `{ "error": "Task not found" }` (shape customizado), enquanto erros de validação retornam o shape padrão do NestJS `{ "message": [...], "statusCode": 400 }`. Essa inconsistência dificulta o tratamento de erros no cliente e em testes automatizados.

### Evidência

- `GET /tasks/:id` com ID inexistente → `{ "error": "Task not found" }`
- `POST /tasks` com body inválido → `{ "message": [...], "error": "Bad Request", "statusCode": 400 }`

### Sugestão de Correção

Padronizar todos os erros com o shape: `{ "statusCode": N, "error": "...", "message": "..." }`.

---

## [BUG-010] Botão "Gerar tarefas" não é desabilitado durante o carregamento

**Severidade:** Média
**Prioridade:** P3
**Componente:** Frontend | UX

### Descrição

O botão "Gerar tarefas" no componente `AiGenerator.tsx` não tem o atributo `disabled` durante o estado `isLoading`. Isso permite que o usuário clique múltiplas vezes e dispare chamadas duplicadas à API de IA, gerando tarefas repetidas.

### Passos para Reproduzir

1. Inserir API Key válida e um objetivo
2. Clicar em "Gerar tarefas" múltiplas vezes rapidamente

### Resultado Esperado

O botão deve ser desabilitado enquanto `isLoading = true`.

### Resultado Obtido

Múltiplos cliques disparam múltiplas chamadas `POST /ai/generate`, gerando lotes de tarefas duplicadas.

### Evidência

`app/frontend/src/components/AiGenerator.tsx`, linha 86: botão sem `disabled={isLoading}`.

### Sugestão de Correção

```tsx
<button
  data-testid="ai-generate-button"
  onClick={handleGenerate}
  disabled={isLoading}
  ...
>
```

---

## [BUG-011] Ausência de limite máximo no tamanho do título da tarefa

**Severidade:** Média
**Prioridade:** P3
**Componente:** Backend | Frontend

### Descrição

O `CreateTaskDto` não tem `@MaxLength()`, e o frontend não tem `maxLength` no input. Títulos de qualquer tamanho são aceitos, podendo causar problemas de renderização, performance do banco e exibição na UI.

### Passos para Reproduzir

1. Via Swagger: `POST /tasks` com `{ "title": "A".repeat(10000) }`

### Resultado Esperado

`400 Bad Request`: "title must be shorter than or equal to 255 characters."

### Resultado Obtido

`201 Created` — tarefa criada com título de 10.000 caracteres.

### Sugestão de Correção

Backend DTO: `@MaxLength(255)`. Frontend input: `maxLength={255}`.

---

## [BUG-012] Ausência de estado vazio na lista de tarefas

**Severidade:** Média
**Prioridade:** P3
**Componente:** Frontend | UX

### Descrição

Quando não há tarefas, o `TaskList.tsx` renderiza apenas uma `<ul>` vazia sem nenhuma mensagem, ilustração ou call-to-action. Para novos usuários, a primeira experiência na aplicação é uma tela em branco.

### Passos para Reproduzir

1. Acessar a aplicação sem nenhuma tarefa criada (ou após excluir todas)

### Resultado Esperado

Uma mensagem de estado vazio deve ser exibida, ex: "Nenhuma tarefa ainda. Use o campo acima para adicionar ou deixe a IA criar um plano para você."

### Resultado Obtido

`<ul>` vazia renderizada, sem qualquer feedback visual.

### Evidência

`app/frontend/src/components/TaskList.tsx`, linha 22: comentário `// BUG-012: Sem empty state`.

---

## [BUG-013] Botão de exclusão sem aria-label — inacessível a leitores de tela

**Severidade:** Média
**Prioridade:** P3
**Componente:** Frontend | Acessibilidade

### Descrição

O botão de exclusão em `TaskItem.tsx` contém apenas um ícone SVG sem `aria-label` ou `title`. Leitores de tela anunciam o elemento como "botão" sem qualquer descrição, tornando a ação de exclusão inacessível para usuários com deficiência visual.

### Evidência

`app/frontend/src/components/TaskItem.tsx`, linhas 65–85: `<button data-testid="task-delete-button">` sem `aria-label`.

### Sugestão de Correção

```tsx
<button
  data-testid="task-delete-button"
  aria-label={`Excluir tarefa: ${task.title}`}
  onClick={() => onDelete(task.id)}
  ...
>
```

---

## [BUG-014] Texto do botão de IA durante carregamento é genérico e sem contexto

**Severidade:** Baixa
**Prioridade:** P4
**Componente:** Frontend | UX

### Descrição

Durante o processamento da IA, o botão exibe "Carregando..." — texto genérico que não indica que a IA está trabalhando. Para requisições que levam entre 5 e 30 segundos, isso pode levar o usuário a acreditar que a operação travou.

### Evidência

`app/frontend/src/components/AiGenerator.tsx`, linha 101: `{isLoading ? 'Carregando...' : 'Gerar tarefas'}`.

### Sugestão de Correção

```tsx
{isLoading ? 'IA gerando tarefas...' : 'Gerar tarefas'}
```
Adicionar também um atributo `aria-busy="true"` durante o loading para acessibilidade.

---

## [BUG-015] API Key transmitida no corpo da requisição HTTP (risco de segurança)

**Severidade:** Alta
**Prioridade:** P2
**Componente:** Backend | Segurança

### Descrição

A API Key do usuário é enviada como campo `apiKey` no corpo do `POST /ai/generate`. Isso significa que a chave fica exposta no histórico de rede do browser (DevTools → Network), em logs de acesso do backend e em ferramentas de APM/monitoramento sem tratamento especial.

### Passos para Reproduzir

1. Abrir DevTools → aba Network
2. Inserir API Key e clicar em "Gerar tarefas"
3. Inspecionar o payload da requisição `POST /ai/generate`

### Resultado Esperado

A API Key deveria ser transmitida via header `Authorization: Bearer <key>` (padrão de mercado), que tem semântica bem definida e é tratada com cuidado por ferramentas de segurança.

### Resultado Obtido

A API Key aparece em plaintext no corpo JSON da requisição.

### Sugestão de Correção

Mover `apiKey` do body para o header `Authorization`, tanto no frontend quanto no backend.
