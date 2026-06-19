import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, AlertCircle, FileText, MessageSquare, Settings } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import TemplateManager from '../components/TemplateManager';

function displayBody(body, variables = []) {
  let text = body;
  variables.forEach((variable, index) => {
    text = text.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), `{{${variable}}}`);
  });
  return text;
}

export default function Chat() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [windowStatus, setWindowStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [waStatus, setWaStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const loadTemplates = async () => {
    const data = await api.messages.getTemplates();
    setTemplates(data);
  };

  const loadConversations = async () => {
    const data = await api.messages.getConversations();
    setConversations(data);

    if (leadId && !data.some((c) => c.leads?.id === leadId)) {
      navigate('/chat');
    }
  };

  const loadMessages = async (id) => {
    const [msgs, status, lead] = await Promise.all([
      api.messages.getConversation(id),
      api.messages.getWindowStatus(id),
      api.leads.get(id),
    ]);

    if (lead.status === 'new') {
      navigate('/chat');
      return;
    }

    setMessages(msgs);
    setWindowStatus(status);
    setSelectedLead(lead);
  };

  useEffect(() => {
    loadConversations();
    loadTemplates();
    api.messages.getStatus().then(setWaStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (leadId) loadMessages(leadId);
    else setSelectedLead(null);
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectLead = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !leadId) return;

    setSending(true);
    setError('');
    setWarning('');
    try {
      const result = await api.messages.send({ leadId, body: newMessage });
      setNewMessage('');
      if (result.warning) setWarning(result.warning);
      loadMessages(leadId);
      loadConversations();
    } catch (err) {
      if (err.message.includes('template')) {
        setError('Outside 24-hour window. Please use a template message.');
        setShowTemplates(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async (template) => {
    if (!leadId || !selectedLead) return;

    setSending(true);
    setError('');
    setWarning('');
    try {
      const variables = template.variables?.map((v) => {
        if (v === 'name') return selectedLead.name;
        if (v === 'location') return selectedLead.location || 'your area';
        return '';
      }) || [selectedLead.name];

      const result = await api.messages.send({
        leadId,
        templateName: template.name,
        templateVariables: variables,
      });
      setShowTemplates(false);
      if (result.warning) setWarning(result.warning);
      loadMessages(leadId);
      loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Conversations</h2>
          <button
            onClick={() => setShowTemplateManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50"
            title="Manage templates"
          >
            <Settings className="w-4 h-4" />
            Templates
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!waStatus?.whatsappConfigured && (
            <div className="m-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
              Meta WhatsApp is not configured. Messages save in CRM only. Add credentials in backend/.env
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectLead(conv.leads?.id)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                leadId === conv.leads?.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">{conv.leads?.name}</p>
                <StatusBadge status={conv.leads?.status} />
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">
                {conv.last_message?.body || 'No messages'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : ''}
              </p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="p-4 text-gray-500 text-sm">
              No conversations yet. Send a starter message from Leads to begin chatting.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedLead ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                  <p className="text-sm text-gray-500">{selectedLead.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  {windowStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      windowStatus.withinWindow
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {windowStatus.withinWindow ? '24h window active' : 'Template required'}
                    </span>
                  )}
                  <StatusBadge status={selectedLead.status} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.direction === 'outgoing'
                        ? 'bg-brand-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    {msg.template_name && (
                      <span className="text-xs opacity-70 block mb-1">Template: {msg.template_name}</span>
                    )}
                    {msg.status === 'mock' && (
                      <span className="text-xs opacity-70 block mb-1">Saved in CRM (WhatsApp not configured)</span>
                    )}
                    {msg.status === 'failed' && (
                      <span className="text-xs opacity-70 block mb-1">Failed to deliver on WhatsApp</span>
                    )}
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-brand-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {warning && (
              <div className="mx-6 mb-2 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {warning}
              </div>
            )}

            {error && (
              <div className="mx-6 mb-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {showTemplates && (
              <div className="mx-6 mb-2 bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Select a template message:</p>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No templates yet.{' '}
                    <button
                      type="button"
                      onClick={() => setShowTemplateManager(true)}
                      className="text-brand-600 hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSendTemplate(tpl)}
                        disabled={sending}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium capitalize">{tpl.name.replace(/_/g, ' ')}</span>
                        <p className="text-gray-500 mt-1">{displayBody(tpl.body, tpl.variables)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSend} className="bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                title="Templates"
              >
                <FileText className="w-5 h-5" />
              </button>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  windowStatus?.withinWindow
                    ? 'Type a message...'
                    : 'Use a template to start conversation...'
                }
                disabled={!windowStatus?.withinWindow}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || !windowStatus?.withinWindow}
                className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation to start chatting</p>
              <button
                onClick={() => setShowTemplateManager(true)}
                className="mt-4 text-sm text-brand-600 hover:underline"
              >
                Manage starter message templates
              </button>
            </div>
          </div>
        )}
      </div>

      {showTemplateManager && (
        <TemplateManager
          templates={templates}
          onClose={() => setShowTemplateManager(false)}
          onUpdated={loadTemplates}
        />
      )}
    </div>
  );
}
