const axios = require('axios');

/**
 * Send email via EmailJS REST API directly.
 * This is more reliable than the @emailjs/nodejs SDK for server-side usage.
 */
async function sendEmail(templateId, templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey || !privateKey) {
    console.warn('EmailJS environment variables missing. Skipping email send.');
    console.warn('Required: EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY');
    return null;
  }

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams
    }, {
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://shopnosonchoy.com'
      }
    });

    console.log(`Email sent successfully via template ${templateId}. Status: ${response.status}`);
    return response;
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error(`EmailJS API error (template: ${templateId}):`, errorMsg);
    throw err;
  }
}

module.exports = { sendEmail };
