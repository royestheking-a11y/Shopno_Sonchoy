import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { generateDepositsReport } from '../../../utils/pdfGenerator';
import { Skeleton } from '../ui/skeleton';

export function DepositApprovals() {
  const { t } = useTranslation();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/deposits');
      setTxns(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/deposits/${id}/status`, { status: 'approved' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to approve transaction', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.put(`/deposits/${id}/status`, { status: 'rejected' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to reject transaction', err);
    }
  };

  const getUserName = (userId: any) => {
    return userId?.name || t('admin_deposits.unknown_user');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_deposits.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_deposits.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => generateDepositsReport(txns.filter(t => {
                  if (filterStatus === 'pending') return t.status === 'pending';
                  if (filterStatus === 'resolved') return t.status !== 'pending';
                  return true;
                }).filter(t => {
                  if (!search) return true;
                  const lower = search.toLowerCase();
                  return t._id.toLowerCase().includes(lower) || getUserName(t.userId).toLowerCase().includes(lower);
                }), t)} 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin_deposits.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 focus:border-primary outline-none rounded-xl text-sm"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium"
            >
              <Filter size={16} /> {filterStatus === 'all' ? t('admin_deposits.all_status') : filterStatus === 'pending' ? t('admin_deposits.pending_only') : t('admin_deposits.resolved_only')}
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-slate-700 py-1 overflow-hidden">
                  <button onClick={() => { setFilterStatus('all'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_deposits.all_status')}</button>
                  <button onClick={() => { setFilterStatus('pending'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_deposits.pending_only')}</button>
                  <button onClick={() => { setFilterStatus('resolved'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_deposits.resolved_only')}</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">{t('admin_deposits.col_trx_id')}</th>
                <th className="px-6 py-4">{t('admin_deposits.col_member')}</th>
                <th className="px-6 py-4">{t('admin_deposits.col_amount')}</th>
                <th className="px-6 py-4">{t('admin_deposits.col_method')}</th>
                <th className="px-6 py-4">{t('admin_deposits.col_date')}</th>
                <th className="px-6 py-4">{t('admin_deposits.col_status')}</th>
                <th className="px-6 py-4 text-right">{t('admin_deposits.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : txns
                .filter(t => {
                  if (filterStatus === 'pending') return t.status === 'pending';
                  if (filterStatus === 'resolved') return t.status !== 'pending';
                  return true;
                })
                .filter(t => {
                  if (!search) return true;
                  const lower = search.toLowerCase();
                  return t._id.toLowerCase().includes(lower) || getUserName(t.userId).toLowerCase().includes(lower);
                })
                .map(txn => (
                <tr key={txn._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <span className="block w-24 truncate" title={txn.reference || txn._id}>{txn.reference || txn._id}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <div className="font-medium text-slate-900 dark:text-white">{getUserName(txn.userId)}</div>
                    <div className="text-xs text-slate-500">{txn.userId?.memberId}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-success">৳ {txn.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize">{txn.method}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(txn.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      txn.status === 'approved' ? 'bg-success/10 text-success' :
                      txn.status === 'rejected' ? 'bg-danger/10 text-danger' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {txn.status === 'pending' ? t('admin_deposits.status_pending') : txn.status === 'approved' ? t('admin_deposits.status_approved') : t('admin_deposits.status_rejected')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {txn.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(txn._id)} className="p-1.5 bg-success/10 hover:bg-success/20 text-success rounded-md transition-colors" title={t('admin_deposits.approve')}>
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleReject(txn._id)} className="p-1.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-md transition-colors" title={t('admin_deposits.reject')}>
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && txns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">{t('admin_deposits.no_deposits')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
