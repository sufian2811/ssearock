import { Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Building2, Users, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Chat from './pages/Chat';

function CrmLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-brand-800 text-white flex flex-col">
        <div className="p-6 border-b border-brand-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">SeaRock CRM</h1>
              <p className="text-brand-100 text-xs">Meta WhatsApp</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700/50'
              }`
            }
          >
            <Building2 className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/leads"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700/50'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Leads
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700/50'
              }`
            }
          >
            <MessageSquare className="w-5 h-5" />
            WhatsApp Chat
          </NavLink>
        </nav>
        <div className="p-4 border-t border-brand-700">
          <p className="text-brand-100 text-xs truncate mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-brand-100 hover:bg-brand-700/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <CrmLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:leadId" element={<Chat />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
