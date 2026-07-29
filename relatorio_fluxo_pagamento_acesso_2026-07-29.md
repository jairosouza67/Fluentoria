# Relatório: Compra na LP → Webhook Asaas → Acesso ao App

> **Data da verificação:** 29/07/2026
> **Projetos:** `Fluentoria` (app) e `Landing Page` (checkout)
> **Método:** leitura direta do código atual dos dois repositórios (docs .md anteriores ignorados por estarem desatualizados).

---

## 1. Como funciona hoje (ponta a ponta)

```
LP (fluentorialp.netlify.app)        Asaas                Firebase (app: fluentoria-527b2)
─────────────────────────────        ─────                ──────────────────────────────
1. checkout → createOrGetCustomer
2. createPayment
   (externalReference =
    {courseId, timestamp})
3. pagamento: cartão / PIX / boleto
                              → 4. webhook PAYMENT_*  → 5. asaasWebhook (Gen2, onRequest)
                                                           auth: header `asaas-access-token`
                                                           vs secret ASAAS_WEBHOOK_TOKEN
                                                           dedup: webhook_events/
                                                           resolve usuário:
                                                             a) asaasCustomerId == payment.customer
                                                             b) email via API Asaas (GET /customers/{id})
                                                           não achou → cria user "órfão"
                                                           ativa: /users + user_courses
6. aluno cadastra no app com o mesmo email
   → callable `adoptOrphanUser` (Gen1): migra campos de pagamento do órfão
     para o authUID, re-aponta user_courses, apaga o órfão
   → Auth.tsx dispara re-check → App.tsx libera o acesso
```

### Arquivos-chave

| Etapa | Arquivo |
|---|---|
| Checkout LP | `Landing Page/app.js` (`processAsaasPayment` ~:1589) |
| Functions da LP | `Landing Page/netlify/functions/{createOrGetCustomer,createPayment,payWithCreditCard,getPixQrCode,getPaymentStatus}.js` |
| Tela pós-compra | `Landing Page/sucesso.html` (recebe `?email=`, instrui cadastro com mesmo email) |
| Webhook real | `Fluentoria/functions/src/index.js` (`asaasWebhook` :272) |
| Adoção de órfão | `Fluentoria/functions/src/index.js` (`adoptOrphanUser` :400) + `Fluentoria/lib/db/admin.ts` (`createOrUpdateUser` :89) |
| Gate de acesso | `Fluentoria/App.tsx` (:209) + `lib/db/admin.ts` (`checkUserAccess` :162) |
| Segurança | `Fluentoria/firestore.rules` |

---

## 2. O que está funcionando

- **Checkout da LP completo**: customer → payment → cartão/PIX/boleto, validação Joi + CPF, rate limiting, CORS restrito, logs sanitizados.
- **Webhook Gen2 correto**: header `asaas-access-token` com comparação `timingSafeEqual`; idempotência via coleção `webhook_events`; trata `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.
- **Resolução de usuário robusta**: primeiro por `asaasCustomerId`, depois por email via API Asaas; cria órfão quando necessário (cenário "paga antes de cadastrar").
- **Vínculo pagamento ↔ conta resolvido**: callable `adoptOrphanUser` migra o órfão para o authUID no cadastro e o app re-checa o acesso automaticamente.
- **Firestore Rules endurecidas**: aluno **não** pode editar `accessAuthorized`/`role` do próprio doc (whitelist de update: `name`, `displayName`, `photoURL`, `lastLogin`); `user_courses` com write somente admin.
- **Reembolso/cancelamento revoga acesso**, com proteção para `manualAuthorization`.
- **Webhook da LP aposentado** (stub HTTP 410) — não há mais webhook concorrente ativo.

---

## 3. O que falta / riscos (em ordem de prioridade)

### 🔴 1. `ASAAS_API_KEY` e `ASAAS_ENVIRONMENT` não são secrets declarados
O webhook lê via `process.env` puro (`functions/src/index.js:141` e `:341`), mas apenas `ASAAS_WEBHOOK_TOKEN` está em `defineSecret` (:12). Se as envs não existirem no runtime do Cloud Run, a busca de email falha (`api_failed`) e **cliente que paga antes de cadastrar não é ativado**.
→ Verificar no console Firebase; idealmente migrar para `defineSecret`.

### 🔴 2. Configuração externa (não verificável pelo código)
- Painel Asaas apontando para a URL da Firebase Function (a LP retorna 410 se receber).
- Token do webhook no painel Asaas **idêntico** ao secret `ASAAS_WEBHOOK_TOKEN`.
- LP em produção com `ASAAS_API_KEY` de produção (`$aact_prod_...`) + `ASAAS_ENVIRONMENT=production` nas env vars do Netlify (senão cobra em sandbox).
- Eventos assinados no Asaas: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.

### 🟠 3. Checkout dentro do app gera courseId inválido
`components/AsaasPayment.tsx:141` envia `externalReference: fluentoria_${Date.now()}`; o webhook grava isso como `courseId` em `user_courses`. Não bloqueia o acesso (fallback por email funciona), mas polui os dados.

### 🟡 4. UX da LP (sem impacto na segurança)
- PIX/boleto levam a `sucesso.html` sem confirmar pagamento (`startPaymentPolling` existe em `app.js:1560` mas nunca é chamado).
- Cartão: frontend não inspeciona `status` do resultado antes de exibir "Pagamento Aprovado!" (`app.js:1744`).
- O acesso só é liberado pelo webhook, então não é falha de segurança — apenas promessa visual.

### 🟡 5. Menores
- Email de boas-vindas não é enviado (flag `welcomeEmailSent` pronta; adiado).
- Bootstrap do 1º admin pode ser negado pela rule de create de `/users` (doc não existe ainda → `isAdmin()` falso, e o create inclui campos proibidos).
- `PAYMENT_DELETED` grava `planStatus: 'pending'` em vez de `'canceled'`.
- Nomes de env inconsistentes: `ASAAS_ACCESS_TOKEN` (Netlify functions do app) vs `ASAAS_API_KEY` (LP e Firebase).
- Idempotência do webhook não é transacional (janela de corrida pequena entre check e marcação).

---

## 4. Lixo identificado (pode apagar)

| Item | Local |
|---|---|
| Webhook stub 410 + `verifyWebhookSignature` (HMAC nunca usado) | `Landing Page/netlify/functions/asaasWebhook.js`, `utils/security.js` |
| Proxy Firebase legado (functions v2 antigas + webhook que só loga) | `Landing Page/functions/` |
| `findAndMergeStudentByEmail` (deprecated, sem callers) | `Fluentoria/lib/db/students.ts:110` |
| Fallback client `adoptOrphanUserByEmail` (bloqueado pelas rules, inócuo) | `Fluentoria/lib/db/admin.ts:25` |
| Polling morto (`startPaymentPolling`, `getPaymentStatus` no front) | `Landing Page/app.js:1542-1588` |
| `ASAAS_ACCESS_TOKEN` no `.env.local` do app (não consumido pelo front) | `Fluentoria/.env.local` |

---

## 5. Próximos passos sugeridos

1. Confirmar/migrar secrets do Firebase (`ASAAS_API_KEY`, `ASAAS_ENVIRONMENT` → `defineSecret`).
2. Conferir painel Asaas: URL do webhook, token e eventos assinados.
3. Conferir env vars de produção no Netlify da LP.
4. **Teste ponta a ponta em sandbox**: compra → webhook → órfão criado → cadastro no app → acesso liberado sem intervenção manual.
5. Corrigir `externalReference` do checkout in-app (item 3.3).

---

**Conclusão:** a arquitetura está correta e as quebras críticas anteriores (header errado, payload lido errado, vínculo órfão, regras permissivas) foram corrigidas. O que resta é essencialmente **verificação de configuração externa + teste ponta a ponta**, e pequenas correções de higiene.
