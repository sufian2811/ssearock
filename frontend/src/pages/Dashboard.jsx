import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [leadsData, convData] = await Promise.all([
          api.leads.list(),
          api.messages.getConversations(),
        ]);
        setLeads(leadsData);
        setConversations(convData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Chats', value: conversations.length, icon: MessageSquare, color: 'bg-green-500' },
    { label: 'New Leads', value: statusCounts.new || 0, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Contacted', value: statusCounts.contacted || 0, icon: Clock, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Leads</h3>
            <Link to="/leads" className="text-brand-600 text-sm hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-gray-500">{lead.phone}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
            {leads.length === 0 && <p className="text-gray-500 text-sm">No leads yet. Add your first lead!</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Conversations</h3>
            <Link to="/chat" className="text-brand-600 text-sm hover:underline">Open chat</Link>
          </div>
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => (
              <Link
                key={conv.id}
                to={`/chat/${conv.leads?.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <div>
                  <p className="font-medium">{conv.leads?.name}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">
                    {conv.last_message?.body || 'No messages yet'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                </span>
              </Link>
            ))}
            {conversations.length === 0 && <p className="text-gray-500 text-sm">No conversations yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
