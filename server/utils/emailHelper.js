const axios = require('axios');

/**
 * Send email via EmailJS REST API directly.
 * Uses the REST API instead of the @emailjs/nodejs SDK for reliable server-side delivery.
 */
async function sendEmail(templateId, templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  console.log('[EmailJS] Attempting to send email...');
  console.log('[EmailJS] Service ID:', serviceId ? '✓ Set' : '✗ MISSING');
  console.log('[EmailJS] Template ID:', templateId ? templateId : '✗ MISSING');
  console.log('[EmailJS] Public Key:', publicKey ? '✓ Set' : '✗ MISSING');
  console.log('[EmailJS] Private Key:', privateKey ? '✓ Set' : '✗ MISSING');
  console.log('[EmailJS] Recipient:', templateParams.email || templateParams.to_email || 'NOT PROVIDED');

  if (!serviceId || !publicKey || !privateKey) {
    console.error('[EmailJS] ERROR: Missing required environment variables. Email NOT sent.');
    console.error('[EmailJS] Required: EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY');
    return null;
  }

  if (!templateId) {
    console.error('[EmailJS] ERROR: Template ID is missing. Email NOT sent.');
    return null;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: templateParams
  };

  console.log('[EmailJS] Sending POST to https://api.emailjs.com/api/v1.0/email/send');
  console.log('[EmailJS] Payload template_params:', JSON.stringify(templateParams, null, 2));

  try {
    const response = await axios.post(
      'https://api.emailjs.com/api/v1.0/email/send',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('[EmailJS] ✓ SUCCESS! Status:', response.status, 'Response:', response.data);
    return response;
  } catch (err) {
    if (err.response) {
      console.error('[EmailJS] ✗ API ERROR! Status:', err.response.status);
      console.error('[EmailJS] ✗ Error Response:', JSON.stringify(err.response.data));
      console.error('[EmailJS] ✗ Headers:', JSON.stringify(err.response.headers));
    } else if (err.request) {
      console.error('[EmailJS] ✗ No response received (network/timeout error):', err.message);
    } else {
      console.error('[EmailJS] ✗ Request setup error:', err.message);
    }
    throw err;
  }
}

module.exports = { sendEmail };
