// Read-only verification: client doc state + user_courses after webhook replay
//
// Auth: reutiliza o access_token que o firebase-tools já armazena localmente
// (criado via `npx firebase login`). NENHUM client_id/client_secret é necessário.
// NÃO hardcode credenciais neste arquivo — o último incidente do GitGuardian foi por isso.
// Se o token estiver expirado (HTTP 401), rode: npx firebase login --reauth
const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const PROJECT = 'fluentoria-527b2';
const UID = 'wqj3zhjtXNPAE2lYDTOU1WkEppB2';

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); } catch { resolve({ status: res.statusCode, body: buf }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const val = (f) => {
  if (!f) return null;
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.integerValue !== undefined) return f.integerValue;
  if (f.timestampValue !== undefined) return f.timestampValue;
  return null;
};

const checkAuth = (res) => {
  if (res.status === 401 || res.status === 403) {
    console.error(`Autenticação falhou (HTTP ${res.status}). Token expirado — rode: npx firebase login --reauth`);
    process.exit(1);
  }
};

(async () => {
  const store = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const token = store.tokens && store.tokens.access_token;
  if (!token) {
    console.error('access_token não encontrado em firebase-tools.json. Rode: npx firebase login');
    process.exit(1);
  }
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

  // 1) Client user doc
  const userDoc = await request('GET', `${base}/users/${UID}`, null, token);
  checkAuth(userDoc);
  const f = userDoc.body.fields || {};
  console.log('=== Cliente eutimis20 (users/' + UID + ') ===');
  console.log('email:            ', val(f.email));
  console.log('role:             ', val(f.role));
  console.log('accessAuthorized: ', val(f.accessAuthorized));
  console.log('paymentStatus:    ', val(f.paymentStatus));
  console.log('planStatus:       ', val(f.planStatus));
  console.log('asaasCustomerId:  ', val(f.asaasCustomerId) || '(AUSENTE)');
  console.log('lastAsaasSync:    ', val(f.lastAsaasSync) || '(AUSENTE)');

  // 2) user_courses for this client
  const q = await request('POST', `${base}:runQuery`, {
    structuredQuery: { from: [{ collectionId: 'user_courses' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: UID } } } },
  }, token);
  checkAuth(q);
  console.log('\n=== user_courses do cliente ===');
  const rows = (Array.isArray(q.body) ? q.body : []).filter(r => r.document);
  if (rows.length === 0) {
    console.log('(nenhum curso vinculado — pagamento nao tinha externalReference com courseId)');
  }
  for (const r of rows) {
    const cf = r.document.fields || {};
    console.log(`courseId=${val(cf.courseId)} | status=${val(cf.status)} | source=${val(cf.source)} | payment=${val(cf.asaasPaymentId)}`);
  }

  // 3) Courses available (for context)
  const courses = await request('GET', `${base}/courses?pageSize=20`, null, token);
  checkAuth(courses);
  console.log('\n=== Cursos disponiveis ===');
  for (const d of (courses.body.documents || [])) {
    console.log(`${d.name.split('/').pop()}  ->  ${val((d.fields || {}).title)}`);
  }

  // 4) Latest webhook_events
  const events = await request('GET', `${base}/webhook_events?pageSize=10&orderBy=createdAt%20desc`, null, token);
  checkAuth(events);
  console.log('\n=== webhook_events (ultimos) ===');
  for (const d of (events.body.documents || [])) {
    const ef = d.fields || {};
    console.log(`${d.name.split('/').pop()} | processed=${val(ef.processed)} | ${val(ef.createdAt)}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
