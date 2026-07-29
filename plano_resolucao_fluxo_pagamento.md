# Plano de Resolução — Fluxo Compra → Webhook Asaas → Acesso ao App

> **Base:** `diagnostico_fluxo_pagamento_acesso.md`
> **Formato:** fases independentes, projetadas para execução em **Ralph loop** (uma fase por iteração do agente).
> **Regra de ouro do loop:** execute **UMA fase por iteração**, na ordem indicada. Ao final de cada fase, rode a verificação dela e só avance se o critério de conclusão (DoD) estiver 100% atendido.

---

## Como executar este plano em Ralph loop

1. Cada fase abaixo é **autocontida**: tem objetivo, contexto, arquivos, tarefas atômicas, verificação e DoD (Definition of Done).
2. O prompt de cada iteração do loop deve ser: *"Execute a FASE N do arquivo `plano_resolucao_fluxo_pagamento.md`, respeitando o contexto, as tarefas e o DoD. Não toque em outras fases."*
3. **Ordem e dependências:**

```
FASE 0 (manual) ──┐
                  ├──> FASE 1 ──> FASE 2 ──> FASE 3 ──> FASE 4 ──> FASE 5 ──> FASE 6
                  (config)      (webhook)   (vínculo)  (rules)    (email)    (UX LP)    (E2E/prod)
```

- Fases 1, 2, 3 e 5 são **independentes em código** entre si — mas a validação final (Fase 6) exige todas.
- Fase 4 depende da Fase 1 (o email é disparado pelo webhook corrigido).
- Fase 0 é **manual** (console Asaas/Netlify/Firebase) — o agente não consegue executá-la sozinho; deixe para o humano ou para o final da Fase 6.
4. Sugestão de branch por fase: `fix/fase-N-<nome-curto>`.

---

## FASE 0 — Pré-requisitos manuais (configuração de ambiente)

> ⚠️ **Fase manual** — executada por humano nos consoles. O agente pode apenas gerar lembretes/checklists.

### 🎯 Objetivo
Garantir que todas as credenciais e variáveis existam antes/depois das mudanças de código.

### ✅ Tarefas

- [ ] **0.1** Netlify da **Landing Page**: confirmar/env vars:
  - `ASAAS_API_KEY` = chave de **produção** (`$aact_prod_...`)
  - `ASAAS_ENVIRONMENT` = `production`
  - `NODE_ENV` = `production`
- [ ] **0.2** Gerar token forte para o webhook (ex.: `openssl rand -hex 32`). Guardar no cofre de senhas.
- [ ] **0.3** Firebase (projeto `fluentoria-527b2`): cadastrar secrets que a Fase 1 vai usar:
  ```bash
  cd "c:\Users\HP NOTEBOOK\Documents\0Projetos\Fluentoria\functions"
  firebase functions:secrets:set ASAAS_WEBHOOK_TOKEN
  firebase functions:secrets:set ASAAS_API_KEY
  ```
- [ ] **0.4** Painel Asaas → **Configurações → Webhooks**: anotar a URL atualmente configurada (para confirmar o problema 2.3 do diagnóstico). **Não alterar ainda** — a troca é feita na Fase 6.

### 🏁 DoD
- [ ] Variáveis do Netlify confirmadas; secrets do Firebase criados; token do webhook gerado e guardado.

---

## FASE 1 — Webhook Firebase funcional (núcleo da liberação automática)

### 🎯 Objetivo
Fazer a Firebase Function `asaasWebhook` processar **de verdade** os eventos do Asaas: autenticar corretamente, localizar o cliente, ativar/revogar acesso e ser idempotente.

### 📂 Arquivos

- `Fluentoria/functions/src/index.js` ← principal
- `Fluentoria/functions/package.json` (versão do `firebase-functions` precisa suportar v2/params — ver tarefa 1.1)
- `Landing Page/netlify/functions/asaasWebhook.js` (aposentar)

### 🧠 Contexto necessário

- Payload real do Asaas: `{ event, payment: { id, customer: "cus_...", externalReference, status, ... } }` — **não existe** `req.body.customer.email`.
- O token de autenticação do webhook chega no header **`asaas-access-token`** (não `x-asaas-access-token`).
- `functions.config()` está obsoleto (Runtime Config API descontinuada) → usar `defineSecret`/`defineString` de `firebase-functions/params`.
- A LP envia `externalReference = JSON.stringify({ courseId, timestamp })` — o parser `parseCourseIdFromExternalReference` já trata isso; **manter**.
- Para obter o email do pagador: chamar `GET {baseUrl}/customers/{payment.customer}` com header `access_token: ASAAS_API_KEY`. Base URL: `https://www.asaas.com/api/v3` (prod) / `https://sandbox.asaas.com/api/v3` (sandbox). Fallback: buscar em `/users` por `asaasCustomerId == payment.customer` (cobre re-pagamentos de clientes já vinculados, sem chamada extra).

### ✅ Tarefas

- [ ] **1.1** Em `functions/package.json`: garantir `firebase-functions` **v4+** (suporte a `defineSecret` e triggers v1 legados). Ajustar `engines.node` para `18` ou `20`. Rodar `npm install` na pasta `functions`.
- [ ] **1.2** Reescrever a autenticação do webhook:
  - Ler token via `defineSecret('ASAAS_WEBHOOK_TOKEN')` e API key via `defineSecret('ASAAS_API_KEY')`; `defineString('ASAAS_ENVIRONMENT', { default: 'production' })`.
  - Comparar com o header `asaas-access-token` usando `crypto.timingSafeEqual` (manter fail-closed se secret ausente).
  - Declarar os secrets na function: `functions.runWith({ secrets: ['ASAAS_WEBHOOK_TOKEN', 'ASAAS_API_KEY'] }).https.onRequest(...)` (v1) ou migrar para v2 `onRequest({ secrets: [...] }, ...)`.
- [ ] **1.3** Corrigir a resolução do cliente (ordem):
  1. Buscar `/users` onde `asaasCustomerId == payment.customer` → se achar, usar esse email/doc.
  2. Senão, `GET /customers/{payment.customer}` na API Asaas → obter `email` e `name`.
  3. Se ainda assim não houver email → logar e responder 400 (como hoje).
- [ ] **1.4** Manter a lógica de ativação (users + `user_courses` via `courseId` do `externalReference`), mas trocar logs de objeto inteiro por logs sanitizados (nunca logar payload completo do pagamento).
- [ ] **1.5** **Idempotência**: antes de processar, gravar/verificar doc em `webhook_events/{payment.id + '_' + event}`:
  - Se existir com `processed: true` → responder 200 `{ duplicate: true }`.
  - Criar com `processed: false` no início e marcar `true` ao final (transação ou `set` com merge).
- [ ] **1.6** Tratar **`PAYMENT_REFUNDED`** e **`PAYMENT_DELETED`** (espelho do `PAYMENT_OVERDUE`, mas definitivo):
  - Marcar `user_courses` do `courseId` como `status: 'refunded'` (ou `'canceled'`).
  - Se não restar nenhum curso `active` → `accessAuthorized: false`, `paymentStatus: 'refunded'`, `planStatus: 'canceled'`.
  - Respeitar `manualAuthorization === true` (não revogar manuais).
- [ ] **1.7** Aposentar o webhook da LP: substituir o corpo de `Landing Page/netlify/functions/asaasWebhook.js` por um stub que retorna `410 Gone` com mensagem apontando que o endpoint oficial é a Firebase Function (evita que alguém configure a URL errada no futuro). Manter CORS/segurança existentes.
- [ ] **1.8** Atualizar `Fluentoria/functions/README.md`: nova variável de ambiente (secrets), header correto, eventos tratados.

### 🧪 Verificação

```bash
cd "c:\Users\HP NOTEBOOK\Documents\0Projetos\Fluentoria\functions"
npm install
node -e "require('./src/index.js'); console.log('OK: módulo carrega sem erro')"
```

Teste local com emulador (sem chamar Asaas de verdade — mockar `fetch` ou usar sandbox):
```bash
firebase emulators:start --only functions,firestore
# POST para http://localhost:5001/fluentoria-527b2/us-central1/asaasWebhook
# Header: asaas-access-token: <token>
# Body: {"event":"PAYMENT_CONFIRMED","payment":{"id":"pay_teste1","customer":"cus_...","externalReference":"{\"courseId\":\"Jgcb9yX5Xxp8o6UMYTmX\"}"}}
```
Validar no emulador do Firestore: usuário criado/atualizado com `accessAuthorized: true` e `user_courses` ativo; reenvio do mesmo payload retorna `duplicate: true` sem duplicar dados.

### 🏁 DoD
- [ ] Webhook autentica via `asaas-access-token` + secret (fail-closed).
- [ ] `PAYMENT_CONFIRMED` ativa acesso usando email obtido da API Asaas (ou match por `asaasCustomerId`).
- [ ] `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED` revogam corretamente.
- [ ] Reenvio do mesmo evento é idempotente.
- [ ] Webhook da LP responde 410.
- [ ] Módulo carrega sem erros e teste de emulador passa.

---

## FASE 2 — Vínculo pagamento ↔ conta (adoção do doc órfão no cadastro)

### 🎯 Objetivo
Eliminar o "Acesso Pendente permanente": quando o aluno se cadastrar **depois** de pagar, o app deve herdar automaticamente o acesso registrado no doc criado pelo webhook.

### 📂 Arquivos

- `Fluentoria/lib/db/admin.ts` (`createOrUpdateUser`)
- `Fluentoria/lib/db/students.ts` (`findAndMergeStudentByEmail` — adaptar ou substituir)
- `Fluentoria/test/db/` (adicionar teste)

### 🧠 Contexto necessário

- Hoje: webhook cria `/users/{idAleatório}` (com `accessAuthorized: true`, `asaasCustomerId`, `paymentStatus`) e `user_courses` com `userId = idAleatório`. No cadastro, `findAndMergeStudentByEmail` só atualiza nome/foto no doc aleatório; `/users/{authUID}` nunca é criado.
- O gate do app (`checkUserAccess`) consulta **somente** pelo `authUID`.
- A mesma adoção resolve o caso do admin que cadastra o aluno manualmente antes do primeiro login.

### ✅ Tarefas

- [ ] **2.1** Criar função `adoptOrphanUserByEmail(uid, email, userData)` em `lib/db/admin.ts` (ou `students.ts`), que executa em **batch**:
  1. Query `/users` onde `email == email.toLowerCase()`, excluindo o próprio `uid`.
  2. Se não houver candidato → retornar `false` (fluxo atual de criação normal).
  3. Se houver: pegar o doc mais "completo" (preferir o que tem `accessAuthorized === true` ou `asaasCustomerId`).
  4. `setDoc(/users/{uid})` mesclando: dados do órfão (`accessAuthorized`, `paymentStatus`, `planStatus`, `asaasCustomerId`, `planType`, `planValue`, `planStartDate`, `planEndDate`, `manualAuthorization`, `role` — nunca deixar o órfão rebaixar um admin) + `email`, `displayName`/`photoURL` do cadastro, `lastLogin: new Date()`.
  5. Re-apontar todos os `user_courses` com `userId == idOrfão` para `userId == uid` (update em batch).
  6. Deletar o(s) doc(s) órfão(s) de `/users`.
  7. Retornar `true`.
- [ ] **2.2** Em `createOrUpdateUser`: quando `/users/{uid}` não existir, chamar `adoptOrphanUserByEmail` **no lugar** de `findAndMergeStudentByEmail`; se retornar `false`, manter a criação atual (novo aluno sem pagamento).
- [ ] **2.3** Manter `findAndMergeStudentByEmail` para usos legados, mas marcar `@deprecated` apontando para a nova função. Verificar que nenhum outro call site quebra (`Auth.tsx` chama só `createOrUpdateUser`).
- [ ] **2.4** Tratar corrida: se dois logins acontecerem ao mesmo tempo, o segundo encontra `/users/{uid}` já criado e segue o fluxo normal (o `getDoc` inicial já cobre).
- [ ] **2.5** Escrever teste em `test/db/` (seguindo o padrão existente com mocks do Firestore): simular órfão com `accessAuthorized: true` + `user_courses`, chamar `createOrUpdateUser`, assertar que `/users/{uid}` ficou autorizado e o curso foi re-apontado.

### 🧪 Verificação

```bash
cd "c:\Users\HP NOTEBOOK\Documents\0Projetos\Fluentoria"
npx vitest run test/db
```

Teste manual E2E parcial (com emulador ou projeto de teste): criar doc órfão simulando webhook → cadastrar usuário com o mesmo email → login deve liberar o app sem "Acesso Pendente".

### 🏁 DoD
- [ ] Cadastro após pagamento herda acesso automaticamente (sem intervenção do admin).
- [ ] `user_courses` re-apontados para o `authUID`; doc órfão removido.
- [ ] Testes unitários passando; comportamento para usuário sem pagamento permanece igual (cria pendente).

---

## FASE 3 — Hardening das Firestore Rules (fechar bypass de pagamento)

### 🎯 Objetivo
Impedir que qualquer aluno autenticado se auto-libere (`accessAuthorized`), vire admin ou conceda cursos a si mesmo.

### 📂 Arquivos

- `Fluentoria/firestore.rules`
- `Fluentoria/lib/db/userCourses.ts` (`grantCourseAccess`)

### 🧠 Contexto necessário

- Call sites legítimos já identificados:
  - `components/Students.tsx` → `grantCourseAccess(..., 'manual')` / `revokeCourseAccess` (admin UI).
  - `components/Settings.tsx` → `updateStudentAccess`, `syncAllStudentsWithAsaas` (admin UI).
  - Webhook usa **Admin SDK** → **não é afetado por rules**.
- App escreve no próprio `/users/{uid}` apenas: `displayName`, `photoURL`, `lastLogin` (via `createOrUpdateUser` e Profile). Campos sensíveis: `role`, `accessAuthorized`, `paymentStatus`, `planStatus`, `manualAuthorization`, `asaasCustomerId`, `planType`, `planValue`, `planStartDate`, `planEndDate`.

### ✅ Tarefas

- [ ] **3.1** Reescrever a regra de `users/{userId}`:
  ```
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isOwner(userId)
    && !request.resource.data.keys().hasAny(['role','accessAuthorized','paymentStatus','planStatus','manualAuthorization','asaasCustomerId'])
    || isAdmin();
  allow update: if isAdmin() || (isOwner(userId)
    && request.resource.data.diff(resource.data).affectedKeys()
         .hasOnly(['name','displayName','photoURL','lastLogin']));
  allow delete: if isAdmin();
  ```
  (ajustar a lista de campos permitidos conforme o que o app realmente escreve — validar com grep por `updateDoc(doc(db, USERS_COLLECTION` no código).
- [ ] **3.2** Regra de `user_courses/{docId}`:
  ```
  allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
  allow create, update, delete: if isAdmin();
  ```
- [ ] **3.3** Em `lib/db/userCourses.ts` → `grantCourseAccess`: remover o bypass — chamar `requireAdmin()` **sempre** (webhook não usa esse arquivo; usa Admin SDK).
- [ ] **3.4** Deploy das rules: `firebase deploy --only firestore:rules`.
- [ ] **3.5** (Opcional, recomendado) Adicionar testes de rules com `@firebase/rules-unit-testing` cobrindo: aluno tentando setar `accessAuthorized` (deve falhar), aluno criando `user_courses` (deve falhar), admin fazendo ambos (deve passar), aluno lendo o próprio `user_courses` (deve passar).

### 🧪 Verificação

- `npx vitest run` (app continua verde).
- Smoke test manual: login como **admin** → tela Alunos → conceder/revogar curso (deve funcionar). Login como **aluno** → app carrega normalmente; tentativa via console de `updateDoc` em `accessAuthorized` deve dar `PERMISSION_DENIED`.

### 🏁 DoD
- [ ] Auto-escalação bloqueada (rules + testes).
- [ ] Fluxos admin de `Students.tsx` e `Settings.tsx` continuam funcionando.
- [ ] Rules deployadas.

---

## FASE 4 — Email pós-compra (boas-vindas + link de acesso)

### 🎯 Objetivo
Cumprir a promessa da `sucesso.html`: o comprador recebe um email com instruções e link para acessar o app.

### 📂 Arquivos

- `Fluentoria/functions/src/index.js` (disparo no webhook, após ativação)
- Novo: `Fluentoria/functions/src/lib/mailer.js` (ou similar)
- `Fluentoria/functions/package.json` (dependência de email)

### 🧠 Contexto necessário

- Decisão de provedor (escolher UMA e documentar):
  - **Opção A (simples, recomendada):** Firebase Extension **"Trigger Email"** (`firestore-send-email`) — o webhook só grava um doc em `/mail`; zero código de SMTP.
  - **Opção B:** Nodemailer + SMTP (SendGrid/Resend/etc.) com credenciais em secrets.
- Conteúdo mínimo do email: saudação com nome, plano comprado, link `https://fluentoria.netlify.app/`, instrução de usar **o mesmo email da compra** no cadastro.
- Só enviar no evento de **ativação** (`PAYMENT_RECEIVED/CONFIRMED`), **uma vez por pagamento** (usar a coleção de idempotência da Fase 1: campo `welcomeEmailSent: true`).
- Não quebrar o webhook se o email falhar: `try/catch` isolado, logar e seguir (acesso já foi liberado).

### ✅ Tarefas

- [ ] **4.1** Escolher o provedor (A ou B) e registrar a decisão no topo de `functions/src/lib/mailer.js` (ou no README da functions).
- [ ] **4.2** Implementar `sendWelcomeEmail({ email, name, planName })`:
  - Opção A: `db.collection('mail').add({ to: email, message: { subject, html } })`.
  - Opção B: transporter Nodemailer com secrets `SMTP_URL` (ou host/user/pass).
- [ ] **4.3** No handler de `PAYMENT_RECEIVED/CONFIRMED` (Fase 1), após ativação bem-sucedida e dentro da marcação de idempotência: se `welcomeEmailSent` não estiver marcado → enviar email e marcar `welcomeEmailSent: true`.
- [ ] **4.4** Template do email (HTML simples, identidade laranja `#FF6A00`/fundo escuro): incluir nome, plano (derivar do `courseId` → buscar título em `/courses`), link do app, aviso do "mesmo email".
- [ ] **4.5** Tratar falha de envio sem derrubar o webhook (catch + log + métrica).

### 🧪 Verificação

- Emulador: disparar `PAYMENT_CONFIRMED` de teste → verificar doc criado em `/mail` (Opção A) ou log de envio (Opção B, usando Ethereal/Mailtrap em dev).
- Reenviar o mesmo evento → email **não** é reenviado (idempotência).

### 🏁 DoD
- [ ] Email de boas-vindas enviado uma única vez por pagamento confirmado.
- [ ] Falha de email não afeta a liberação de acesso.
- [ ] `sucesso.html` passa a dizer a verdade (ajuste fino de copy na Fase 5).

---

## FASE 5 — Correções de UX na Landing Page

### 🎯 Objetivo
Corrigir os bugs de passagem de email para a tela de sucesso e alinhar a copy com a realidade.

### 📂 Arquivos

- `Landing Page/app.js`
- `Landing Page/sucesso.html`

### 🧠 Contexto necessário

- `app.state.formData` nunca é populado (o formulário é lido direto do DOM em `processAsaasPayment`).
- `sucesso.html` lê `?email=` da URL; `sessionStorage('userEmail')` é gravado mas nunca lido.
- O texto "Você também receberá estas instruções por email" só é verdade após a Fase 4.

### ✅ Tarefas

- [ ] **5.1** Em `processAsaasPayment` (após ler os campos): preencher `this.state.formData = { name, email, phone, cpf, postalCode, addressNumber }`.
- [ ] **5.2** Nos 3 botões "Ver Instruções de Acesso" (cartão/PIX/boleto em `showPaymentSuccess`): trocar o redirect para `sucesso.html?email=${encodeURIComponent(email)}` (usar o email coletado no form, não o `formData` antigo). Remover o `sessionStorage.setItem('userEmail', ...)` (morto) ou mantê-lo como fallback E fazer `sucesso.html` ler sessionStorage como fallback do query param.
- [ ] **5.3** Em `sucesso.html`: ler primeiro `?email=`, fallback `sessionStorage.getItem('userEmail')`; se houver email, exibir no lugar de "mesmo email da compra".
- [ ] **5.4** Copy: se a Fase 4 estiver concluída, manter "Você também receberá estas instruções por email."; **senão**, trocar por "Guarde bem este email — ele é a sua chave de acesso."
- [ ] **5.5** (Higiene) Remover `functions/asaasProxy.js` e `functions/index.js` da LP **somente após** confirmar que o `firebase.json` da LP não está mais deployando functions (projeto migrou para Netlify) — registrar a remoção no commit. Se houver dúvida, apenas adicionar aviso de DEPRECATED no cabeçalho dos arquivos.

### 🧪 Verificação

- Servir a LP localmente (`npx http-server -p 8000` na pasta da LP), simular o fluxo até `showPaymentSuccess` (pode mockar as functions no DevTools) e confirmar que `sucesso.html?email=...` exibe o email correto nos 3 métodos de pagamento.

### 🏁 DoD
- [ ] Email do comprador aparece na tela de sucesso em cartão, PIX e boleto.
- [ ] Nenhuma referência a email prometido sem envio real (se Fase 4 pendente).
- [ ] Nenhuma regressão no checkout.

---

## FASE 6 — Deploy, configuração do Asaas e teste E2E

### 🎯 Objetivo
Colocar tudo em produção e **provar** o fluxo completo: compra → webhook → Firestore → cadastro → acesso liberado, sem toque manual.

### 📂 Artefatos

- Deploy Firebase Functions (`Fluentoria/functions`)
- Deploy Firestore Rules (Fase 3)
- Deploy Netlify LP (após Fase 5)
- Painel Asaas (webhook)

### ✅ Tarefas

- [ ] **6.1** Deploy das functions:
  ```bash
  cd "c:\Users\HP NOTEBOOK\Documents\0Projetos\Fluentoria"
  firebase deploy --only functions
  ```
- [ ] **6.2** Deploy das rules (se ainda não foi na Fase 3): `firebase deploy --only firestore:rules`.
- [ ] **6.3** Deploy da LP (git push → Netlify build automático).
- [ ] **6.4** Painel Asaas → Webhooks:
  - URL: `https://us-central1-fluentoria-527b2.cloudfunctions.net/asaasWebhook`
  - Token de autenticação: o mesmo valor do secret `ASAAS_WEBHOOK_TOKEN` (Fase 0.2/0.3).
  - Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.
  - **Remover** qualquer webhook antigo apontando para a LP/Netlify.
- [ ] **6.5** **Teste E2E em sandbox primeiro** (apontar LP para `ASAAS_ENVIRONMENT=sandbox` temporariamente, ou usar cartão de teste em conta sandbox separada):
  1. Comprar "Imersão 30 Dias" com cartão de teste `5162 3060 1140 8828`, email `e2e+$(date +%s)@teste.com`.
  2. Confirmar nos logs da Function: evento autenticado, email resolvido via API, usuário criado, `user_courses` gravado, email de boas-vindas disparado.
  3. Cadastrar no app com o mesmo email → **acesso liberado na hora** (sem "Acesso Pendente").
  4. Reembolsar a cobrança no painel sandbox → acesso revogado automaticamente.
  5. Repetir com PIX (validar espera assíncrona do webhook).
- [ ] **6.6** Voltar `ASAAS_ENVIRONMENT=production`, fazer **uma compra real de baixo valor** (ou R$ 1 via link) e validar o ciclo completo; estornar em seguida e validar a revogação.
- [ ] **6.7** Atualizar `diagnostico_fluxo_pagamento_acesso.md` marcando os itens resolvidos e registrar no README da LP a URL oficial do webhook.

### 🧪 Verificação

- Logs do Firebase (`firebase functions:log --only asaasWebhook`) mostrando: token válido → cliente resolvido → usuário ativado → idempotência em retry.
- Firestore: `users` sem docs órfãos novos; `user_courses` com `userId == authUID` após cadastro.
- Caixa de entrada do email de teste com o email de boas-vindas.

### 🏁 DoD
- [ ] Fluxo E2E aprovado em sandbox **e** em produção (compra real teste).
- [ ] Nenhum webhook legado ativo no Asaas.
- [ ] Documentação atualizada.

---

## Anexo — Mapa rápido de responsabilidades pós-plano

| Componente | Responsabilidade única |
|---|---|
| LP (Netlify) | Checkout: criar cliente/cobrança, exibir QR/boleto, tela de sucesso |
| Firebase Function `asaasWebhook` | **Única** porta de entrada de eventos Asaas → ativa/revoga acesso, dispara email |
| Firestore `users` + `user_courses` | Fonte de verdade do acesso (sempre indexada pelo `authUID`) |
| App (cliente) | Lê acesso; **nunca** escreve campos sensíveis |
| Admin (Students/Settings) | Gestão manual via SDK cliente com `role: admin` |
