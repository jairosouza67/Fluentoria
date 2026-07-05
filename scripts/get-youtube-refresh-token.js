#!/usr/bin/env node
/**
 * Script auxiliar: Obtém o Refresh Token do YouTube
 * 
 * Executa UMA VEZ para gerar o GOOGLE_REFRESH_TOKEN
 * que será usado pela Netlify Function youtube-upload.js
 * 
 * USO:
 *   1. Coloque credentials.json nesta pasta
 *   2. node get-youtube-refresh-token.js
 *   3. Copie o refresh_token e configure no Netlify
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function main() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ credentials.json não encontrado!');
    console.log('   Baixe do Google Cloud Console → APIs e Serviços → Credenciais');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_id, client_secret } = credentials.installed || credentials.web || {};

  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );

  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('🔐 Abra este link no navegador:\n');
  console.log(authUrl);
  console.log('\nAutorize e cole o código aqui:');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => {
    rl.question('> ', answer => { rl.close(); resolve(answer.trim()); });
  });

  const { tokens } = await auth.getToken(code);
  
  console.log('\n✅ REFRESH TOKEN obtido com sucesso!\n');
  console.log('═'.repeat(50));
  console.log('Configure esta variável no Netlify:');
  console.log('═'.repeat(50));
  console.log(`\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  console.log(`GOOGLE_CLIENT_ID=${client_id}`);
  console.log(`GOOGLE_CLIENT_SECRET=${client_secret}\n`);
  console.log('═'.repeat(50));
  console.log('\n💡 Guarde este token em local seguro. Ele não expira.');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});