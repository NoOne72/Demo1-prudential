// src/components/Layout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../utils/auth';
import { 
  LayoutDashboard, Users, FolderArchive, 
  Settings, HelpCircle, LogOut, UserCircle2, ListTodo, TrendingUp 
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => { logoutUser(); navigate('/login'); };
  const handleHomeClick = () => {
    if (!user) return navigate('/login');
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'leader') navigate('/leader');
    else navigate('/agent');
  };

  const isDashboardActive = ['/admin', '/leader', '/agent', '/'].includes(location.pathname);
  const isDocActive = location.pathname.startsWith('/documentation');
  const isCommunitiesActive = location.pathname.startsWith('/communities');
  const isTasksActive = location.pathname.startsWith('/tasks');
  const isSalesActive = location.pathname.startsWith('/sales'); // Tambahan Rute Sales

  const showAgentLeaderMenu = user?.role !== 'admin';

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-sm relative">
        <div className="p-6">
          <h1 className="text-lg font-bold text-green-900">Prudential Syariah</h1>
        </div>
        
        <div className="px-6 pb-6 flex items-center gap-3">
          <UserCircle2 className="w-10 h-10 text-gray-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-xs text-gray-500 uppercase font-semibold">{user?.role}</p>
            <p className="text-sm font-bold text-gray-800 truncate" title={user?.name}>{user?.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <div onClick={handleHomeClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isDashboardActive ? 'bg-green-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-sm">Dashboard</span>
          </div>

          <div onClick={() => navigate('/communities')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isCommunitiesActive ? 'bg-green-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Communities</span>
          </div>

          {showAgentLeaderMenu && (
            <>
              <div onClick={() => navigate('/tasks')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isTasksActive ? 'bg-green-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <ListTodo className="w-5 h-5" />
                <span className="font-medium text-sm">Tasks & To-Do</span>
              </div>
              
              {/* MENU BARU: SALES TRACKING */}
              <div onClick={() => navigate('/sales')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isSalesActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium text-sm">Sales Tracking</span>
              </div>
            </>
          )}

          <div onClick={() => navigate('/documentation')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isDocActive ? 'bg-green-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <FolderArchive className="w-5 h-5" />
            <span className="font-medium text-sm">Documentation</span>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout Account</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-8 relative bg-slate-50/50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;