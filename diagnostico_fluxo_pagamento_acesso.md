# Diagnóstico: Compra na LP → Webhook Asaas → Acesso ao App

> **Data da análise:** 28/07/2026
> **Projetos analisados:** `Fluentoria` (app) e `Landing Page` (checkout)
> **Escopo:** fluxo ponta a ponta de compra na landing page, notificação via webhook do Asaas e liberação automática de acesso ao app.

---

## 1. Como está arquitetado hoje

### 1.1 Landing Page (`fluentorialp.netlify.app`) — checkout

Arquivos-chave: `app.js`, `netlify/functions/createOrGetCustomer.js`, `createPayment.js`, `payWithCreditCard.js`, `getPixQrCode.js`, `getPaymentStatus.js`, `sucesso.html`

1. Cliente escolhe o plano (`PRODUCTS` em `app.js`):
   - **Fluentoria Completo** — R$ 197 → `courseId: Jgcb9yX5Xxp8o6UMYTmX`
   - **Imersão 30 Dias** — R$ 97 → `courseId: O5dUn9JeJuoRKKVKc4SS`
2. `app.js` chama as Netlify Functions na sequência:
   - `createOrGetCustomer` → cria/busca cliente no Asaas (por CPF)
   - `createPayment` → cria cobrança com `externalReference = {"courseId": "...", "timestamp": ...}`
   - Cartão: `payWithCreditCard` | PIX: `getPixQrCode` | Boleto: `bankSlipUrl`
3. Tela de sucesso (`sucesso.html`) instrui o aluno a criar conta no app (`fluentoria.netlify.app`) **com o mesmo email da compra**.

✅ Esta parte está funcional e bem implementada (validação, rate limiting, sanitização de logs, CORS).

### 1.2 App (`fluentoria.netlify.app`) — gate de acesso

Arquivos-chave: `App.tsx`, `lib/db/admin.ts` (`checkUserAccess`, `createOrUpdateUser`), `lib/db/students.ts` (`findAndMergeStudentByEmail`)

1. Login/cadastro via Firebase Auth.
2. No cadastro, `createOrUpdateUser(uid, ...)`:
   - Se já existir doc em `/users` com o mesmo email → faz "merge" (atualiza nome/foto **no doc existente**) e **não cria** o doc `/users/{authUID}`.
   - Se não existir → cria `/users/{authUID}` com `accessAuthorized: false`, `paymentStatus: 'pending'`.
3. `checkUserAccess(uid)` libera o acesso se:
   - `/users/{uid}.accessAuthorized === true`, **ou**
   - existir `user_courses` com `userId == uid` e `status == 'active'`.
4. Sem autorização → tela **"Acesso Pendente"** (bloqueio total).

### 1.3 Webhook que ativa o acesso — Firebase Function `asaasWebhook`

Arquivo-chave: `functions/src/index.js` (projeto `fluentoria-527b2`)

- URL documentada: `https://us-central1-fluentoria-527b2.cloudfunctions.net/asaasWebhook`
- Em `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`:
  - Busca usuário por `req.body.customer.email`
  - Cria ou atualiza o usuário com `accessAuthorized: true`, `paymentStatus: 'active'`
  - Extrai `courseId` de `payment.externalReference` e cria/atualiza `user_courses`
- Em `PAYMENT_OVERDUE`: desativa acesso (global ou por curso).

### 1.4 Webhook "gêmeo" na Landing Page (Netlify)

Arquivo-chave: `Landing Page/netlify/functions/asaasWebhook.js`

- Recebe os mesmos eventos, mas **apenas loga** — a integração está como `// TODO: Integrate with Fluentoria platform`.
- **Não ativa acesso de ninguém.**

---

## 2. 🔴 Quebras críticas — o processo NÃO funciona ponta a ponta hoje

### 2.1 O webhook Firebase lê um campo que não existe no payload do Asaas

**Arquivo:** `Fluentoria/functions/src/index.js` (linha ~184-191)

```js
const customerData = req.body.customer || {};
// ...
const email = customerData.email; // ← sempre undefined
```

O payload real do Asaas é:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_...",
    "customer": "cus_...",   // ← é só o ID, não um objeto
    "externalReference": "{\"courseId\":\"...\"}"
  }
}
```

Não existe objeto `customer` com email no topo do payload. Resultado: **o webhook responde 400 "Missing email" em 100% dos eventos → nenhum acesso é ativado automaticamente.**

### 2.2 Autenticação do webhook com header errado + config obsoleta

**Arquivo:** `Fluentoria/functions/src/index.js` (linhas ~162-179)

- A função exige o header `x-asaas-access-token`, mas o **Asaas envia o token no header `asaas-access-token`** → 401 em todas as chamadas.
- O token vem de `functions.config()` (Runtime Config API), que foi **descontinuada pelo Google**. Provavelmente retorna `undefined` → a função rejeita tudo com 500 (fail-closed): `"CRITICAL: asaas.webhook_token not configured"`.

### 2.3 Dois webhooks concorrentes — e o da LP não faz nada

- Se a conta Asaas estiver apontada para o **webhook da LP (Netlify)**: o evento é apenas logado → nada acontece.
- Se estiver apontada para o **Firebase**: caem os bugs 2.1 e 2.2.
- A verificação HMAC do webhook da LP (`asaas-signature`) usa um esquema que o Asaas **não envia** (ele usa token em header, não assinatura HMAC). Hoje é fail-open (só loga warning), ou seja, não quebra — mas também **não protege nada**.

### 2.4 O vínculo pagamento ↔ conta quebra no fluxo "paga primeiro, cadastra depois"

Este é o bug mais traiçoeiro, porque quebra exatamente o fluxo desenhado (compra na LP → cria conta depois).

**Sequência da falha:**

1. Aluno paga → webhook cria `/users/{idAleatorio}` com `accessAuthorized: true` + `user_courses` com `userId = idAleatorio`.
2. Aluno se cadastra no app → `createOrUpdateUser(authUID, ...)` encontra o doc pelo email (`findAndMergeStudentByEmail`) e apenas atualiza nome/foto **no doc aleatório** — o doc `/users/{authUID}` **nunca é criado**.
3. O app consulta `checkUserAccess(authUID)` → doc não existe → `authorized: false`.
4. O fallback por `user_courses` também falha (`userId` é o ID aleatório, não o `authUID`).

**Resultado: "Acesso Pendente" permanente.** Hoje só destrava com intervenção manual do admin (autorização manual ou migração).

> ⚠️ Inversamente, se o aluno se cadastra **antes** de pagar, o fluxo funciona: o webhook encontra o doc correto pelo email e atualiza. É por isso que testes pontuais podem ter dado a impressão de funcionamento.

---

## 3. 🟠 Riscos de segurança (permitem bypass de pagamento)

### 3.1 Firestore Rules — coleção `users`

**Arquivo:** `Fluentoria/firestore.rules` (linha ~32)

```
allow update: if isOwner(userId) || isAdmin();
```

Sem restrição de campos: qualquer aluno autenticado pode, via console/SDK, definir no **próprio documento**:

- `accessAuthorized: true` → acesso grátis
- `role: 'admin'` → **escalação de privilégio total**

### 3.2 Firestore Rules — coleção `user_courses`

**Arquivo:** `Fluentoria/firestore.rules` (linhas ~128-138)

```
allow create, update: if isAuthenticated();
```

- Qualquer usuário autenticado pode criar/editar registros de **qualquer** `userId`.
- Agravante: `grantCourseAccess` em `lib/db/userCourses.ts` **pula o `requireAdmin`** quando `source === 'asaas'` → o "admin check in code" citado no comentário não existe nesse caminho.

### 3.3 Reembolso não revoga acesso

O webhook Firebase trata apenas `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_OVERDUE`. **`PAYMENT_REFUNDED` e `PAYMENT_DELETED` são ignorados** → aluno reembolsado mantém acesso.

---

## 4. 🟡 Problemas menores

| # | Problema | Local |
|---|----------|-------|
| 1 | `sucesso.html` promete "você receberá estas instruções por email" — **nada envia email** (sem boas-vindas, sem link de acesso) | LP / webhook |
| 2 | `app.js` grava `app.state.formData.email` no sessionStorage, mas `formData` **nunca é populado** (sempre vazio) | `Landing Page/app.js` |
| 3 | `sucesso.html` lê o email de `?email=` na URL, mas a LP **nunca passa esse parâmetro** → email nunca aparece na tela | `Landing Page/app.js` / `sucesso.html` |
| 4 | Idempotência do webhook da LP é `Map` em memória → perdida a cada cold start | `Landing Page/netlify/functions/asaasWebhook.js` |
| 5 | Webhook Firebase **não tem dedup** de eventos (retries do Asaas podem reprocessar) | `Fluentoria/functions/src/index.js` |
| 6 | `ASAAS_ENVIRONMENT` default é `sandbox` — precisa ser `production` nas env vars do Netlify em produção | LP Netlify Functions |
| 7 | Fontes de verdade duplicadas para acesso: flag `accessAuthorized` (legado) **e** coleção `user_courses` | App inteiro |

---

## 5. O que falta para funcionar bem (plano de ação, em ordem de prioridade)

### Prioridade 1 — Fazer a liberação automática funcionar

- [ ] **Unificar o webhook**: apontar o painel Asaas **somente** para a Firebase Function (`https://us-central1-fluentoria-527b2.cloudfunctions.net/asaasWebhook`) e aposentar/remover o webhook da LP.
- [ ] **Corrigir a Firebase Function**:
  - Obter o email do cliente via `GET /customers/{payment.customer}` na API do Asaas (guardar `ASAAS_API_KEY` com `defineSecret`), **ou** localizar o usuário no Firestore por `asaasCustomerId == payment.customer`.
  - Corrigir o header esperado para `asaas-access-token`.
  - Migrar de `functions.config()` para Secrets/Params (`firebase-functions/params`).
  - Tratar `PAYMENT_REFUNDED` e `PAYMENT_DELETED` (revogar acesso / marcar `user_courses` como `refunded`).
  - Idempotência: registrar IDs de eventos processados no Firestore.
- [ ] **Corrigir o vínculo pagamento ↔ conta** (escolher uma abordagem):
  - **Opção A:** no `createOrUpdateUser`, ao encontrar doc com mesmo email e ID diferente, **migrar os dados** (`accessAuthorized`, `paymentStatus`, `asaasCustomerId`, re-apontar `user_courses.userId`) para o `authUID` e remover o doc órfão.
  - **Opção B:** o webhook grava em uma coleção `pending_access` indexada por email; o cadastro "reivindica" o acesso (mais limpo, sem docs órfãos).

### Prioridade 2 — Fechar brechas de segurança

- [ ] **Firestore Rules `users`**: restringir `update` do dono a campos seguros (`name`, `displayName`, `photoURL`, `lastLogin`); `role`, `accessAuthorized`, `paymentStatus` etc. só via Admin SDK.
- [ ] **Firestore Rules `user_courses`**: escrita **apenas admin/Admin SDK** (o webhook usa Admin SDK e não é afetado pelas rules).
- [ ] Corrigir `grantCourseAccess` para exigir admin também quando chamado no cliente.

### Prioridade 3 — Experiência do aluno

- [ ] **Email pós-compra**: enviar boas-vindas com link para o app (ex.: Firebase Auth email link, SendGrid, ou similar) — hoje a promessa da tela de sucesso não é cumprida.
- [ ] Corrigir UX da LP: popular `formData.email` e/ou passar `?email=` na URL de `sucesso.html`.

### Prioridade 4 — Checklist de produção

- [ ] `ASAAS_API_KEY` (produção, `$aact_prod_...`) e `ASAAS_ENVIRONMENT=production` nas env vars do Netlify da LP.
- [ ] Token de autenticação do webhook configurado no painel Asaas **e** como secret no Firebase.
- [ ] Eventos assinados no Asaas: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.
- [ ] **Teste ponta a ponta em sandbox**: compra com cartão de teste → webhook processa → Firestore atualizado → cadastro com mesmo email → acesso liberado sem intervenção manual.

---

## 6. Resumo executivo

## 6. Resumo executivo

| Etapa | Status |
|-------|--------|
| Checkout na LP (criar cliente/cobrança/pagar) | ✅ Funcionando perfeitamente |
| Webhook recebe eventos do Asaas | ✅ Configurado via Cloud Run (`asaaswebhook-wrfdkaj3qq-uc.a.run.app`) |
| Webhook ativa acesso no Firestore | ✅ Corrigido (Firebase Gen2, tokens e payloads alinhados) |
| Cadastro do aluno vincula ao pagamento | ✅ Corrigido via `adoptOrphanUserByEmail` e Firebase Admin Callable |
| App libera conteúdo após pagamento | ✅ Automático |
| Segurança contra auto-liberação | ✅ Fechado via Firestore Rules rígidas |
| Reembolso revoga acesso | ✅ Implementado (PAYMENT_REFUNDED e PAYMENT_DELETED tratam revogação) |
| Email de boas-vindas | 🟡 Adiado para o futuro (Flag `welcomeEmailSent` pronta) |

**Conclusão (28/07/2026):** O fluxo ponta a ponta foi re-arquitetado e corrigido no contexto do Ralph Loop. O checkout converte e a liberação ocorre de forma segura e autônoma, sem docs órfãos ou quebras de auth. Testes de unidade e regras de Firestore garantem a estabilidade da arquitetura.
