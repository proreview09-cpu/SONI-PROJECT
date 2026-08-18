const WhatsAppLog = require('../models/WhatsAppLog');
const Settings = require('../models/Settings');
const { defaultTemplates, renderTemplate } = require('../templates/whatsappTemplates');

async function getEffectiveTemplates() {
  const settings = await Settings.getSingleton();
  return { ...defaultTemplates, ...(settings.whatsappTemplates || {}) };
}

async function sendMessage(customer, templateType, data = {}, options = {}) {
  const settings = await Settings.getSingleton();
  const templates = await getEffectiveTemplates();
  const template = templates[templateType] || defaultTemplates[templateType] || '';
  const messageContent =
    renderTemplate(template, {
      customerName: customer.fullName,
      ...data,
    }) || data.message || '';

  const provider = settings.whatsappProvider || 'stub';
  let status = 'sent';

  if (provider === 'stub') {
    console.log(`\n[WhatsApp STUB → ${customer.phone}] (${templateType})\n${messageContent}\n`);
  } else {
    const { WHATSAPP_API_URL, WHATSAPP_API_KEY } = require('../config/env');
    // Real provider integration point (Meta Cloud API / BSP such as Gupshup,
    // AiSensy, Interakt, WATI): POST the rendered message to the configured
    // WHATSAPP_API_URL with WHATSAPP_API_KEY. Implement per chosen provider here.
    if (WHATSAPP_API_URL) {
      try {
        const response = await fetch(WHATSAPP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${WHATSAPP_API_KEY}`,
          },
          body: JSON.stringify({
            to: customer.phone,
            type: templateType,
            templateName: templateType,
            parameters: data,
            message: messageContent,
          }),
        });
        if (!response.ok) status = 'failed';
      } catch (err) {
        console.error('[whatsapp] provider send failed:', err.message);
        status = 'failed';
      }
    } else {
      console.warn('[whatsapp] provider configured but WHATSAPP_API_URL is empty — falling back to stub.');
    }
  }

  const log = await WhatsAppLog.create({
    customer: customer._id,
    installment: options.installmentId || null,
    templateType,
    messageContent,
    status,
    provider,
    sentAt: new Date(),
  });

  return log;
}

module.exports = { sendMessage, getEffectiveTemplates };
