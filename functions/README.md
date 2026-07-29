# Firebase Functions — Fluentoria

## Functions

| Function | Type | Description |
|---|---|---|
| `asaasWebhook` | Gen2 (onRequest) | Processa eventos do Asaas: ativa/revoga acesso |
| `updateUserCustomerId` | Gen1 (onCall) | Atualiza o Asaas customer ID do usuário |
| `runAccessMigration` | Gen1 (onCall) | Migração de acesso (admin only) |
| `runAccessMigrationHttp` | Gen1 (onRequest) | Migração via HTTP com Bearer token |

## Secrets (Gen2)

Configurados via `firebase functions:secrets:set`:

| Secret | Descrição |
|---|---|
| `ASAAS_WEBHOOK_TOKEN` | Token enviado pelo Asaas no header `asaas-access-token` |
| `ASAAS_API_KEY` | Chave de API do Asaas (produção: `$aact_prod_...`) |
| `ASAAS_ENVIRONMENT` | `production` (default) ou `sandbox` (via `defineString`) |

## Webhook — Como funciona

### Autenticação

O webhook lê o header **`asaas-access-token`** (não `x-asaas-access-token`) e compara com o secret `ASAAS_WEBHOOK_TOKEN` via `crypto.timingSafeEqual`. Se o token não bater → 401, fail-closed. Se o secret não estiver configurado → 500.

### Resolução do cliente (4 passos)

1. Busca `/users` por `asaasCustomerId == payment.customer`
2. Fallback: chama `GET /customers/{customerId}` na API Asaas (header `access_token`)
3. Com o email retornado, busca `/users` por `email`
4. Se nenhum usuário existe → cria doc órfão (adotado na Fase 2)

### Idempotência

Cada evento gera um doc em `webhook_events/{paymentId}_{event}`. Se `processed: true` → responde 200 `{ duplicate: true }`. O campo `welcomeEmailSent` está reservado para a Fase 4 (email).

### Eventos tratados

| Evento | Ação |
|---|---|
| `PAYMENT_RECEIVED` | Ativa acesso (`accessAuthorized: true`, `paymentStatus: active`) |
| `PAYMENT_CONFIRMED` | Idem `PAYMENT_RECEIVED` |
| `PAYMENT_OVERDUE` | Revoga (`overdue`), respeita `manualAuthorization` |
| `PAYMENT_REFUNDED` | Revoga (`refunded`), respeita `manualAuthorization` |
| `PAYMENT_DELETED` | Revoga (`canceled`), respeita `manualAuthorization` |

### Payload esperado

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_...",
    "customer": "cus_...",
    "externalReference": "{\"courseId\":\"...\"}",
    "status": "CONFIRMED",
    "value": 197.00
  }
}
```

**Importante:** `payment.customer` é string (ID), não objeto. O email do cliente é obtido via API Asaas.

## Setup

```bash
cd functions
npm install
firebase functions:secrets:set ASAAS_WEBHOOK_TOKEN
firebase functions:secrets:set ASAAS_API_KEY
```

## Deploy

```bash
firebase deploy --only functions
```

## Teste local

```bash
firebase emulators:start --only functions,firestore

curl -X POST http://localhost:5001/fluentoria-527b2/us-central1/asaasWebhook \
  -H "asaas-access-token: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"id":"pay_teste1","customer":"cus_teste","externalReference":"{\"courseId\":\"Jgcb9yX5Xxp8o6UMYTmX\"}"}}'
```
