# TEST-STRATEGY — Smart To-Do List

**Autor:** Tiago Santana
**Data:** 13 abr 2026

---

## 1. Análise de Risco

As funcionalidades abaixo são ordenadas por **risco ao negócio**, considerando impacto em caso de falha e probabilidade de ocorrência.

### 1.1 Risco Crítico

| Funcionalidade | Risco | Justificativa |
|---|---|---|
| **Persistência de conclusão de tarefas** | Perda de dados silenciosa | BUG-001: o estado não é salvo. Qualquer reload zera o progresso do usuário — risco direto de churn (personas Lucas e Marina). |
| **Geração por IA** | Falha silenciosa sem feedback | BUG-003: usuário não sabe o que deu errado. A geração por IA é a **feature diferencial** do produto — falha aqui impacta diretamente a métrica de 40% de adoção semanal. |
| **Segurança da API Key** | Exposição de credencial sensível | BUG-015: a chave aparece em plaintext em network logs, APM e proxies. Comprometer a chave tem impacto financeiro direto para o usuário. |

### 1.2 Risco Alto

| Funcionalidade | Risco | Justificativa |
|---|---|---|
| **Validação de inputs** | Dados inválidos no banco | BUG-002, BUG-011: títulos vazios ou de 10k caracteres passam sem erro. Dados corrompidos são difíceis de limpar depois. |
| **Criação manual de tarefas** | Fluxo de entrada principal | Sem criação funcionando, a aplicação inteira perde utilidade. Qualquer regressão aqui é crítica. |
| **Exclusão de tarefas** | Perda acidental de dados | Sem confirmação (PRD-004) e retorna 204 para IDs inexistentes (BUG-004). Risco de deleção silenciosa. |

### 1.3 Risco Médio

| Funcionalidade | Risco | Justificativa |
|---|---|---|
| **Ordenação da lista** | Inconsistência de UX | BUG-008: ordem não determinística desorientra o usuário e torna testes E2E frágeis. |
| **Estado vazio** | Abandono de novos usuários | BUG-012: first-time experience sem orientação nenhuma contradiz o objetivo de onboarding da feature de IA. |
| **Botão de IA sem disable** | Duplicação de dados | BUG-010: múltiplos cliques geram lotes de tarefas repetidas. Degradação de dados sem operação de desfazer. |

### 1.4 Risco Baixo

| Funcionalidade | Risco | Justificativa |
|---|---|---|
| **Acessibilidade** | Exclusão de usuários | BUG-013: botão sem aria-label. Impacto real em usuários com deficiência visual, com risco regulatório crescente. |
| **Consistência de erros da API** | Dificuldade de manutenção | BUG-009: shapes inconsistentes complicam tratamento de erro no frontend e em integrações futuras. |

---

## 2. Pirâmide de Testes

```
          ╔═══════════════╗
          ║   E2E (10%)   ║  ← Playwright: fluxos críticos end-to-end
         ╔╩═══════════════╩╗
         ║ Integração (30%) ║  ← API contracts, banco real via supertest
        ╔╩══════════════════╩╗
        ║   Unitário (60%)   ║  ← Services, DTOs, parsing da IA
       ╚════════════════════╝
```

### 2.1 Testes Unitários (60% — base da pirâmide)

**Onde:** `backend/src/**/*.spec.ts`
**Framework:** Jest (já disponível no NestJS)

Cobrir prioritariamente:
- `TasksService`: lógica de criação, atualização e exclusão com repositório mockado
- `AiService.generateSubtasks`: parsing de respostas JSON válidas, inválidas, parciais e vazias
- `CreateTaskDto` / `UpdateTaskDto`: validação dos decorators (`@IsNotEmpty`, `@IsBoolean`, `@MaxLength`)
- `useTasks` hook: lógica de estado (createTask, deleteTask, toggleComplete) com `api` mockado via `jest.mock`

**Critério de cobertura mínima:** 80% de branches nos módulos `tasks` e `ai`.

### 2.2 Testes de Integração (30%)

**Onde:** `backend/test/**/*.e2e-spec.ts`
**Framework:** Jest + Supertest + SQLite in-memory

Cobrir:
- `GET /tasks` → retorna array (incluindo estado vazio e com dados)
- `POST /tasks` → criação com dados válidos e inválidos (whitespace, campo ausente, título longo)
- `PATCH /tasks/:id` → atualização de `isCompleted` e `title`; 404 para ID inexistente
- `DELETE /tasks/:id` → exclusão bem-sucedida; **deve retornar 404** para ID inexistente (BUG-004 é um caso de teste de contrato)
- `POST /ai/generate` → mock do axios para simular resposta válida, timeout, 401 e resposta mal formatada

**Por que banco real?** Mocks de repositório mascaram bugs de SQL gerado pelo TypeORM (ex: ausência de ORDER BY que o BUG-008 evidencia). Um banco SQLite in-memory é suficientemente rápido e sem riscos.

### 2.3 Testes E2E (10% — topo da pirâmide)

**Onde:** `e2e/`
**Framework:** Playwright + TypeScript

Cobrir apenas os **happy paths e cenários de maior risco** — não substituir os testes de integração:
- Criação de tarefa manual (incluindo edge cases de validação)
- Toggle de conclusão com verificação de persistência após reload
- Exclusão de tarefa com confirmação de ausência na lista
- Estado vazio da interface
- Comportamento de erro de API (via `page.route()`)

A suíte E2E deve rodar em tempo razoável (<2 min em CI) — por isso, cenários de edge case que podem ser cobertos em integração **não devem** ser duplicados em E2E.

### 2.4 Testes de Contrato de API (Bônus B1)

Usando Playwright `request` context, cobrir os contratos de schema das respostas:
- Campos obrigatórios presentes (`id`, `title`, `isCompleted`, `isAiGenerated`, `createdAt`)
- Tipos corretos (`id` é UUID, `isCompleted` é boolean, `createdAt` é ISO 8601)
- Envelopes de erro consistentes

---

## 3. Processo — O que Mudar para Antecipar Problemas

### 3.1 Shift-Left: QA entra no refinamento, não só no final

O principal aprendizado desta auditoria é que **todos os bugs críticos encontrados (BUG-001, BUG-002, BUG-003, BUG-006, BUG-015) poderiam ter sido evitados** se o QA tivesse participado da fase de refinamento de requisitos. Os PRD-001, PRD-005 e PRD-006 apontam lacunas que foram diretamente para o código.

**Proposta:** QA participa de todas as sessões de refinamento. O ticket só vai para desenvolvimento quando os critérios de aceitação incluem pelo menos: happy path, casos de borda e comportamento em caso de erro.

### 3.2 Definition of Ready (DoR) com checklist de QA

Antes de mover um ticket para "Em desenvolvimento", o QA deve assinar a DoR respondendo:
- [ ] O limite de tamanho de inputs está definido?
- [ ] O comportamento em falha de rede está definido?
- [ ] A UX de estados de erro está especificada?
- [ ] Há critério de aceitação testável para cada AC?

### 3.3 Definition of Done (DoD) inclui testes

Nenhum PR é mergeado sem:
- Testes unitários passando para a lógica de negócio nova/alterada
- Nenhuma regressão nos testes de integração existentes
- Code review de QA para features de frontend (não apenas de código, mas de testabilidade: `data-testid` presentes, aria-labels adequados)

### 3.4 Revisão de PRD como entregável formal

O documento `PRD-REVIEW.md` deve ser produzido pelo QA para **toda feature nova** antes do início do desenvolvimento. Isso força a identificação de ambiguidades (como PRD-002, PRD-004, PRD-008) antes que se tornem bugs em produção.

### 3.5 Monitoramento e alertas em produção

Dado que o BUG-003 (falha silenciosa da IA) só seria detectado por usuários reclamando, adicionar:
- Monitoramento de taxa de erro do endpoint `POST /ai/generate`
- Alerta automático quando a taxa de erro superar 5% em 5 minutos
- Log estruturado de erros com contexto (sem logar a API Key) para facilitar debugging

### 3.6 Testes de regressão em CI/CD

A suíte E2E deve rodar em todo PR contra um ambiente de staging com banco zerado. O histórico de testes deve ser publicado como artefato (relatório HTML do Playwright) para que o histórico de estabilidade seja visível.
