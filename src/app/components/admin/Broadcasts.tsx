import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Send, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';

export function Broadcasts() {
  const { t } = useTranslation();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [broadcastToDelete, setBroadcastToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/broadcasts');
      setBroadcasts(res.data);
    } catch (err) {
      console.error('Failed to fetch broadcasts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setError(t('admin_broadcasts.error_required'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: newBroadcast } = await api.post('/broadcasts', { title, message, type });
      
      // Also send Web Push Notification
      try {
        await api.post('/notifications/send', {
          title: newBroadcast.title,
          body: newBroadcast.message,
          userId: 'all'
        });
      } catch (pushErr) {
        console.error('Failed to send push notifications', pushErr);
        // We don't fail the broadcast creation if push fails
      }

      setTitle('');
      setMessage('');
      setType('info');
      fetchBroadcasts();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin_broadcasts.error_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setBroadcastToDelete(id);
  };

  const executeDelete = async () => {
    if (!broadcastToDelete) return;
    try {
      await api.delete(`/broadcasts/${broadcastToDelete}`);
      setBroadcastToDelete(null);
      fetchBroadcasts();
    } catch (err) {
      console.error('Failed to delete broadcast', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_broadcasts.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_broadcasts.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Megaphone size={20} className="text-primary" />
              {t('admin_broadcasts.new_broadcast')}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('admin_broadcasts.notice_type')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                >
                  <option value="info">{t('admin_broadcasts.type_info')}</option>
                  <option value="success">{t('admin_broadcasts.type_success')}</option>
                  <option value="warning">{t('admin_broadcasts.type_warning')}</option>
                  <option value="danger">{t('admin_broadcasts.type_urgent')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('admin_broadcasts.form_title')}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                  placeholder={t('admin_broadcasts.title_placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('admin_broadcasts.form_message')}</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white h-32 resize-none"
                  placeholder={t('admin_broadcasts.message_placeholder')}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? t('admin_broadcasts.sending') : t('admin_broadcasts.send_broadcast')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_broadcasts.past_broadcasts')}</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E5E7EB] dark:border-slate-700 shadow-sm relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-16 rounded-md" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                  <div className="space-y-2 mt-4 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex items-center gap-4 border-t border-[#E5E7EB] dark:border-slate-700 pt-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-[#E5E7EB] dark:border-slate-700 text-center text-slate-500">
              {t('admin_broadcasts.no_broadcasts')}
            </div>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((b) => (
                <div key={b._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E5E7EB] dark:border-slate-700 shadow-sm relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                        b.type === 'danger' ? 'bg-danger/10 text-danger' :
                        b.type === 'warning' ? 'bg-warning/10 text-warning' :
                        b.type === 'success' ? 'bg-success/10 text-success' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {b.type}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{b.title}</h3>
                    </div>
                    <button 
                      onClick={() => confirmDelete(b._id)}
                      className="text-slate-400 hover:text-danger p-1 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-3">
                    {b.message}
                  </p>
                  <div className="text-xs text-slate-400 flex items-center gap-4 border-t border-[#E5E7EB] dark:border-slate-700 pt-3">
                    <span>{t('admin_broadcasts.sent')}: {new Date(b.date).toLocaleString()}</span>
                    <span>{t('admin_broadcasts.read_by')}: {b.readBy?.length || 0} {t('admin_broadcasts.users')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Premium Delete Confirmation Modal */}
      <AnimatePresence>
        {broadcastToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setBroadcastToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Broadcast</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {t('admin_broadcasts.delete_confirm')}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setBroadcastToDelete(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 bg-danger hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
