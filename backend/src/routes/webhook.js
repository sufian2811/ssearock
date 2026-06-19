import { Router } from 'express';
import { supabase } from '../db.js';
import { config } from '../config.js';

const router = Router();

function normalizePhone(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

async function findLeadByPhone(phone) {
  const cleaned = String(phone).replace(/\D/g, '');
  const variants = [
    cleaned,
    `+${cleaned}`,
    cleaned.startsWith('92') ? `0${cleaned.slice(2)}` : cleaned,
  ];

  for (const variant of variants) {
    const { data } = await supabase
      .from('leads')
      .select('id, conversations(id)')
      .eq('phone', variant)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}

async function handleIncomingMessage({ phone, messageId, body, contactName }) {
  let lead = await findLeadByPhone(phone);

  if (!lead) {
    const formattedPhone = normalizePhone(phone);
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        name: contactName || `WhatsApp User ${phone.slice(-4)}`,
        phone: formattedPhone,
      })
      .select('id, conversations(id)')
      .single();

    if (error) throw error;
    lead = newLead;
  }

  const conversationId = lead.conversations?.[0]?.id || lead.conversations?.id;

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    lead_id: lead.id,
    direction: 'incoming',
    body: body || '',
    twilio_sid: messageId,
    status: 'received',
  });
}

router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post('/whatsapp', async (req, res) => {
  res.sendStatus(200);

  try {
    const payload = req.body;
    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value || {};

        for (const message of value.messages || []) {
          const phone = message.from;
          const messageId = message.id;
          const contactName = value.contacts?.find((c) => c.wa_id === phone)?.profile?.name;

          let body = '';
          if (message.type === 'text') {
            body = message.text?.body || '';
          } else {
            body = `[${message.type} message]`;
          }

          await handleIncomingMessage({ phone, messageId, body, contactName });
        }
      }
    }
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }
});

export default router;
