const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// F-14: restrict CORS to known front-ends instead of '*'.
// (Non-browser callers like curl/Postman are not subject to CORS.)
const ALLOWED_ORIGINS = [
  'https://fluentoria.netlify.app',
  'https://fluentorialp.netlify.app',
  'https://www.fluentoria.com',
  'https://fluentoria.com',
  'http://localhost:8888',
  'http://localhost:5173',
];

const resolveOrigin = (origin) =>
  ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

// API endpoint to update user's Asaas customer ID
exports.updateUserCustomerId = functions.https.onRequest(async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', resolveOrigin(req.headers.origin || ''));
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  res.set('Access-Control-Allow-Origin', resolveOrigin(req.headers.origin || ''));

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      res.status(401).send('Unauthorized');
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Error verifying token:', err);
      res.status(401).send('Unauthorized');
      return;
    }

    const { userId, customerId } = req.body;

    if (!userId || !customerId) {
      res.status(400).send('Missing userId or customerId');
      return;
    }

    // Ensure user is updating their own record OR is an admin.
    // F-05: Firebase ID tokens have no 'role' custom claim in this project —
    // check the role in Firestore (same pattern as ensureAdminFromRequest).
    let isAdmin = decodedToken.email === 'jairosouza67@gmail.com';
    if (!isAdmin) {
      const callerSnap = await db.collection('users').doc(decodedToken.uid).get();
      isAdmin = callerSnap.exists && callerSnap.data()?.role === 'admin';
    }
    if (decodedToken.uid !== userId && !isAdmin) {
      console.error(`User ${decodedToken.uid} tried to update customerId for user ${userId}`);
      res.status(403).send('Forbidden');
      return;
    }

    // Update user document with Asaas customer ID
    await db.collection('users').doc(userId).update({
      asaasCustomerId: customerId,
      lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Updated user ${userId} with Asaas customer ID ${customerId}`);
    res.status(200).send('Customer ID updated successfully');
  } catch (error) {
    console.error('Error updating customer ID:', error);
    res.status(500).send('Internal Server Error');
  }
});