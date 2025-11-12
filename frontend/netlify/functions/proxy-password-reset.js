const axios = require('axios');

exports.handler = async function(event, context) {
  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    console.log('🔧 Proxy: Enviando código de recuperación a:', email);
    
    const response = await axios.post('https://adaptafit.onrender.com/api/users/password-reset/', {
      email: email
    }, {
      timeout: 10000
    });

    console.log('🔧 Proxy: Respuesta del backend:', response.data);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('❌ Error en proxy:', error.response?.data || error.message);
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.response?.data?.error || 'Error interno del servidor'
      })
    };
  }
};