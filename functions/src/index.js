const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

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
  // 1) Discover courses and primary course
  const coursesSnapshot = await db.collection('courses').get();
  const allCourseIds = coursesSnapshot.docs.map((d) => d.id);
  const primaryCourseId = allCourseIds[0] || 'default';

  // 2) Migrate legacy authorized users into user_courses
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

  // 3) Migrate mindful_flow missing productId
  const mindfulSnapshot = await db.collection('mindful_flow').get();
  let mindfulMigratedCount = 0;
  for (const flowDoc of mindfulSnapshot.docs) {
    const data = flowDoc.data() || {};
    if (!data.productId) {
      await flowDoc.ref.update({ productId: primaryCourseId });
      mindfulMigratedCount++;
    }
  }

  // 4) Migrate music missing productId
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

    // Try JSON payloads: {"courseId":"..."} or {"productId":"..."}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.courseId || parsed.productId || null;
      } catch (_err) {
        // Keep parsing using non-JSON formats
      }
    }

    // Try prefixed formats: courseId:abc123 or course=abc123
    const prefixedMatch = trimmed.match(/(?:^|[?&,:\s])(?:courseId|course|productId)=?\s*([a-zA-Z0-9_-]+)/i);
    if (prefixedMatch && prefixedMatch[1]) {
      return prefixedMatch[1];
    }

    // Fallback: treat raw string as courseId (legacy behavior)
    return trimmed;
  }

  if (typeof externalReference === 'object') {
    return externalReference.courseId || externalReference.productId || null;
  }

  return null;
};

// Import API endpoints
const { updateUserCustomerId } = require('./api/updateUserCustomerId');

// Asaas webhook endpoint
exports.asaasWebhook = functions.https.onRequest(async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Asaas-Access-Token');
    res.status(204).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify webhook signature (MANDATORY - fail-closed)
    const webhookToken = functions.config().asaas?.webhook_token;
    if (!webhookToken) {
      console.error('CRITICAL: asaas.webhook_token not configured. Rejecting all webhook requests.');
      res.status(500).send('Server misconfiguration');
      return;
    }

    const providedToken = req.headers['x-asaas-access-token'] || req.headers['X-Asaas-Access-Token'];
    if (!providedToken ||
        webhookToken.length !== String(providedToken).length ||
        !crypto.timingSafeEqual(
          Buffer.from(webhookToken),
          Buffer.from(String(providedToken))
        )) {
      console.error('Invalid webhook token. Provided:', providedToken ? 'exists' : 'missing');
      res.status(401).send('Unauthorized');
      return;
    }
    
    // Get the event type and data from the request
    const eventType = req.body.event;
    const paymentData = req.body.payment || {};
    const customerData = req.body.customer || {};

    console.log('Asaas webhook received:', eventType, paymentData);

    // Handle payment confirmation
    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      // Find user by email
      const email = customerData.email;
      if (!email) {
        console.error('No email found in customer data');
        res.status(400).send('Bad Request: Missing email');
        return;
      }

      // Query Firestore for user with this email
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

      let userId;

      if (snapshot.empty) {
        console.log('No user found with email:', email);
        // Create a new user if not found
        const newUserRef = await usersRef.add({
          email: email.toLowerCase(),
          name: customerData.name || '',
          displayName: customerData.name || '',
          role: 'student',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessAuthorized: true,
          asaasCustomerId: customerData.id,
          paymentStatus: 'active',
          planStatus: 'active', // Sync planStatus with paymentStatus
          lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
        });
        userId = newUserRef.id;
        console.log('New user created with Asaas payment:', userId);
      } else {
        // Update existing user
        const userDoc = snapshot.docs[0];
        userId = userDoc.id;
        await userDoc.ref.update({
          accessAuthorized: true,
          asaasCustomerId: customerData.id,
          paymentStatus: 'active',
          planStatus: 'active', // Sync planStatus with paymentStatus
          lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('User access activated:', userId);
      }

      // Handle Multi-Product mapping via externalReference
        const courseId = parseCourseIdFromExternalReference(paymentData.externalReference);
      if (courseId) {
          const userCoursesRef = db.collection('user_courses');
          const ucSnapshot = await userCoursesRef
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .get();
          
          if (ucSnapshot.empty) {
              await userCoursesRef.add({
                  userId: userId,
                  courseId: courseId,
                  status: 'active',
                  source: 'asaas',
                  asaasPaymentId: paymentData.id || null,
                  purchaseDate: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`Created user_courses mapping for user ${userId} and course ${courseId}`);
          } else {
              const docId = ucSnapshot.docs[0].id;
              await userCoursesRef.doc(docId).update({
                  status: 'active',
                  source: 'asaas',
                  asaasPaymentId: paymentData.id || null
              });
              console.log(`Updated user_courses mapping for user ${userId} and course ${courseId}`);
          }
      }

      res.status(200).send('Payment processed successfully');
      return;
    }

    // Handle payment overdue
    if (eventType === 'PAYMENT_OVERDUE') {
      // Find user by email
      const email = customerData.email;
      if (email) {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userId = userDoc.id;
          const userData = userDoc.data();
          
          // Only deactivate if not manually authorized
          if (!userData.manualAuthorization) {
            const courseId = parseCourseIdFromExternalReference(paymentData.externalReference);
            const userCoursesRef = db.collection('user_courses');
            
            if (courseId) {
              const ucSnapshot = await userCoursesRef
                .where('userId', '==', userId)
                .where('courseId', '==', courseId)
                .get();
                
              if (!ucSnapshot.empty) {
                await userCoursesRef.doc(ucSnapshot.docs[0].id).update({ status: 'overdue' });
                console.log(`Course ${courseId} for user ${userId} set to overdue`);
              }
              
              // Check if user has any other active courses
              const activeSnapshot = await userCoursesRef
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .get();
                
              if (activeSnapshot.empty) {
                 // No active courses left, deactivate global access
                 await userDoc.ref.update({
                  accessAuthorized: false,
                  paymentStatus: 'overdue',
                  planStatus: 'pending',
                  lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
                 });
                 console.log('User access deactivated globally (no active courses left):', userId);
              }
            } else {
               // Backward compatibility: no specific course ID, deactivate global access
               await userDoc.ref.update({
                 accessAuthorized: false,
                 paymentStatus: 'overdue',
                 planStatus: 'pending',
                 lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
               });
               console.log('User access deactivated due to overdue payment (legacy global):', userId);
            }
          }
        }
      }

      res.status(200).send('Payment overdue processed');
      return;
    }

    // Handle other events as needed
    console.log('Unhandled event type:', eventType);
    res.status(200).send('Event received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update user customer ID endpoint
exports.updateUserCustomerId = updateUserCustomerId;

// Callable migration endpoint (runs with Admin SDK, bypassing Firestore client rules)
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

// HTTP migration endpoint with explicit Bearer token auth (fallback for callable auth issues)
exports.runAccessMigrationHttp = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

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