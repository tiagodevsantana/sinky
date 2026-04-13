# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-handling.spec.ts >> Tratamento de Erros >> Erros na geração por IA >> botão de geração é desabilitado durante o carregamento para evitar requisições duplicadas
- Location: tests/error-handling.spec.ts:201:9

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  getByTestId('ai-generate-button')
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" with timeout 5000ms
  - waiting for getByTestId('ai-generate-button')
    6 × locator resolved to <button data-testid="ai-generate-button">Carregando...</button>
      - unexpected value "enabled"
    3 × locator resolved to <button data-testid="ai-generate-button">Gerar tarefas</button>
      - unexpected value "enabled"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "Smart To-Do" [level=1] [ref=e5]
        - paragraph [ref=e6]: Powered by Sinky
      - generic [ref=e7]: 0 tarefas
    - generic [ref=e8]:
      - heading "Gerar tarefas com IA" [level=2] [ref=e9]
      - paragraph [ref=e10]: Descreva um objetivo e a IA irá decompô-lo em subtarefas acionáveis.
      - textbox "Sua API Key do OpenRouter (sk-or-v1-...)" [ref=e11]: qualquer-chave
      - generic [ref=e12]:
        - 'textbox "Ex: Lançar um novo produto de software" [ref=e13]'
        - button "Gerar tarefas" [active] [ref=e14] [cursor=pointer]
    - generic [ref=e16]:
      - textbox "Adicionar nova tarefa..." [ref=e17]
      - button "Adicionar" [ref=e18] [cursor=pointer]
    - list
  - alert [ref=e19]
```

# Test source

```ts
  123 | 
  124 |       await page.waitForFunction(
  125 |         () =>
  126 |           (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
  127 |             ?.textContent
  128 |             ?.trim() !== 'Carregando...',
  129 |         { timeout: 15000 },
  130 |       );
  131 | 
  132 |       // O usuário deve ver uma mensagem de erro
  133 |       const elementoErro = page.locator('[data-testid="ai-error-message"]');
  134 |       await expect(elementoErro).toBeVisible();
  135 |     });
  136 | 
  137 |     test('exibe mensagem de erro quando a API de IA atinge timeout', async ({
  138 |       page,
  139 |       aiGeneratorPage,
  140 |     }) => {
  141 |       // BUG-003: Este teste deve FALHAR com a implementação atual.
  142 |       await page.goto('/');
  143 | 
  144 |       await page.route(`${API_URL}/ai/generate`, async (route) => {
  145 |         await new Promise((resolve) => setTimeout(resolve, 500));
  146 |         route.fulfill({
  147 |           status: 504,
  148 |           contentType: 'application/json',
  149 |           body: JSON.stringify({ message: 'Gateway Timeout', statusCode: 504 }),
  150 |         });
  151 |       });
  152 | 
  153 |       await aiGeneratorPage.objectiveInput.fill('Testar timeout');
  154 |       await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
  155 |       await aiGeneratorPage.clickGenerate();
  156 | 
  157 |       await page.waitForFunction(
  158 |         () =>
  159 |           (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
  160 |             ?.textContent
  161 |             ?.trim() !== 'Carregando...',
  162 |         { timeout: 15000 },
  163 |       );
  164 | 
  165 |       const elementoErro = page.locator('[data-testid="ai-error-message"]');
  166 |       await expect(elementoErro).toBeVisible();
  167 |     });
  168 | 
  169 |     test('preserva o texto do objetivo após erro na geração por IA', async ({
  170 |       page,
  171 |       aiGeneratorPage,
  172 |     }) => {
  173 |       // BUG-003 + PRD-005: o objetivo não deve ser apagado em caso de erro.
  174 |       await page.goto('/');
  175 | 
  176 |       await page.route(`${API_URL}/ai/generate`, (route) => {
  177 |         route.fulfill({
  178 |           status: 500,
  179 |           contentType: 'application/json',
  180 |           body: JSON.stringify({ message: 'Erro no servidor', statusCode: 500 }),
  181 |         });
  182 |       });
  183 | 
  184 |       const objetivo = 'Lançar um produto de software';
  185 |       await aiGeneratorPage.objectiveInput.fill(objetivo);
  186 |       await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
  187 |       await aiGeneratorPage.clickGenerate();
  188 | 
  189 |       await page.waitForFunction(
  190 |         () =>
  191 |           (document.querySelector('[data-testid="ai-generate-button"]') as HTMLButtonElement)
  192 |             ?.textContent
  193 |             ?.trim() !== 'Carregando...',
  194 |         { timeout: 15000 },
  195 |       );
  196 | 
  197 |       // O objetivo deve ser mantido no campo para que o usuário possa tentar novamente
  198 |       await expect(aiGeneratorPage.objectiveInput).toHaveValue(objetivo);
  199 |     });
  200 | 
  201 |     test('botão de geração é desabilitado durante o carregamento para evitar requisições duplicadas', async ({
  202 |       page,
  203 |       aiGeneratorPage,
  204 |     }) => {
  205 |       // BUG-010: Este teste deve FALHAR com a implementação atual.
  206 |       // O botão não possui atributo disabled durante o carregamento.
  207 |       await page.goto('/');
  208 | 
  209 |       await page.route(`${API_URL}/ai/generate`, async (route) => {
  210 |         await new Promise((resolve) => setTimeout(resolve, 2000));
  211 |         route.fulfill({
  212 |           status: 200,
  213 |           contentType: 'application/json',
  214 |           body: JSON.stringify([]),
  215 |         });
  216 |       });
  217 | 
  218 |       await aiGeneratorPage.objectiveInput.fill('Testar desabilitar botão');
  219 |       await aiGeneratorPage.apiKeyInput.fill('qualquer-chave');
  220 |       await aiGeneratorPage.clickGenerate();
  221 | 
  222 |       // Durante o carregamento, o botão deve estar desabilitado
> 223 |       await expect(aiGeneratorPage.generateButton).toBeDisabled();
      |                                                    ^ Error: expect(locator).toBeDisabled() failed
  224 |     });
  225 |   });
  226 | 
  227 |   test.describe('DELETE /tasks/:id falha', () => {
  228 |     test('mantém a tarefa na lista quando a exclusão falha', async ({
  229 |       page,
  230 |       createTaskViaApi,
  231 |       taskListPage,
  232 |     }) => {
  233 |       const tarefa = await createTaskViaApi(`Exclusão falha ${Date.now()}`);
  234 |       await page.goto('/');
  235 |       await taskListPage.waitForLoaded();
  236 | 
  237 |       await page.route(`${API_URL}/tasks/${tarefa.id}`, (route) => {
  238 |         if (route.request().method() === 'DELETE') {
  239 |           route.fulfill({
  240 |             status: 500,
  241 |             contentType: 'application/json',
  242 |             body: JSON.stringify({ message: 'Erro Interno do Servidor', statusCode: 500 }),
  243 |           });
  244 |         } else {
  245 |           route.continue();
  246 |         }
  247 |       });
  248 | 
  249 |       await taskListPage.deleteTask(tarefa.title);
  250 | 
  251 |       // A tarefa deve permanecer visível pois a exclusão falhou
  252 |       await page.waitForTimeout(500);
  253 |       await expect(taskListPage.itemByTitle(tarefa.title)).toBeVisible();
  254 |     });
  255 |   });
  256 | });
  257 | 
```