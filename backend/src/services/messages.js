import { supabase } from '../db.js';
import { sendWhatsAppMessage, isWithin24HourWindow, whatsappConfigured } from './whatsapp.js';

function buildTemplateVariables(template, lead) {
  return (template.variables || ['name']).map((variable) => {
    if (variable === 'name') return lead.name;
    if (variable === 'location') return lead.location || 'your area';
    return '';
  });
}

async function ensureConversation(leadId) {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('lead_id', leadId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ lead_id: leadId })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

export async function sendMessageToLead(leadId, { body, templateName, templateVariables } = {}) {
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError) throw leadError;

  const withinWindow = isWithin24HourWindow(lead.last_incoming_at);

  if (!withinWindow && !templateName) {
    const error = new Error('Outside 24-hour window. Use a template message to initiate conversation.');
    error.requiresTemplate = true;
    throw error;
  }

  let messageBody = body;
  let resolvedTemplateName = templateName || null;
  let resolvedVariables = templateVariables;
  let metaTemplate = null;

  if (templateName) {
    const { data: template, error: tplError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (tplError) throw tplError;

    resolvedVariables = templateVariables || buildTemplateVariables(template, lead);
    messageBody = template.body;
    resolvedVariables.forEach((val, i) => {
      messageBody = messageBody.replace(`{{${i + 1}}}`, val);
    });

    metaTemplate = {
      name: template.name,
      languageCode: template.content_sid || 'en',
      variables: resolvedVariables,
    };
  }

  let waResult = { id: null, status: 'pending', delivered: false };
  let sendError = null;

  try {
    waResult = await sendWhatsAppMessage(lead.phone, messageBody, metaTemplate);
  } catch (err) {
    sendError = err.message;
    waResult = { id: null, status: 'failed', delivered: false };
  }

  const conversationId = await ensureConversation(leadId);

  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      lead_id: leadId,
      direction: 'outgoing',
      body: messageBody,
      template_name: resolvedTemplateName,
      twilio_sid: waResult.id,
      status: waResult.status,
    })
    .select()
    .single();

  if (msgError) throw msgError;

  if (lead.status === 'new') {
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', leadId);
  }

  if (sendError) {
    const error = new Error(
      whatsappConfigured
        ? `Message saved but WhatsApp delivery failed: ${sendError}`
        : 'Message saved in CRM. Add real Meta WhatsApp credentials in backend/.env to deliver to WhatsApp.'
    );
    error.messageSaved = true;
    error.savedMessage = message;
    error.withinWindow = withinWindow;
    error.whatsappStatus = waResult.status;
    throw error;
  }

  return {
    message,
    withinWindow,
    whatsappStatus: waResult.status,
    delivered: waResult.delivered,
    mock: waResult.status === 'mock',
  };
}

export async function sendBulkMessages(leadIds, templateName) {
  if (!templateName) {
    throw new Error('Template is required');
  }

  const results = [];

  for (const leadId of leadIds) {
    try {
      const data = await sendMessageToLead(leadId, { templateName });
      results.push({ leadId, success: true, data });
    } catch (err) {
      results.push({
        leadId,
        success: err.messageSaved || false,
        saved: err.messageSaved || false,
        data: err.message || null,
        error: err.message,
      });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const saved = results.filter((r) => r.saved).length;
  const failed = results.filter((r) => !r.success && !r.saved).length;

  return { results, sent, saved, failed, whatsappConfigured };
}
