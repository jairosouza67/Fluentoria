const fetch = require('node-fetch');
const { jwtVerify, createRemoteJWKSet } = require('jose');

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'));

const verifyFirebaseToken = async (token) => {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'dark-theme-lms';
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify authentication
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Missing token' }),
    };
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyFirebaseToken(token);

  if (!decodedToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid token' }),
    };
  }

  try {
    const { customerId } = JSON.parse(event.body);

    // Validate required fields
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: customerId' }),
      };
    }

    const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN;
    const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

    if (!ASAAS_ACCESS_TOKEN) {
      console.error('ASAAS_ACCESS_TOKEN not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    // Get customer payments from Asaas
    const response = await fetch(
      `${ASAAS_API_URL}/payments?customer=${customerId}&status=CONFIRMED`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_ACCESS_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Asaas API error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: data.description || 'Failed to fetch payment status',
          details: data.errors || []
        }),
      };
    }

    const payments = data.data || [];

    // Check if has active payments
    const now = new Date();
    const hasActivePayment = payments.some((payment) => {
      const dueDate = new Date(payment.dueDate);
      return payment.status === 'CONFIRMED' && dueDate >= now;
    });

    let status = 'no_payment';
    if (hasActivePayment) {
      status = 'active';
    } else if (payments.length > 0) {
      status = 'overdue';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authorized: hasActivePayment,
        status: status,
        payments: payments,
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
