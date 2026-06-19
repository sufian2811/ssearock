import { config } from '../config.js';

const { accessToken, phoneNumberId, apiVersion } = config.whatsapp;

function isPlaceholder(value) {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return lower.startsWith('your-') || lower.includes('your-') || lower === 'changeme';
}

export const whatsappConfigured = Boolean(
  accessToken &&
  phoneNumberId &&
  !isPlaceholder(accessToken) &&
  !isPlaceholder(phoneNumberId)
);

export function formatPhoneNumber(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned.startsWith('92') && cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

export function isWithin24HourWindow(lastIncomingAt) {
  if (!lastIncomingAt) return false;
  const lastIncoming = new Date(lastIncomingAt);
  const now = new Date();
  const hoursDiff = (now - lastIncoming) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

export async function sendWhatsAppMessage(to, body, template = null) {
  const phone = formatPhoneNumber(to);

  if (!whatsappConfigured) {
    console.warn('Meta WhatsApp not configured — saving message locally only');
    return { id: `mock_${Date.now()}`, status: 'mock', delivered: false };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  let payload;

  if (template) {
    const templatePayload = {
      name: template.name,
      language: { code: template.languageCode || 'en' },
    };

    if (template.variables?.length) {
      templatePayload.components = [{
        type: 'body',
        parameters: template.variables.map((text) => ({
          type: 'text',
          text: String(text),
        })),
      }];
    }

    payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: templatePayload,
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body },
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.error?.message || 'WhatsApp API request failed';
    const error = new Error(message);
    error.metaError = data.error;
    throw error;
  }

  return {
    id: data.messages?.[0]?.id || null,
    status: 'sent',
    delivered: true,
  };
}
