import { Router } from 'express';
import { supabase } from '../db.js';
import { isWithin24HourWindow, whatsappConfigured } from '../services/whatsapp.js';
import { sendMessageToLead, sendBulkMessages } from '../services/messages.js';
import { normalizeTemplate, slugifyTemplateName } from '../services/templates.js';

const router = Router();

router.get('/conversation/:leadId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        leads (id, name, phone, status, location, property_interest, last_incoming_at),
        messages (body, direction, created_at)
      `)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    const conversations = data
      .filter((conv) => conv.leads?.status !== 'new')
      .map((conv) => {
        const msgs = conv.messages || [];
        const lastMsg = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return { ...conv, last_message: lastMsg || null, messages: undefined };
      });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { leadId, body, templateName, templateVariables } = req.body;
    const result = await sendMessageToLead(leadId, { body, templateName, templateVariables });
    res.json(result);
  } catch (err) {
    if (err.messageSaved) {
      return res.status(207).json({
        warning: err.message,
        messageSaved: true,
        message: err.savedMessage,
        withinWindow: err.withinWindow,
        whatsappStatus: err.whatsappStatus,
      });
    }
    res.status(err.requiresTemplate ? 400 : 500).json({
      error: err.message,
      requiresTemplate: err.requiresTemplate || false,
    });
  }
});

router.post('/send-bulk', async (req, res) => {
  try {
    const { leadIds, templateName } = req.body;

    if (!leadIds?.length) {
      return res.status(400).json({ error: 'No leads selected' });
    }

    if (!templateName) {
      return res.status(400).json({ error: 'Template is required' });
    }

    const result = await sendBulkMessages(leadIds, templateName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (_req, res) => {
  res.json({
    whatsappConfigured,
    message: whatsappConfigured
      ? 'Meta WhatsApp is configured'
      : 'Meta WhatsApp credentials missing — messages save in CRM only until configured',
  });
});

router.get('/templates', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { name, body, languageCode = 'en' } = req.body;

    if (!name?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Template name and message are required' });
    }

    const templateName = slugifyTemplateName(name);
    if (!templateName) {
      return res.status(400).json({ error: 'Invalid template name' });
    }

    const { body: normalizedBody, variables } = normalizeTemplate(body);

    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        name: templateName,
        body: normalizedBody,
        variables,
        content_sid: languageCode,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'A template with this name already exists' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/window-status/:leadId', async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('last_incoming_at')
      .eq('id', req.params.leadId)
      .single();

    if (error) throw error;

    const withinWindow = isWithin24HourWindow(lead.last_incoming_at);
    res.json({
      withinWindow,
      lastIncomingAt: lead.last_incoming_at,
      canSendFreeform: withinWindow,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
