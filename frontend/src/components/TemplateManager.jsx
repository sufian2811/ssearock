import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';

function displayBody(body, variables = []) {
  let text = body;
  variables.forEach((variable, index) => {
    text = text.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), `{{${variable}}}`);
  });
  return text;
}

export default function TemplateManager({ templates, onClose, onUpdated }) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.messages.createTemplate({ name, body, languageCode });
      setName('');
      setBody('');
      setLanguageCode('en');
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.messages.deleteTemplate(id);
      onUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold">Starter Message Templates</h3>
            <p className="text-sm text-gray-500 mt-1">
              Template name must match an approved template in Meta Business Manager
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <form onSubmit={handleCreate} className="space-y-4 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-sm">Create New Template</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name (Meta)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. property_intro"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Must match your approved Meta template name exactly</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
              <input
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                placeholder="en"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hello {{name}}, we have new listings in {{location}}. Would you like details?"
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use <strong>{'{{name}}'}</strong> and <strong>{'{{location}}'}</strong> as placeholders
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Saving...' : 'Create Template'}
            </button>
          </form>

          <div>
            <h4 className="font-medium text-sm mb-3">Saved Templates ({templates.length})</h4>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">No templates yet. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Language: {tpl.content_sid || 'en'}</p>
                        <p className="text-sm text-gray-600 mt-1">{displayBody(tpl.body, tpl.variables)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
