# Firebase Functions for Asaas Integration

This directory contains Firebase Functions that handle Asaas payment webhooks and user management.

## Functions

1. **asaasWebhook** - Handles Asaas payment notifications
2. **updateUserCustomerId** - Updates user's Asaas customer ID in Firestore

## Setup Instructions

1. Install dependencies:
   ```
   cd functions
   npm install
   ```

2. Configure environment variables:
   - Set your Asaas access token in Firebase Functions config:
     ```
     firebase functions:config:set asaas.access_token="your_access_token"
     ```

3. Deploy functions:
   ```
   firebase deploy --only functions
   ```

## Testing with Sandbox

1. Make sure you have the Asaas sandbox access token in your `.env` file
2. Start the Firebase emulator:
   ```
   firebase emulators:start
   ```

3. Use a tool like ngrok to expose your local server for webhook testing:
   ```
   ngrok http 5001
   ```

4. Set up the webhook URL in your Asaas account settings to point to your ngrok URL:
   ```
   https://your-ngrok-url/your-project/us-central1/asaasWebhook
   ```

## Webhook Events Handled

- PAYMENT_RECEIVED - Activates user access when payment is received
- PAYMENT_CONFIRMED - Confirms user access when payment is confirmed
- PAYMENT_OVERDUE - Deactivates user access when payment is overdue

## Security

The webhook handler includes optional signature verification. To enable it:

1. Uncomment the verification code in the webhook handler
2. Set your webhook token in Firebase Functions config:
   ```
   firebase functions:config:set asaas.webhook_token="your_webhook_token"
   ```