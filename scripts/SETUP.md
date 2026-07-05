# Configuração — Upload YouTube para Fluentoria

## 1. Criar projeto no Google Cloud Console

1. Acesse https://console.cloud.google.com/
2. Crie um projeto (ou use um existente)
3. Habilite as APIs:
   - **YouTube Data API v3**
   - **Google Drive API**

## 2. Criar credenciais OAuth 2.0

1. Vá em **APIs e Serviços → Credenciais**
2. Clique **+ Criar Credenciais → ID do cliente OAuth**
3. Se pedir para configurar a tela de consentimento:
   - Tipo: **Externo**
   - Preencha nome do app, email de suporte
   - Escopos: adicione `youtube.upload` e `drive.readonly`
   - Adicione seu email como usuário de teste
4. Tipo de aplicativo: **App para computador**
5. Nome: `Fluentoria Migration`
6. Baixe o JSON e renomeie para `credentials.json`
7. Coloque na pasta `scripts/`

## 3. Service Account do Firebase

1. Firebase Console → Configurações do Projeto → Contas de Serviço
2. Gerar nova chave privada
3. Baixar JSON e renomear para `service-account-key.json`
4. Coloque na pasta `scripts/`

## 4. Instalar dependências

```bash
cd scripts
npm install firebase-admin googleapis google-auth-library
```

## 5. Executar migração

```bash
node migrate-drive-to-youtube.js
```

Na primeira execução, abrirá o navegador para autorizar o YouTube.
O token fica salvo em `token.json` para execuções futuras.

## 6. Depois da migração

- Os vídeos migrados ficam como **Não listado** no YouTube
- Os links no Firestore são atualizados automaticamente
- O app Fluentoria já sabe reproduzir YouTube (via `lib/video.ts`)
- Um backup dos dados originais fica em `migration-backup.json`

## 7. Para novos vídeos (pós-migração)

Duas opções:

### A) Manual (recomendado enquanto não tem automação)
- Fazer upload direto no YouTube Studio
- Colar o link do YouTube no campo `videoUrl` do curso no painel admin

### B) Automático (script futuro)
- Usar o mesmo script com flag `--watch` para monitorar uma pasta do Drive
- Ou integrar no painel admin com o widget abaixo