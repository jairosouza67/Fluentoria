const fetch = require('node-fetch');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
