/**
 * Netlify Serverless Function: youtube-upload
 * 
 * Recebe um arquivo de vídeo do frontend e faz upload direto para o YouTube.
 * 
 * PRÉ-REQUISITOS:
 * 1. Configurar variáveis de ambiente no Netlify:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_REFRESH_TOKEN (token OAuth obtido uma vez)
 * 2. Habilitar YouTube Data API v3 no Google Cloud Console
 * 
 * COMO OBTER O REFRESH TOKEN:
 *    node scripts/get-youtube-refresh-token.js
 *    (abre navegador, autoriza, gera o token)
 */

const { google } = require('googleapis');
const Busboy = require('busboy');

// Limite de tamanho: 2GB (máximo do YouTube para contas não verificadas)
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

function getYouTubeClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://fluentoria.netlify.app/.netlify/functions/youtube-upload'
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }

  return google.youtube({ version: 'v3', auth });
}

exports.handler = async (event) => {
  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verificar autenticação (opcional: token do Firebase Auth)
  // const authHeader = event.headers.authorization;
  // if (!authHeader) return { statusCode: 401, body: 'Unauthorized' };

  try {
    // Parse multipart/form-data
    const result = await parseMultipart(event);
    
    if (!result.file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nenhum arquivo enviado.' }),
      };
    }

    const { file, fields } = result;
    const title = fields.title || 'Aula Fluentoria';
    const description = fields.description || 'Vídeo da Fluentoria';
    const privacyStatus = fields.privacyStatus || 'unlisted';

    // Upload para YouTube
    const youtube = getYouTubeClient();
    
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.substring(0, 100),
          description: description.substring(0, 5000),
          categoryId: '27', // Education
          tags: ['Fluentoria', 'aula'],
        },
        status: {
          privacyStatus: privacyStatus, // unlisted, public, private
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: file,
      },
    });

    const youtubeUrl = `https://www.youtube.com/watch?v=${response.data.id}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        youtubeId: response.data.id,
        youtubeUrl,
      }),
    };
  } catch (error) {
    console.error('YouTube upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro ao fazer upload para o YouTube.',
        details: error.message,
      }),
    };
  }
};

/**
 * Parse multipart/form-data usando Busboy
 */
function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        'content-type': event.headers['content-type'],
      },
      limits: { fileSize: MAX_FILE_SIZE },
    });

    const fields = {};
    let fileBuffer = null;
    let fileName = '';
    let error = null;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const chunks = [];
      fileName = info.filename;
      
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
      
      stream.on('limit', () => {
        error = new Error('Arquivo muito grande (máximo: 2GB).');
      });
    });

    busboy.on('finish', () => {
      if (error) reject(error);
      else resolve({ fields, file: fileBuffer, fileName });
    });

    busboy.on('error', reject);

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });
}