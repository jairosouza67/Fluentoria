/**
 * Test script for Asaas webhook integration
 * 
 * This script simulates Asaas webhook calls to test the integration
 */

const https = require('https');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5001/YOUR_PROJECT/us-central1/asaasWebhook';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Sample webhook payloads
const paymentReceivedPayload = {
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: 'pay_1234567890',
    value: 99.90,
    status: 'CONFIRMED'
  },
  customer: {
    id: 'cus_1234567890',
    name: 'Test User',
    email: TEST_EMAIL
  }
};

const paymentOverduePayload = {
  event: 'PAYMENT_OVERDUE',
  payment: {
    id: 'pay_1234567890',
    value: 99.90,
    status: 'OVERDUE'
  },
  customer: {
    id: 'cus_1234567890',
    name: 'Test User',
    email: TEST_EMAIL
  }
};

function sendWebhook(payload) {
  const data = JSON.stringify(payload);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(WEBHOOK_URL, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

// Main execution
console.log('Testing Asaas webhook integration...');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('Test Email:', TEST_EMAIL);
console.log('');

console.log('Sending PAYMENT_RECEIVED event...');
sendWebhook(paymentReceivedPayload);

setTimeout(() => {
  console.log('Sending PAYMENT_OVERDUE event...');
  sendWebhook(paymentOverduePayload);
}, 2000);