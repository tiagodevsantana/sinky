# PRD-REVIEW — Smart To-Do List

**Revisor:** Tiago Santana
**Data:** 13 abr 2026
**Documento base:** PRD v1.2 (18 mar 2026)

---

## [PRD-001] Ausência de regras de validação para o título da tarefa (RF-02)

**Requisito afetado:** RF-02
**Categoria:** Requisito ausente | Critério de aceitação incompleto

### Problema identificado

O RF-02 afirma que "o usuário deve poder criar uma nova tarefa inserindo o **título** da tarefa", mas o PRD não especifica:
- Comprimento mínimo e máximo do título
- Se títulos compostos apenas de espaços em branco são válidos
- Caracteres proibidos (HTML, scripts, emojis, etc.)
- Comportamento em caso de título duplicado

### Por que isso é um risco

Sem essas regras, o time de desenvolvimento toma decisões por conta própria, gerando inconsistências entre frontend e backend. Na prática, isso já causou o BUG-002 (aceitar títulos só com espaços) e BUG-011 (ausência de limite de tamanho), descobertos durante a auditoria da aplicação.

### Sugestão de melhoria

> **RF-02 — Validação do título:**
> - O título deve ter entre **1 e 255 caracteres** após remoção de espaços nas extremidades.
> - Títulos compostos exclusivamente de espaços em branco **não devem ser aceitos**.
> - O sistema deve exibir mensagem de erro inline abaixo do campo quando a validação falhar.
> - Títulos duplicados são permitidos (sem restrição de unicidade).

---

## [PRD-002] Toggle de tarefa (desconcluir) não está especificado (RF-03)

**Requisito afetado:** RF-03
**Categoria:** Requisito ausente | Ambiguidade

### Problema identificado

O RF-03 descreve apenas a ação de **marcar como concluída**, mas não menciona se o usuário pode **desmarcar** (reverter para "pendente"). A interface implementada usa um checkbox com comportamento de toggle, mas essa decisão foi tomada pelo time de desenvolvimento sem respaldo no PRD.

### Por que isso é um risco

Se o comportamento de toggle não for intencional, pode haver inconsistências de UX (o usuário marca por engano e não consegue desfazer). Se for intencional e não estiver documentado, a ausência de critério de aceitação impede a validação correta e a cobertura de testes.

### Sugestão de melhoria

> **RF-03 — Toggle bidirecional:**
> - O usuário pode marcar **e desmarcar** uma tarefa através do mesmo elemento interativo (checkbox).
> - Ambas as transições (pendente → concluída e concluída → pendente) devem persistir no banco.
> - Adicionar critério de aceitação: "Ao desmarcar uma tarefa concluída, ela retorna ao estado pendente e a mudança persiste."

---

## [PRD-003] Ausência de comportamento de erro em RF-03 (persistência falha)

**Requisito afetado:** RF-03
**Categoria:** Requisito ausente | Risco técnico

### Problema identificado

O RF-03 diz que "a mudança de estado deve persistir", mas não especifica o que acontece quando a persistência **falha** (ex: backend indisponível, erro de rede). O critério de aceitação também não contempla esse cenário.

### Por que isso é um risco

Sem tratamento de erro especificado, a implementação pode atualizar o estado visual otimisticamente e nunca reverter em caso de falha, levando o usuário a acreditar que a tarefa foi concluída quando na verdade não foi. Esse tipo de erro silencioso foi identificado como preocupação para a persona Marina ("baixa tolerância para erros silenciosos").

### Sugestão de melhoria

> Adicionar ao RF-03: "Se a atualização do estado falhar no servidor, o sistema deve reverter o estado visual ao valor anterior e exibir uma mensagem de erro para o usuário."

---

## [PRD-004] Ausência de confirmação antes da exclusão (RF-04)

**Requisito afetado:** RF-04
**Categoria:** Requisito ausente | Critério de aceitação incompleto

### Problema identificado

O RF-04 descreve apenas a ação de exclusão e o resultado esperado ("a tarefa não deve mais aparecer"), sem mencionar se há algum mecanismo de confirmação ou possibilidade de desfazer a ação.

### Por que isso é um risco

A exclusão é uma ação **irreversível**. Sem confirmação, um toque acidental em dispositivos móveis (lembre-se: Marina usa o celular) pode apagar tarefas geradas por IA que o usuário não deseja perder. Isso é um risco direto de abandono da plataforma.

### Sugestão de melhoria

> Definir explicitamente uma das opções:
> - **Opção A (simples):** Adicionar diálogo de confirmação: "Tem certeza que deseja excluir esta tarefa?"
> - **Opção B (melhor UX):** Implementar desfazer com toast temporário ("Tarefa excluída. [Desfazer]") por 5 segundos, sem diálogo bloqueante.

---

## [PRD-005] Ausência de estados de erro para a geração por IA (RF-05)

**Requisito afetado:** RF-05
**Categoria:** Requisito ausente | Critério de aceitação incompleto

### Problema identificado

O RF-05 especifica o **caminho feliz** (indicador de carregamento + tarefas aparecem ao final), mas não define comportamentos para os cenários de falha:
- API Key inválida ou expirada
- Timeout da requisição à IA
- Resposta da IA em formato inesperado
- Provedor de IA indisponível

### Por que isso é um risco

Os próprios "Riscos Técnicos" listados na seção 8 do PRD reconhecem que "respostas não estruturadas ou parciais da IA podem causar falhas no parsing" e que "latência variável pode impactar a percepção de qualidade". Porém, nenhum critério de aceitação endereça esses cenários. Na prática, o BUG-003 mostra que a aplicação já entrega uma falha silenciosa (spinner some, nada acontece).

### Sugestão de melhoria

> Adicionar critérios de aceitação ao RF-05:
> - [ ] Em caso de API Key inválida, exibir mensagem específica: "API Key inválida. Verifique sua chave no OpenRouter."
> - [ ] Em caso de timeout (>30s), exibir: "A IA demorou mais do que o esperado. Tente novamente."
> - [ ] Em caso de resposta mal formatada, exibir: "Não foi possível interpretar a resposta da IA. Tente reformular seu objetivo."
> - [ ] O campo de objetivo deve ser **preservado** em caso de erro, para que o usuário não precise redigitar.

---

## [PRD-006] Armazenamento e segurança da API Key não especificados (RF-06)

**Requisito afetado:** RF-06
**Categoria:** Segurança | Requisito ausente

### Problema identificado

O RF-06 descreve apenas que "a interface deve disponibilizar um campo para o usuário inserir a chave", mas não especifica:
- Como a chave deve ser armazenada no cliente (memória volátil, `localStorage`, `sessionStorage`, cookie)
- Se a chave deve persistir entre sessões
- Se a chave deve ser mascarada no campo (tipo `password`)
- Como a chave deve ser transmitida ao backend (header de autorização vs. body da requisição)
- Se a chave deve ser validada antes de tentar gerar tarefas

### Por que isso é um risco

Armazenar uma API Key em `localStorage` a expõe a ataques XSS. Transmiti-la no corpo da requisição HTTP significa que ela aparece em logs de servidor, em ferramentas de monitoramento e no histórico do navegador (network tab). O PRD fala em "provedor de IA externo" como dependência crítica — comprometer a chave do usuário pode ter impacto financeiro direto.

### Sugestão de melhoria

> Adicionar ao RF-06:
> - A API Key deve ser armazenada **apenas em memória de sessão** (não persistida em `localStorage` ou cookies sem flag `httpOnly`).
> - O campo de entrada deve ser do tipo `password` para mascarar a chave.
> - A chave deve ser transmitida ao backend via **header `Authorization: Bearer <key>`**, nunca no corpo da requisição.
> - Adicionar RNF de segurança: toda comunicação entre frontend e backend deve ocorrer via **HTTPS em produção**.

---

## [PRD-007] Ausência de requisitos de desempenho (RNF)

**Requisito afetado:** RNF
**Categoria:** Requisito ausente | Risco técnico

### Problema identificado

Os RNFs cobrem compatibilidade, responsividade e disponibilidade, mas não definem nenhum **target de desempenho**:
- Tempo máximo para operações CRUD (criação, listagem, exclusão)
- Timeout para a operação de geração por IA (definido no código como 30s, mas não no PRD)
- Tamanho máximo da lista de tarefas sem degradação de performance

### Por que isso é um risco

A persona Lucas tem "alta tolerância técnica mas pouca paciência para lentidão". Sem SLAs de desempenho documentados, não há critério objetivo para reprovar uma entrega que seja "lenta demais". O time de QA não sabe quando falhar um teste de performance.

### Sugestão de melhoria

> Adicionar ao capítulo 5 — RNFs:
> - **Performance:** Operações CRUD devem ser concluídas em menos de 500ms em condições normais de carga.
> - **IA:** A requisição de geração de tarefas deve ter timeout de 30 segundos, com indicador de progresso ativo durante todo o período.
> - **Listagem:** A interface deve renderizar até 100 tarefas sem degradação perceptível de performance.

---

## [PRD-008] Ordenação da lista de tarefas não especificada (RF-01)

**Requisito afetado:** RF-01
**Categoria:** Ambiguidade | Critério de aceitação incompleto

### Problema identificado

O RF-01 diz que o sistema deve "exibir todas as tarefas em uma lista unificada", mas não define a **ordem** em que as tarefas são apresentadas. A aplicação atual não aplica nenhum ORDER BY na query, resultando em ordem não determinística.

### Por que isso é um risco

Usuários que adicionam tarefas sequencialmente esperam vê-las em uma ordem consistente. Recarregar a página pode reordenar a lista, causando confusão e percepção de instabilidade. Testes automatizados que dependem de posição podem ser flaky.

### Sugestão de melhoria

> Adicionar ao RF-01: "As tarefas devem ser exibidas em **ordem cronológica de criação** (mais antigas primeiro). Tarefas geradas por IA aparecem em sequência conforme a ordem retornada pelo modelo."

---

## [PRD-009] Comportamento da UI quando a lista está vazia não especificado (RF-01)

**Requisito afetado:** RF-01
**Categoria:** Requisito ausente | Critério de aceitação incompleto

### Problema identificado

O critério de aceitação de RF-01 não cobre o estado vazio da aplicação (quando o usuário ainda não criou nenhuma tarefa). A implementação atual renderiza uma lista vazia sem nenhum feedback ao usuário.

### Por que isso é um risco

Para novos usuários (que são exatamente o público-alvo da feature de IA, conforme seção 2), a primeira experiência na plataforma é uma tela vazia sem qualquer orientação. Isso contradiz o objetivo de "reduzir a fricção de planejamento" e aumenta a chance de abandono precoce.

### Sugestão de melhoria

> Adicionar critério de aceitação ao RF-01:
> - [ ] Quando não há tarefas, a lista exibe uma mensagem de estado vazio com call-to-action, ex: "Nenhuma tarefa ainda. Descreva um objetivo acima para começar com a ajuda da IA."

---

## [PRD-010] Ausência de requisitos de acessibilidade (RNF)

**Requisito afetado:** RNF
**Categoria:** Acessibilidade | Requisito ausente

### Problema identificado

O PRD não menciona nenhum requisito de acessibilidade. Não há referência a WCAG, uso de leitores de tela, navegação por teclado, contraste mínimo ou semântica HTML.

### Por que isso é um risco

A ausência desse requisito levou a problemas concretos na implementação: botões sem `aria-label`, campos sem `<label>` associado, e falta de atributos `role` adequados. Além do impacto em usuários com deficiência, há risco regulatório (LGPD e futuras regulações de acessibilidade digital no Brasil).

### Sugestão de melhoria

> Adicionar ao capítulo 5 — RNFs:
> - **Acessibilidade:** A interface deve estar em conformidade com **WCAG 2.1 nível AA** para os fluxos críticos (criação de tarefa, marcação de conclusão, exclusão).
> - Todos os elementos interativos devem ser acessíveis via teclado.
> - Imagens e ícones funcionais devem ter atributos `alt` ou `aria-label` descritivos.

---

## [PRD-011] Modelo de IA não definido — questão Q3 permanece em aberto (RF-05, RF-06)

**Requisito afetado:** RF-05, RF-06
**Categoria:** Ambiguidade | Risco técnico

### Problema identificado

A seção 9 (Questões em Aberto) lista a questão Q3 — "Qual provedor de IA será o padrão?" — com status "Em definição". O PRD foi aprovado para desenvolvimento com essa questão em aberto. A aplicação usa `mistralai/mistral-7b-instruct:free` no README mas o código-fonte usa `google/gemma-3-4b-it:free`, evidenciando a falta de alinhamento causada por essa indefinição.

### Por que isso é um risco

Diferentes modelos têm capacidades distintas de seguir instruções de formato (ex: retornar JSON puro). Um modelo que ignore o formato solicitado causa falhas no parsing. A inconsistência entre documentação e código (dois modelos diferentes mencionados) indica que essa decisão foi tomada de forma ad hoc, gerando risco de regressão não rastreada.

### Sugestão de melhoria

> Fechar Q3 antes da aprovação para desenvolvimento:
> - Definir o modelo padrão e documentar no PRD.
> - Adicionar ao RF-05 o critério de fallback: "Se o modelo padrão não estiver disponível, o sistema deve exibir mensagem de erro apropriada."
> - Versionar o modelo utilizado junto com a versão do PRD para rastreabilidade.
