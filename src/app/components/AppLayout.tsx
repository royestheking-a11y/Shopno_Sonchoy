import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, 
  LogOut, Download, FileText, BarChart3, 
  Bell, Settings, Menu, X, PlusCircle, History, Landmark, Megaphone, BookOpen
} from 'lucide-react';
import { cn } from './Layout';
import { useTranslation } from 'react-i18next';

import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { subscribeUserToPush } from '../../utils/push';

const ADMIN_SIDEBAR = [
  { icon: LayoutDashboard, label: 'sidebar.dashboard', path: '/' },
  { icon: Users, label: 'sidebar.members', path: '/members' },
  { icon: Download, label: 'sidebar.deposit_approvals', path: '/deposits' },
  { icon: Landmark, label: 'sidebar.loan_approvals', path: '/loans' },
  { icon: Wallet, label: 'sidebar.master_wallet', path: '/wallet' },
  { icon: FileText, label: 'sidebar.ledger', path: '/ledger' },
  { icon: BarChart3, label: 'sidebar.reports', path: '/reports' },
  { icon: Megaphone, label: 'sidebar.broadcasts', path: '/broadcasts' },
  { icon: Bell, label: 'sidebar.monthly_closing', path: '/monthly-closing' },
  { icon: Settings, label: 'sidebar.settings', path: '/settings' },
];

const MEMBER_SIDEBAR = [
  { icon: LayoutDashboard, label: 'sidebar.dashboard', path: '/' },
  { icon: Wallet, label: 'sidebar.wallet', path: '/wallet' },
  { icon: PlusCircle, label: 'sidebar.deposit', path: '/deposit' },
  { icon: History, label: 'sidebar.deposit_history', path: '/deposit-history' },
  { icon: Landmark, label: 'sidebar.loan', path: '/request-loan' },
  { icon: History, label: 'sidebar.loan_history', path: '/loan-history' },
  { icon: FileText, label: 'sidebar.repay', path: '/repay-loan' },
  { icon: BookOpen, label: 'sidebar.rules', path: '/rules' },
  { icon: Settings, label: 'sidebar.settings', path: '/settings' },
];

export function AppLayout({ user }: { user: any }) {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { socket } = useSocket();

  useEffect(() => {
    fetchBroadcasts();

    if (!socket) return;
    
    const handleNewBroadcast = (broadcast: any) => {
      setBroadcasts(prev => {
        if (!prev.find(b => b._id === broadcast._id)) {
          return [broadcast, ...prev];
        }
        return prev;
      });
    };

    socket.on('new_broadcast', handleNewBroadcast);

    return () => {
      socket.off('new_broadcast', handleNewBroadcast);
    };
  }, [socket]);

  // Subscribe to push notifications if permitted
  useEffect(() => {
    if (user && (user.id || user._id) && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        subscribeUserToPush(user.id || user._id);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            subscribeUserToPush(user.id || user._id);
          }
        });
      }
    }
  }, [user]);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/broadcasts');
      // Show unread broadcasts to members, and all broadcasts (or unread too) to admins.
      // Usually admins don't need notifications as much, but let's filter for unread for everyone.
      const unread = res.data.filter((b: any) => !b.readBy.includes(user._id));
      setBroadcasts(unread);
    } catch (err) {
      console.error('Failed to fetch broadcasts', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/broadcasts/${id}/read`);
      setBroadcasts(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error('Failed to mark broadcast as read', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shopno_auth');
    window.location.href = '/';
  };

  const SIDEBAR_ITEMS = user?.role === 'admin' ? ADMIN_SIDEBAR : MEMBER_SIDEBAR;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex text-slate-900 dark:text-slate-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-[#E5E7EB] dark:border-slate-700 transform transition-transform duration-300 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] dark:border-slate-700">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="font-sans font-bold text-lg">S</span>
            </div>
            Shopno Sonchoy
          </div>
          <button 
            className="ml-auto md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {user?.role === 'admin' ? t('sidebar.admin_title') : t('sidebar.member_title')}
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary dark:bg-primary/20" 
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {t(item.label)}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB] dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <input 
                type="text" 
                placeholder={t('common.search')} 
                className="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full text-sm transition-all outline-none"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            
            {/* Language Toggle */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors border border-[#E5E7EB] dark:border-slate-700 shadow-sm"
            >
              {i18n.language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded-full"
            >
              <Bell size={18} />
              {broadcasts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger border-2 border-white dark:border-slate-800"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden z-50">
                <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('common.notifications')}</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {broadcasts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      {t('common.no_notifications')}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                      {broadcasts.map(b => (
                        <div 
                          key={b._id} 
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedBroadcast(b);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.type === 'danger' ? 'bg-danger/10 text-danger' :
                              b.type === 'warning' ? 'bg-warning/10 text-warning' :
                              b.type === 'success' ? 'bg-success/10 text-success' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {b.type}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(b._id);
                              }}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              {t('common.mark_read')}
                            </button>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{b.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {b.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(b.date).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Broadcast Details Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedBroadcast(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
            <div className="mb-4">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase inline-block ${
                selectedBroadcast.type === 'danger' ? 'bg-danger/10 text-danger' :
                selectedBroadcast.type === 'warning' ? 'bg-warning/10 text-warning' :
                selectedBroadcast.type === 'success' ? 'bg-success/10 text-success' :
                'bg-primary/10 text-primary'
              }`}>
                {selectedBroadcast.type}
              </span>
              <span className="ml-3 text-xs text-slate-500">
                {new Date(selectedBroadcast.date).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{selectedBroadcast.title}</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              {selectedBroadcast.message}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedBroadcast(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  handleMarkAsRead(selectedBroadcast._id);
                  setSelectedBroadcast(null);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('common.mark_read')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
