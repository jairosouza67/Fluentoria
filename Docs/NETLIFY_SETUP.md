# Configuração das Variáveis de Ambiente no Netlify

## ⚠️ IMPORTANTE
As chaves sensíveis do Asaas agora estão protegidas e são configuradas no Netlify (backend), não mais no frontend.

## 📋 Passo a Passo para Configurar

### 1. Acesse o Painel do Netlify
- Vá para: https://app.netlify.com
- Selecione seu site (Fluentoria)

### 2. Configure as Variáveis de Ambiente
Navegue até: **Site settings** → **Build & deploy** → **Environment variables**

Adicione as seguintes variáveis:

```bash
ASAAS_ACCESS_TOKEN=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ2NGQ0ODQ2LTc4ZjgtNDMwNy1iYThlLWNlNmI5YmVmNTdkMTo6JGFhY2hfM2Q4YmE0ZjItYmMyYS00MTdiLWJlOTEtYjZlNjViOGFkOTli

ASAAS_API_URL=https://sandbox.asaas.com/api/v3
```

**⚠️ ATENÇÃO:**
- Quando for para produção, altere `ASAAS_API_URL` para: `https://api.asaas.com/v3`
- Altere também o `ASAAS_ACCESS_TOKEN` para a chave de produção

### 3. Deploy
Após configurar as variáveis:
- Faça commit e push do código
- O Netlify fará o deploy automaticamente
- As Netlify Functions estarão disponíveis em: `https://seu-site.netlify.app/.netlify/functions/`

## 🔒 Segurança

### O que mudou:
✅ **ANTES:** Chave do Asaas exposta no frontend (bundle JavaScript)
✅ **AGORA:** Chave protegida no backend (Netlify Functions)

### Arquitetura Nova:
```
Frontend (React)
    ↓ (sem chave)
Netlify Functions (Backend Seguro)
    ↓ (com chave segura)
Asaas API
```

## 📁 Arquivos Criados

### Netlify Functions:
- `netlify/functions/create-asaas-customer.js` - Criar cliente no Asaas
- `netlify/functions/check-payment-status.js` - Verificar status de pagamento
- `netlify/functions/package.json` - Dependências (node-fetch)

### Configuração:
- `netlify.toml` - Configurações do Netlify

### Arquivos Modificados:
- `lib/db.ts` - Agora usa Netlify Functions ao invés de chamar Asaas diretamente
- `.env` - Removida a chave do Asaas (não é mais necessária no frontend)

## 🧪 Testar Localmente

Para testar as Netlify Functions localmente:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Rodar o projeto com as functions
netlify dev
```

## ✅ Verificação

Após o deploy, teste:
1. Sincronização de alunos
2. Verificação de status de pagamento
3. Criação de clientes no Asaas

Todas as chamadas agora passam pelas Netlify Functions! 🎉
