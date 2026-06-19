import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Pencil, Trash2, X, Upload, Send } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import LeadForm from '../components/LeadForm';

const STATUSES = ['', 'new', 'contacted', 'qualified', 'negotiating', 'closed', 'lost'];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [filters, setFilters] = useState({ status: '', location: '', search: '' });
  const fileInputRef = useRef(null);

  const loadTemplates = async () => {
    try {
      const data = await api.messages.getTemplates();
      setTemplates(data);
      if (data.length && !selectedTemplate) {
        setSelectedTemplate(data[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeads = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      );
      const data = await api.leads.list(params);
      setLeads(data);
      setSelectedIds((prev) => {
        const validIds = new Set(data.map((l) => l.id));
        return new Set([...prev].filter((id) => validIds.has(id)));
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filters]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (data) => {
    await api.leads.create(data);
    setShowForm(false);
    loadLeads();
  };

  const handleUpdate = async (data) => {
    await api.leads.update(editingLead.id, data);
    setEditingLead(null);
    loadLeads();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.leads.delete(id);
    loadLeads();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('');
    try {
      const result = await api.leads.uploadExcel(file);
      setUploadMessage(
        `Imported ${result.imported} lead(s)` +
        (result.skipped ? `, ${result.skipped} skipped (duplicate phone)` : '')
      );
      loadLeads();
    } catch (err) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    const leadIds = [...selectedIds];
    if (leadIds.length === 0) return;

    if (!confirm(`Delete ${leadIds.length} selected lead(s)? This cannot be undone.`)) return;

    setDeletingBulk(true);
    setBulkMessage('');
    try {
      const result = await api.leads.deleteBulk(leadIds);
      setBulkMessage(`Deleted ${result.deleted} lead(s) successfully`);
      setSelectedIds(new Set());
      loadLeads();
    } catch (err) {
      setBulkMessage(`Delete failed: ${err.message}`);
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleSendStarterMessage = async () => {
    const leadIds = [...selectedIds];
    if (leadIds.length === 0) return;

    if (!selectedTemplate) {
      setBulkMessage('Send failed: Create a template in WhatsApp Chat first');
      return;
    }

    if (!confirm(`Send starter message to ${leadIds.length} selected lead(s)?`)) return;

    setSendingBulk(true);
    setBulkMessage('');
    try {
      const result = await api.messages.sendBulk({
        leadIds,
        templateName: selectedTemplate,
      });
      const savedCount = result.sent + (result.saved || 0);
      setBulkMessage(
        `Message saved for ${savedCount} lead(s)` +
        (!result.whatsappConfigured ? '. Configure Meta WhatsApp in backend/.env to deliver to phones.' : '') +
        (result.failed ? `, ${result.failed} could not be saved` : '')
      );
      setSelectedIds(new Set());
      loadLeads();
    } catch (err) {
      setBulkMessage(`Send failed: ${err.message}`);
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Leads</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Excel'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          uploadMessage.startsWith('Upload failed')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {uploadMessage}
        </div>
      )}

      {bulkMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          bulkMessage.startsWith('Send failed') || bulkMessage.startsWith('Delete failed')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {bulkMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search name or phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Excel format: columns <strong>Name</strong> (optional), <strong>Phone</strong> (required), <strong>Location</strong> (optional). All imported leads are set to status New.
        </p>
      </div>

      {(showForm || editingLead) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => { setShowForm(false); setEditingLead(null); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <LeadForm
              lead={editingLead}
              onSubmit={editingLead ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingLead(null); }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            disabled={leads.length === 0 || loading}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:text-gray-400"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || deletingBulk}
            className="flex items-center gap-2 px-5 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deletingBulk ? 'Deleting...' : 'Delete Selected'}
          </button>
          {templates.length > 0 ? (
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.name}>
                  {tpl.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-500">Create a template in Chat first</span>
          )}
          <button
            onClick={handleSendStarterMessage}
            disabled={selectedIds.size === 0 || sendingBulk || !selectedTemplate}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sendingBulk ? 'Sending...' : 'Send Starter Message'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
        ) : (
          <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      disabled={leads.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(lead.id) ? 'bg-brand-50/50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.location || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/chat/${lead.id}`}
                          className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
                          title="Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No leads found. Add your first lead or upload an Excel file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
