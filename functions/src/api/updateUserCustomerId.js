const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// API endpoint to update user's Asaas customer ID
exports.updateUserCustomerId = functions.https.onRequest(async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

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

    // Ensure user is updating their own record OR is an admin
    if (decodedToken.uid !== userId && decodedToken.role !== 'admin' && decodedToken.email !== 'jairosouza67@gmail.com') {
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