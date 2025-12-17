const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

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
    // Verify webhook signature (optional but recommended)
    // Uncomment and configure this section when you have your webhook access token
    /*
    const webhookToken = functions.config().asaas.webhook_token;
    const providedToken = req.headers['x-asass-access-token'];
    
    if (!webhookToken || providedToken !== webhookToken) {
      console.error('Invalid webhook token');
      res.status(401).send('Unauthorized');
      return;
    }
    */
    
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
        console.log('New user created with Asaas payment:', newUserRef.id);
      } else {
        // Update existing user
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          accessAuthorized: true,
          asaasCustomerId: customerData.id,
          paymentStatus: 'active',
          planStatus: 'active', // Sync planStatus with paymentStatus
          lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('User access activated:', userDoc.id);
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
          // Only deactivate if not manually authorized
          const userData = userDoc.data();
          if (!userData.manualAuthorization) {
            await userDoc.ref.update({
              accessAuthorized: false,
              paymentStatus: 'overdue',
              planStatus: 'pending', // Sync planStatus with paymentStatus
              lastAsaasSync: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('User access deactivated due to overdue payment:', userDoc.id);
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
};

// Update user customer ID endpoint
exports.updateUserCustomerId = updateUserCustomerId;