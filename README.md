# 📚 Documentação do Projeto Fluentoria

Bem-vindo à documentação central do Fluentoria. Este diretório contém tudo o que é necessário para entender, manter e expandir o software.

## 📌 Guia de Documentos

1.  **[Visão Geral do Projeto](OVERVIEW.md)**
    - O que é o Fluentoria, funcionalidades principais e proposta de valor.
2.  **[Manutenção Técnica](MAINTENANCE_GUIDE.md)**
    - **Leitura Obrigatória para Programadores.**
    - Arquitetura, Fluxo de Pagamento, Gamificação e Solução de Problemas.
3.  **[Guia de Componentes](COMPONENTS_GUIDE.md)**
    - Detalhamento dos componentes React, estrutura de pastas e UI.
4.  **[Configuração Cloud](CLOUD_SETUP.md)**
    - Passo a passo para configurar Firebase, Netlify e Asaas.
5.  **[Regras de IA](AI_RULES.md)**
    - Instruções para agentes de IA que trabalham neste repositório.
6.  **[Setup Netlify](NETLIFY_SETUP.md)**
    - Detalhes específicos sobre o deploy no Netlify.

---

## 🚀 Início Rápido (Desenvolvimento)

```bash
# Instalar dependências
pnpm install

# Rodar em modo desenvolvimento
pnpm run dev
```

## 🛠 Comandos Úteis

- `pnpm run build`: Gera a versão de produção.
- `firebase deploy --only functions`: Atualiza o Webhook do Asaas no Firebase.
- `pnpm run preview`: Testa o build localmente.

---
Documentação organizada em 03 de Fevereiro de 2026.
