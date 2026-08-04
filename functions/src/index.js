const functions = require('firebase-functions');
const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

// --- Gen2 secrets for webhook ---
const asaasWebhookToken = defineSecret('ASAAS_WEBHOOK_TOKEN');
const asaasApiKey = defineSecret('ASAAS_API_KEY');
const asaasEnvironment = defineSecret('ASAAS_ENVIRONMENT');
const resendApiKey = defineSecret('RESEND_API_KEY');

// --- Helpers (keep intact) ---

const ensureAdminContext = async (context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const userSnap = await db.collection('users').doc(context.auth.uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem executar esta migração.');
  }
};

const ensureAdminFromRequest = async (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const idToken = authHeader.slice('Bearer '.length);
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (_err) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const userSnap = await db.collection('users').doc(decodedToken.uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem executar esta migração.');
  }

  return decodedToken.uid;
};

const runLegacyMigrationAsAdmin = async () => {
  const coursesSnapshot = await db.collection('courses').get();
  const allCourseIds = coursesSnapshot.docs.map((d) => d.id);
  const primaryCourseId = allCourseIds[0] || 'default';

  const usersSnapshot = await db.collection('users').where('accessAuthorized', '==', true).get();
  let userMigratedCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const ucSnapshot = await db.collection('user_courses').where('userId', '==', uid).limit(1).get();

    if (ucSnapshot.empty) {
      const courseIdsToGrant = allCourseIds.length > 0 ? allCourseIds : ['default'];
      for (const courseId of courseIdsToGrant) {
        await db.collection('user_courses').add({
          userId: uid,
          courseId,
          status: 'active',
          source: 'manual',
          purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      userMigratedCount++;
    }
  }

  const mindfulSnapshot = await db.collection('mindful_flow').get();
  let mindfulMigratedCount = 0;
  for (const flowDoc of mindfulSnapshot.docs) {
    const data = flowDoc.data() || {};
    if (!data.productId) {
      await flowDoc.ref.update({ productId: primaryCourseId });
      mindfulMigratedCount++;
    }
  }

  const musicSnapshot = await db.collection('music').get();
  let musicMigratedCount = 0;
  for (const musicDoc of musicSnapshot.docs) {
    const data = musicDoc.data() || {};
    if (!data.productId) {
      await musicDoc.ref.update({ productId: primaryCourseId });
      musicMigratedCount++;
    }
  }

  return {
    success: true,
    message: `Migração concluída: ${userMigratedCount} alunos, ${mindfulMigratedCount} conteúdos Mindful e ${musicMigratedCount} músicas atualizados.`,
    details: {
      users: userMigratedCount,
      mindful: mindfulMigratedCount,
      music: musicMigratedCount,
      primaryCourseId,
    },
  };
};

const parseCourseIdFromExternalReference = (externalReference) => {
  if (!externalReference) return null;

  if (typeof externalReference === 'string') {
    const trimmed = externalReference.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.courseId || parsed.productId || null;
      } catch (_err) {
      }
    }

    const prefixedMatch = trimmed.match(/(?:^|[?&,:\s])(?:courseId|course|productId)=?\s*([a-zA-Z0-9_-]+)/i);
    if (prefixedMatch && prefixedMatch[1]) {
      return prefixedMatch[1];
    }

    return trimmed;
  }

  if (typeof externalReference === 'object') {
    return externalReference.courseId || externalReference.productId || null;
  }

  return null;
};

// --- Webhook helpers ---

const getAsaasApiBase = () => {
  return asaasEnvironment.value() === 'sandbox'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://www.asaas.com/api/v3';
};

const resolveUser = async (paymentCustomerId, apiBase, apiKey) => {
  if (!paymentCustomerId) {
    return { doc: null, method: 'no_customer_id' };
  }

  const byCustomerSnapshot = await db.collection('users')
    .where('asaasCustomerId', '==', paymentCustomerId)
    .limit(1).get();
  if (!byCustomerSnapshot.empty) {
    return { doc: byCustomerSnapshot.docs[0], method: 'customerId' };
  }

  try {
    const response = await fetch(`${apiBase}/customers/${paymentCustomerId}`, {
      headers: { 'access_token': apiKey }
    });

    if (!response.ok) {
      return { doc: null, method: 'api_failed', apiStatus: response.status };
    }

    const customer = await response.json();
    const email = customer.email?.toLowerCase();
    const name = customer.name;

    if (!email) {
      return { doc: null, method: 'no_email_in_api', customerData: { name } };
    }

    const byEmailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1).get();

    if (!byEmailSnapshot.empty) {
      return { doc: byEmailSnapshot.docs[0], method: 'email', customerData: { email, name } };
    }

    return { doc: null, method: 'not_found', customerData: { email, name } };
  } catch (err) {
    return { doc: null, method: 'api_error', error: err.message };
  }
};

const activateAccess = async (userId, paymentData, customerId) => {
  const courseId = parseCourseIdFromExternalReference(paymentData.externalReference);

  const activationFields = {
    accessAuthorized: true,
    asaasCustomerId: customerId,
    paymentStatus: 'active',
    planStatus: 'active',
    lastAsaasSync: admin.firestore.FieldValue.serverTimestamp(),
  };

  // F-11: never merge into an existing doc (could preserve tampered fields like
  // an elevated role). Update existing docs; only create with a safe default role.
  const userRef = db.collection('users').doc(userId);
  const existingDoc = await userRef.get();
  if (existingDoc.exists) {
    await userRef.update(activationFields);
  } else {
    await userRef.set({ ...activationFields, role: 'student' });
  }

  if (courseId) {
    const userCoursesRef = db.collection('user_courses');
    const ucSnapshot = await userCoursesRef
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();

    if (ucSnapshot.empty) {
      await userCoursesRef.add({
        userId,
        courseId,
        status: 'active',
        source: 'asaas',
        asaasPaymentId: paymentData.id || null,
        purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await userCoursesRef.doc(ucSnapshot.docs[0].id).update({
        status: 'active',
        source: 'asaas',
        asaasPaymentId: paymentData.id || null,
      });
    }
  }
};

const deactivateAccess = async (userId, paymentData, status) => {
  const userRef = db.collection('users').doc(userId);
  const userData = (await userRef.get()).data();

  // F-12: observability when manual authorization blocks an automatic deactivation
  if (userData?.manualAuthorization) {
    console.warn(JSON.stringify({
      userId,
      event: 'deactivation_blocked',
      reason: 'manualAuthorization',
      attemptedStatus: status,
    }));
    return false;
  }

  // F-13: a deleted payment must surface as 'canceled', not 'pending'
  const mappedPlanStatus = status === 'canceled' ? 'canceled' : 'pending';

  const courseId = parseCourseIdFromExternalReference(paymentData.externalReference);
  const userCoursesRef = db.collection('user_courses');

  if (courseId) {
    const ucSnapshot = await userCoursesRef
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();

    if (!ucSnapshot.empty) {
      await userCoursesRef.doc(ucSnapshot.docs[0].id).update({ status });
    }

    const activeSnapshot = await userCoursesRef
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (activeSnapshot.empty) {
      await userRef.update({
        accessAuthorized: false,
        paymentStatus: status,
        planStatus: mappedPlanStatus,
        lastAsaasSync: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } else {
    await userRef.update({
      accessAuthorized: false,
      paymentStatus: status,
      planStatus: mappedPlanStatus,
      lastAsaasSync: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return true;
};

// --- Welcome email (Resend REST API via fetch puro, sem SDK) ---

const escapeHtml = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// Table-based, tudo inline-styled: clients de email (Gmail, Outlook) stripam
// <style>, nao carregam webfonts nem CSS de CDN. Espelha o conteudo do sucesso.html.
const buildWelcomeEmailHtml = (name, toEmail) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(toEmail);
  const greeting = safeName ? `, ${safeName}` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0B0B;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header: checkmark + titulo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" width="80" height="80" style="width:80px;height:80px;background-color:#22c55e33;border-radius:50%;font-size:40px;color:#22c55e;font-weight:bold;line-height:80px;">&#10003;</td>
                </tr>
              </table>
              <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:24px 0 12px 0;line-height:1.3;">Compra Realizada com Sucesso! &#127881;</h1>
              <p style="color:#9ca3af;font-size:16px;margin:0;line-height:1.5;">Parab&eacute;ns${greeting}! Voc&ecirc; est&aacute; a um passo de come&ccedil;ar sua jornada no ingl&ecirc;s.</p>
            </td>
          </tr>

          <!-- Card de instrucoes -->
          <tr>
            <td style="background-color:#FF6A00;border-radius:16px;padding:2px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:14px;">
                <tr>
                  <td style="padding:28px 24px;">
                    <h2 style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 24px 0;">&#128241; Como Acessar o App</h2>

                    <!-- Passo 1 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">1</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Acesse a Plataforma</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.5;">Clique no bot&atilde;o abaixo para acessar o aplicativo web da Fluentoria.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Passo 2 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">2</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Crie sua Conta</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0 0 8px 0;line-height:1.5;">Na tela de cadastro, preencha:</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0 0 6px 0;line-height:1.5;"><strong>Email:</strong> Use <span style="color:#FF6A00;font-weight:bold;">${safeEmail}</span> (o mesmo email da compra)</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0 0 6px 0;line-height:1.5;"><strong>Nome:</strong> Seu nome completo</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.5;"><strong>Senha:</strong> Crie uma senha segura</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Passo 3 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td valign="top" width="32" style="width:32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                            <td align="center" width="32" height="32" style="width:32px;height:32px;background-color:#FF6A00;border-radius:50%;color:#ffffff;font-weight:bold;font-size:14px;line-height:32px;">3</td>
                          </tr></table>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:6px 0 4px 0;">Aproveite!</p>
                          <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.5;">Ap&oacute;s criar sua conta, voc&ecirc; ter&aacute; acesso completo a todas as funcionalidades do seu plano.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Aviso importante -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FF6A001A;border:1px solid #FF6A004D;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="color:#FF6A00;font-size:14px;font-weight:bold;margin:0 0 4px 0;">Importante!</p>
                          <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.5;">&Eacute; essencial que voc&ecirc; use o <strong>mesmo email utilizado na compra</strong> para criar sua conta. Isso garante que seu plano seja ativado automaticamente.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:32px 0 8px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#FF6A00;border-radius:12px;">
                    <a href="https://app.fluentoria.com.br/" target="_blank" style="display:inline-block;padding:16px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Acessar o App Agora &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:13px;margin:16px 0 0 0;">Guarde este email &mdash; ele &eacute; sua chave de acesso.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px 0;border-top:1px solid #1f2937;">
              <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.6;">D&uacute;vidas? Fale com a gente no <a href="https://wa.me/557791221346" style="color:#25D366;text-decoration:none;">WhatsApp</a>.</p>
              <p style="color:#4b5563;font-size:12px;margin:8px 0 0 0;">Fluentoria &mdash; Sua jornada no ingl&ecirc;s come&ccedil;a agora.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendWelcomeEmail = async (toEmail, name, apiKey) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fluentoria <boasvindas@fluentoria.com.br>',
        to: [toEmail],
        subject: 'Bem-vindo(a) à Fluentoria! 🎉',
        html: buildWelcomeEmailHtml(name, toEmail),
      }),
    });

    if (!response.ok) {
      console.error(JSON.stringify({ resendError: response.status, body: await response.text() }));
    }
    return response.ok;
  } catch (err) {
    console.error(JSON.stringify({ resendFetchError: err.message }));
    return false;
  }
};

// --- Gen2 Webhook ---

exports.asaasWebhook = onRequest(
  { secrets: [asaasWebhookToken, asaasApiKey, asaasEnvironment, resendApiKey] },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, asaas-access-token');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const token = asaasWebhookToken.value();
      if (!token) {
        console.error(JSON.stringify({ error: 'ASAAS_WEBHOOK_TOKEN not configured' }));
        res.status(500).json({ error: 'Server misconfiguration' });
        return;
      }

      const provided = req.headers['asaas-access-token'];
      // Compare SHA-256 hashes (fixed length) to avoid leaking token length via timing
      const tokenHash = crypto.createHash('sha256').update(token).digest();
      const providedHash = crypto.createHash('sha256').update(String(provided || '')).digest();
      if (!crypto.timingSafeEqual(tokenHash, providedHash)) {
        console.warn(JSON.stringify({ error: 'Invalid webhook token' }));
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { event, payment } = req.body || {};
      const paymentId = payment?.id;
      const customerId = payment?.customer;

      console.log(JSON.stringify({ event, paymentId, customerId }));

      if (!event || !paymentId) {
        res.status(400).json({ error: 'Missing event or payment.id' });
        return;
      }

      if (event === 'TEST' || event.startsWith('WEBHOOK_TEST')) {
        res.status(200).json({ received: true, test: true });
        return;
      }

      const idempotencyId = `${paymentId}_${event}`;
      const idemRef = db.collection('webhook_events').doc(idempotencyId);

      // Atomic check-and-set: prevents two concurrent webhooks for the same
      // event from both passing the idempotency guard (race condition).
      let isDuplicate = false;
      await db.runTransaction(async (tx) => {
        const idemDoc = await tx.get(idemRef);
        if (idemDoc.exists && idemDoc.data()?.processed) {
          isDuplicate = true;
          return;
        }
        tx.set(idemRef, {
          event,
          paymentId,
          customerId,
          processed: false,
          welcomeEmailSent: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      if (isDuplicate) {
        console.log(JSON.stringify({ event, paymentId, duplicate: true }));
        res.status(200).json({ duplicate: true });
        return;
      }

      const apiBase = getAsaasApiBase();
      const apiKey = asaasApiKey.value();
      const { doc: userDoc, method, customerData, apiStatus } =
        await resolveUser(customerId, apiBase, apiKey);

      let userId;
      if (userDoc) {
        userId = userDoc.id;
      } else if (method === 'not_found') {
        const newUserRef = await db.collection('users').add({
          email: customerData.email || '',
          name: customerData.name || '',
          displayName: customerData.name || '',
          role: 'student',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userId = newUserRef.id;
      } else {
        console.error(JSON.stringify({
          event,
          paymentId,
          error: `resolveUser:${method}`,
          apiStatus: apiStatus || null,
        }));
        res.status(400).json({ error: 'Could not resolve customer' });
        return;
      }

      const activationEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];
      const deactivationMap = {
        PAYMENT_OVERDUE: 'overdue',
        PAYMENT_REFUNDED: 'refunded',
        PAYMENT_DELETED: 'canceled',
      };

      if (activationEvents.includes(event)) {
        await activateAccess(userId, payment, customerId);

        // Welcome email: 1 envio por paymentId (RECEIVED e CONFIRMED criam docs
        // de idempotencia separados; a query por paymentId evita email duplicado).
        // Se o envio falhar, a flag nao e marcada e o proximo evento tenta de novo.
        const userEmail = (userDoc?.data()?.email || customerData?.email || '').toLowerCase();
        if (userEmail) {
          // ponytail: index merge de single-field indexes (sem orderBy, nao precisa de composite index)
          const alreadySent = await db.collection('webhook_events')
            .where('paymentId', '==', paymentId)
            .where('welcomeEmailSent', '==', true)
            .limit(1).get();

          if (alreadySent.empty) {
            try {
              const sent = await sendWelcomeEmail(
                userEmail,
                userDoc?.data()?.name || customerData?.name,
                resendApiKey.value()
              );
              if (sent) await idemRef.update({ welcomeEmailSent: true });
            } catch (emailErr) {
              console.error(JSON.stringify({ event, paymentId, emailError: emailErr.message }));
            }
          }
        }
      } else if (deactivationMap[event]) {
        await deactivateAccess(userId, payment, deactivationMap[event]);
      } else {
        console.log(JSON.stringify({ event, paymentId, unhandled: true }));
      }

      await idemRef.update({ processed: true });

      res.status(200).json({ processed: true });
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }));
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// --- Gen1 exports (unchanged) ---

const { updateUserCustomerId } = require('./api/updateUserCustomerId');

exports.updateUserCustomerId = updateUserCustomerId;

// Adopt orphan user: runs with Admin SDK (bypasses client-side Firestore rules)
exports.adoptOrphanUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const { uid, displayName, photoURL } = data;

  if (uid !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'UID mismatch.');
  }

  // F-06: use the authenticated token's email, never the client-supplied payload,
  // so an attacker cannot adopt an orphan record belonging to another person's email.
  const emailLower = (context.auth.token.email || '').toLowerCase();
  if (!emailLower) {
    return { adopted: false };
  }

  const candidatesSnapshot = await db.collection('users')
    .where('email', '==', emailLower).get();

  const candidates = candidatesSnapshot.docs.filter(d => d.id !== uid);

  if (candidates.length === 0) {
    // No orphan to adopt — ensure the profile doc exists with safe defaults.
    // Client-side creation with role/payment fields is blocked by Firestore
    // rules, so profile creation must happen here via Admin SDK.
    const existing = await db.collection('users').doc(uid).get();
    if (existing.exists) return { adopted: false, created: false };

    let role = emailLower === 'jairosouza67@gmail.com' ? 'admin' : 'student';
    if (role !== 'admin') {
      const inviteSnap = await db.collection('adminEmails')
        .where('email', '==', emailLower).limit(1).get();
      if (!inviteSnap.empty) role = 'admin';
    }

    await db.collection('users').doc(uid).set({
      email: emailLower,
      name: displayName || '',
      displayName: displayName || '',
      photoURL: photoURL || '',
      role,
      accessAuthorized: role === 'admin',
      paymentStatus: role === 'admin' ? 'admin' : 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { adopted: false, created: true };
  }

  let best = candidates[0];
  for (const doc of candidates) {
    const d = doc.data();
    if (d.accessAuthorized || d.asaasCustomerId) { best = doc; break; }
  }

  const orphanData = best.data();
  const isAdminEmail = emailLower === 'jairosouza67@gmail.com';
  const role = isAdminEmail ? 'admin' : (orphanData.role || 'student');

  const paymentFields = [
    'accessAuthorized', 'paymentStatus', 'planStatus', 'asaasCustomerId',
    'planType', 'planValue', 'planStartDate', 'planEndDate',
    'manualAuthorization', 'lastAsaasSync',
  ];

  const merged = {};
  merged.email = emailLower;
  merged.name = displayName || orphanData.name || '';
  merged.displayName = displayName || orphanData.displayName || '';
  merged.photoURL = photoURL || orphanData.photoURL || '';
  merged.lastLogin = new Date();
  merged.role = role;

  for (const field of paymentFields) {
    if (orphanData[field] !== undefined) {
      merged[field] = orphanData[field];
    }
  }

  await db.collection('users').doc(uid).set(merged);

  const ucSnapshot = await db.collection('user_courses')
    .where('userId', '==', best.id).get();

  const batch = [];
  for (const ucDoc of ucSnapshot.docs) {
    batch.push(ucDoc.ref.update({ userId: uid }));
  }
  for (const c of candidates) {
    batch.push(c.ref.delete());
  }
  await Promise.all(batch);

  return { adopted: true };
});

exports.runAccessMigration = functions.https.onCall(async (_data, context) => {
  try {
    await ensureAdminContext(context);
    return await runLegacyMigrationAsAdmin();
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Migration callable error:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno na migração.');
  }
});

// F-14: restrict CORS to known front-ends instead of '*'.
// (Non-browser callers like curl/Postman are not subject to CORS.)
const MIGRATION_ALLOWED_ORIGINS = [
  'https://fluentoria.netlify.app',
  'https://fluentorialp.netlify.app',
  'https://www.fluentoria.com',
  'https://fluentoria.com',
  'http://localhost:8888',
  'http://localhost:5173',
];

const resolveMigrationOrigin = (origin) =>
  MIGRATION_ALLOWED_ORIGINS.includes(origin) ? origin : MIGRATION_ALLOWED_ORIGINS[0];

exports.runAccessMigrationHttp = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', resolveMigrationOrigin(req.headers.origin || ''));
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  res.set('Access-Control-Allow-Origin', resolveMigrationOrigin(req.headers.origin || ''));

  try {
    await ensureAdminFromRequest(req);
    const result = await runLegacyMigrationAsAdmin();
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      const statusCode = error.code === 'permission-denied' ? 403 : error.code === 'unauthenticated' ? 401 : 500;
      res.status(statusCode).json({ success: false, message: error.message, code: error.code });
      return;
    }

    console.error('Migration HTTP error:', error);
    res.status(500).json({ success: false, message: 'Erro interno na migração.' });
  }
});

// --- Manual resend of the welcome email (admin-only, Gen2 callable) ---
// Use case: customer paid, access is active, but the welcome email was lost
// (spam folder, typo'd address fixed later, Resend transient failure, etc).
exports.resendWelcomeEmail = onCall(
  { secrets: [resendApiKey] },
  async (request) => {
    // Gen2 callable: auth context lives on request.auth
    if (!request.auth || !request.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
    }

    const adminSnap = await db.collection('users').doc(request.auth.uid).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem reenviar o email.');
    }

    const email = String(request.data?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Email inválido.');
    }

    // Prefer the name stored on the user doc (if any) for a personalized greeting
    let name = String(request.data?.name || '').trim();
    if (!name) {
      const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!userSnap.empty) {
        name = userSnap.docs[0].data()?.name || '';
      }
    }

    const sent = await sendWelcomeEmail(email, name, resendApiKey.value());

    console.log(JSON.stringify({
      event: 'resendWelcomeEmail',
      email,
      sent,
      requestedBy: request.auth.uid,
    }));

    if (!sent) {
      throw new functions.https.HttpsError('internal', 'Falha ao enviar email via Resend. Verifique os logs.');
    }

    return { sent: true, email };
  }
);
