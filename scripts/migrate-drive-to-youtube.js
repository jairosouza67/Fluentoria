#!/usr/bin/env node
/**
 * Script de Migração: Google Drive → YouTube (Fluentoria)
 * 
 * Lê TODOS os cursos do Firestore, encontra aulas com videoUrl do Google Drive,
 * faz upload para YouTube como "Não listado" e atualiza o Firestore.
 * 
 * PRÉ-REQUISITOS:
 * 1. Ter Node.js 18+ instalado
 * 2. Ter uma Conta Google com YouTube habilitado
 * 3. Criar projeto no Google Cloud Console e habilitar YouTube Data API v3
 * 4. Criar credenciais OAuth 2.0 (Desktop App) e baixar como credentials.json
 * 5. Ter firebase-admin configurado (service-account-key.json)
 * 
 * USO:
 *   1. Coloque credentials.json e service-account-key.json nesta pasta
 *   2. npm install firebase-admin googleapis google-auth-library
 *   3. node migrate-drive-to-youtube.js
 * 
 * Na primeira execução, abrirá o navegador para autorizar o YouTube.
 * O token fica salvo em token.json para não pedir autorização de novo.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const admin = require('firebase-admin');

// ─── CONFIGURAÇÃO ──────────────────────────────────────────────
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/drive.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account-key.json');
const BACKUP_PATH = path.join(__dirname, 'migration-backup.json');
const COURSES_COLLECTION = 'courses';
const MAX_RETRIES = 3;
const DELAY_BETWEEN_UPLOADS_MS = 5000;

// ─── GOOGLE AUTH ──────────────────────────────────────────────
async function getAuth() {
  // Carrega credenciais do arquivo
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ credentials.json não encontrado!');
    process.exit(1);
  }
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web || {};
  
  if (!client_id || !client_secret) {
    console.error('❌ credentials.json inválido!');
    process.exit(1);
  }
  
  const redirectUri = (redirect_uris && redirect_uris[0]) || 'http://localhost';
  
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || client_id,
    process.env.GOOGLE_CLIENT_SECRET || client_secret,
    process.env.GOOGLE_REDIRECT_URI || redirectUri
  );

  // Tenta carregar token salvo
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    auth.setCredentials(token);
    // Verifica se o token ainda é válido e tem os escopos certos
    try {
      const { data } = await auth.getAccessToken();
      if (!data) throw new Error('token expirado');
    } catch {
      console.log('⚠️  Token expirado, reautorizando...');
      return await reauthorize(auth);
    }
  } else {
    return await reauthorize(auth);
  }

  return auth;
}

async function reauthorize(auth) {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  console.log('\n🔐 Autorize abrindo este link:\n');
  console.log(authUrl);
  console.log('\nCole o código aqui:');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const code = await new Promise(resolve => {
    readline.question('> ', answer => {
      readline.close();
      resolve(answer.trim());
    });
  });
  
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Token salvo em token.json\n');
  return auth;
}

// ─── FIREBASE INIT ─────────────────────────────────────────────
function getFirestore() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ service-account-key.json não encontrado!');
    console.log('   Baixe em: Firebase Console → Configurações do Projeto → Contas de Serviço');
    process.exit(1);
  }
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
    });
  }
  return admin.firestore();
}

// ─── EXTRAIR GOOGLE DRIVE ID ───────────────────────────────────
function extractDriveId(url) {
  if (!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /^https:\/\/doc-.*\.googleusercontent\.com/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function isDriveUrl(url) {
  return url && /drive\.google\.com/.test(url);
}

// ─── ENCONTRAR TODAS AS AULAS COM DRIVE ────────────────────────
async function findAllDriveLessons(db) {
  console.log('🔍 Buscando cursos no Firestore...');
  const snapshot = await db.collection(COURSES_COLLECTION).get();
  const results = [];

  for (const doc of snapshot.docs) {
    const course = { id: doc.id, ...doc.data() };
    const galleries = course.galleries || [];
    
    for (const gallery of galleries) {
      for (const module of (gallery.modules || [])) {
        for (const lesson of (module.lessons || [])) {
          if (lesson.videoUrl && isDriveUrl(lesson.videoUrl)) {
            results.push({
              courseId: doc.id,
              courseTitle: course.title,
              galleryId: gallery.id,
              galleryTitle: gallery.title,
              moduleId: module.id,
              moduleTitle: module.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              driveUrl: lesson.videoUrl,
              driveId: extractDriveId(lesson.videoUrl),
            });
          }
        }
      }
    }
    
    // Também verifica videoUrl direto no curso (mindful/music)
    if (course.videoUrl && isDriveUrl(course.videoUrl)) {
      results.push({
        courseId: doc.id,
        courseTitle: course.title,
        galleryId: null,
        galleryTitle: null,
        moduleId: null,
        moduleTitle: null,
        lessonId: null,
        lessonTitle: course.title,
        driveUrl: course.videoUrl,
        driveId: extractDriveId(course.videoUrl),
      });
    }
  }

  console.log(`📊 Encontradas ${results.length} aulas com vídeos no Google Drive`);
  return results;
}

// ─── BAIXAR VÍDEO DO DRIVE ─────────────────────────────────────
async function downloadFromDrive(auth, driveId, outputPath) {
  const driveClient = google.drive({ version: 'v3', auth });
  
  console.log(`   📥 Baixando do Drive: ${driveId}`);
  
  // Primeiro, verifica se o arquivo existe e pega metadados
  const { data: file } = await driveClient.files.get({
    fileId: driveId,
    fields: 'name,size,mimeType',
  });
  
  console.log(`      Arquivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  
  // Download
  const response = await driveClient.files.get(
    { fileId: driveId, alt: 'media' },
    { responseType: 'stream' }
  );
  
  const writer = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.data
      .pipe(writer)
      .on('finish', resolve)
      .on('error', reject);
  });
  
  const stats = fs.statSync(outputPath);
  console.log(`   ✅ Download concluído: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  return file;
}

// ─── UPLOAD PARA YOUTUBE ───────────────────────────────────────
async function uploadToYouTube(youtube, videoPath, metadata) {
  const { lessonTitle, courseTitle, moduleTitle } = metadata;
  
  const title = lessonTitle || courseTitle || 'Aula Fluentoria';
  const description = [
    `Aula do curso: ${courseTitle || 'Fluentoria'}`,
    moduleTitle ? `Módulo: ${moduleTitle}` : '',
    '',
    'Este vídeo foi migrado automaticamente do Google Drive para o YouTube.',
    'Aplicativo Fluentoria — aprendizado de idiomas.',
  ].filter(Boolean).join('\n');
  
  console.log(`   📤 Enviando para YouTube: "${title}"`);
  
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.substring(0, 100),
        description: description.substring(0, 5000),
        tags: ['Fluentoria', 'aula', 'idiomas'],
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: 'unlisted', // Não listado
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });
  
  const youtubeId = res.data.id;
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  console.log(`   ✅ Upload concluído: ${youtubeUrl}`);
  return { youtubeId, youtubeUrl };
}

// ─── ATUALIZAR FIRESTORE ───────────────────────────────────────
async function updateFirestore(db, lesson, youtubeUrl) {
  const docRef = db.collection(COURSES_COLLECTION).doc(lesson.courseId);
  const doc = await docRef.get();
  const course = doc.data();
  
  if (lesson.lessonId) {
    // Aula dentro de gallery → module → lesson
    const galleries = [...(course.galleries || [])];
    for (const gallery of galleries) {
      if (gallery.id === lesson.galleryId) {
        for (const mod of (gallery.modules || [])) {
          if (mod.id === lesson.moduleId) {
            for (const l of (mod.lessons || [])) {
              if (l.id === lesson.lessonId) {
                l.videoUrl = youtubeUrl;
                console.log(`   📝 Firestore atualizado: ${lesson.lessonTitle}`);
              }
            }
          }
        }
      }
    }
    await docRef.update({ galleries });
  } else {
    // Curso direto (mindful/music)
    await docRef.update({ videoUrl: youtubeUrl });
    console.log(`   📝 Firestore atualizado: ${lesson.courseTitle}`);
  }
}

// ─── BACKUP ─────────────────────────────────────────────────────
async function createBackup(db) {
  console.log('💾 Criando backup...');
  const snapshot = await db.collection(COURSES_COLLECTION).get();
  const data = {};
  snapshot.docs.forEach(doc => { data[doc.id] = doc.data(); });
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ Backup salvo: ${BACKUP_PATH} (${snapshot.size} cursos)`);
}

// ─── MAIN ───────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 FLUENTORIA — Migração Google Drive → YouTube');
  console.log('═'.repeat(60));
  
  const auth = await getAuth();
  const youtube = google.youtube({ version: 'v3', auth });
  const db = getFirestore();
  
  // 0. Backup
  await createBackup(db);
  
  // 1. Encontrar todas as aulas com Drive
  const lessons = await findAllDriveLessons(db);
  
  if (lessons.length === 0) {
    console.log('✅ Nenhum vídeo do Google Drive encontrado. Nada a migrar!');
    process.exit(0);
  }
  
  console.log(`\n📋 ${lessons.length} aulas para migrar:\n`);
  lessons.forEach((l, i) => {
    console.log(`   ${i + 1}. [${l.courseTitle}] ${l.lessonTitle || l.courseTitle}`);
  });
  
  // 2. Migrar uma por uma
  console.log('\n🔄 Iniciando migração...\n');
  const tempDir = path.join(__dirname, 'temp-videos');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  
  let success = 0, failed = 0;
  const results = [];
  
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const progress = `[${i + 1}/${lessons.length}]`;
    console.log(`${progress} ${lesson.lessonTitle || lesson.courseTitle}`);
    
    try {
      // Download do Drive
      const ext = '.mp4';
      const outputPath = path.join(tempDir, `${lesson.driveId}${ext}`);
      await downloadFromDrive(auth, lesson.driveId, outputPath);
      
      // Upload para YouTube
      const { youtubeUrl } = await uploadToYouTube(youtube, outputPath, {
        lessonTitle: lesson.lessonTitle,
        courseTitle: lesson.courseTitle,
        moduleTitle: lesson.moduleTitle,
      });
      
      // Atualizar Firestore
      await updateFirestore(db, lesson, youtubeUrl);
      
      // Limpar arquivo temporário
      fs.unlinkSync(outputPath);
      
      success++;
      results.push({ ...lesson, youtubeUrl, status: 'success' });
      
      console.log(`   🎉 Concluído!\n`);
      
      // Delay entre uploads (YouTube tem rate limit: ~6 uploads/min)
      if (i < lessons.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_UPLOADS_MS));
      }
    } catch (err) {
      failed++;
      console.error(`   ❌ ERRO: ${err.message}`);
      results.push({ ...lesson, error: err.message, status: 'failed' });
    }
  }
  
  // 3. Resumo
  console.log('═'.repeat(60));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log(`   ✅ Sucesso: ${success}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log(`   📁 Total: ${lessons.length}`);
  
  // Salva resultados
  fs.writeFileSync(
    path.join(__dirname, 'migration-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n💾 Resultados salvos: migration-results.json');
  
  if (failed > 0) {
    console.log('\n⚠️  Alguns vídeos falharam. Verifique migration-results.json');
    console.log('   Execute o script novamente — ele pulará vídeos já migrados.');
  }
  
  // Limpa temp
  try { fs.rmSync(tempDir, { recursive: true }); } catch {}
  
  console.log('\n✅ Migração concluída!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});