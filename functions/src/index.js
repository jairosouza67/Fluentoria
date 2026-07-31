const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

// --- Gen2 secrets for webhook ---
const asaasWebhookToken = defineSecret('ASAAS_WEBHOOK_TOKEN');
const asaasApiKey = defineSecret('ASAAS_API_KEY');
const asaasEnvironment = defineSecret('ASAAS_ENVIRONMENT');

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

// --- Gen2 Webhook ---

exports.asaasWebhook = onRequest(
  { secrets: [asaasWebhookToken, asaasApiKey, asaasEnvironment] },
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
