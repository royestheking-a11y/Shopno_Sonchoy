import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function LoanApprovals() {
  const { t } = useTranslation();
  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'repayments'>('requests');
  const [loading, setLoading] = useState(true);
  const [approvalModal, setApprovalModal] = useState<{ id: string, currentRate: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLoans(), fetchRepayments()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans');
      setLoans(res.data);
    } catch (err) {
      console.error('Failed to fetch loans', err);
    }
  };

  const fetchRepayments = async () => {
    try {
      const res = await api.get('/loans/repayments');
      setRepayments(res.data);
    } catch (err) {
      console.error('Failed to fetch repayments', err);
    }
  };

  const handleApproveLoan = async (id: string, interestRate: number) => {
    try {
      await api.put(`/loans/${id}/status`, { status: 'approved', interestRate });
      setApprovalModal(null);
      fetchLoans();
    } catch (err) {
      console.error('Failed to approve loan', err);
    }
  };

  const handleRejectLoan = async (id: string) => {
    try {
      await api.put(`/loans/${id}/status`, { status: 'rejected' });
      fetchLoans();
    } catch (err) {
      console.error('Failed to reject loan', err);
    }
  };

  const handleApproveRepayment = async (id: string) => {
    try {
      await api.put(`/loans/repayments/${id}/status`, { status: 'approved' });
      fetchRepayments();
    } catch (err) {
      console.error('Failed to approve repayment', err);
    }
  };

  const handleRejectRepayment = async (id: string) => {
    try {
      await api.put(`/loans/repayments/${id}/status`, { status: 'rejected' });
      fetchRepayments();
    } catch (err) {
      console.error('Failed to reject repayment', err);
    }
  };

  const getUserName = (userId: any) => {
    return userId?.name || t('admin_loans.unknown_user');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_loans.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_loans.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[#E5E7EB] dark:border-slate-700">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {t('admin_loans.tab_requests')}
        </button>
        <button
          onClick={() => setActiveTab('repayments')}
          className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'repayments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {t('admin_loans.tab_repayments')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full">
            <input 
              type="text" 
              placeholder={t('admin_loans.search_placeholder')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 focus:border-primary outline-none rounded-xl text-sm"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'requests' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">{t('admin_loans.col_request_id')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_member')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_req_amount')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_date')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_status_interest')}</th>
                  <th className="px-6 py-4 text-right">{t('admin_loans.col_actions')}</th>
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
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : loans
                  .filter(l => {
                    if (!search) return true;
                    const lower = search.toLowerCase();
                    return l._id.toLowerCase().includes(lower) || getUserName(l.userId).toLowerCase().includes(lower);
                  })
                  .map(loan => (
                  <tr key={loan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <span className="block w-24 truncate" title={loan._id}>{loan._id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-white">{getUserName(loan.userId)}</div>
                      <div className="text-xs text-slate-500">{loan.userId?.memberId}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      ৳ {loan.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(loan.requestDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {loan.status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning">{t('admin_loans.status_pending_review')}</span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ['approved', 'active', 'repaid'].includes(loan.status) ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {loan.status === 'active' ? t('admin_loans.status_active') : loan.status === 'repaid' ? t('admin_loans.status_repaid') : loan.status === 'approved' ? t('admin_loans.status_approved') : t('admin_loans.status_rejected')} {['approved', 'active'].includes(loan.status) && `(${loan.interestRate}%)`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setApprovalModal({ id: loan._id, currentRate: loan.interestRate || 5 })} className="p-1.5 bg-success/10 hover:bg-success/20 text-success rounded-md transition-colors" title={t('admin_loans.approve')}>
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleRejectLoan(loan._id)} className="p-1.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-md transition-colors" title={t('admin_loans.reject')}>
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && loans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t('admin_loans.no_loans')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">{t('admin_loans.col_repayment_id')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_member')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_amount')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_method')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_date')}</th>
                  <th className="px-6 py-4">{t('admin_loans.col_status')}</th>
                  <th className="px-6 py-4 text-right">{t('admin_loans.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : repayments
                  .filter(r => {
                    if (!search) return true;
                    const lower = search.toLowerCase();
                    return r._id.toLowerCase().includes(lower) || getUserName(r.userId).toLowerCase().includes(lower);
                  })
                  .map(repayment => (
                  <tr key={repayment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <span className="block w-24 truncate" title={repayment._id}>{repayment._id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-white">{getUserName(repayment.userId)}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-success">
                      ৳ {repayment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repayment.method}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(repayment.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {repayment.status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning">{t('admin_loans.status_pending_review')}</span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          repayment.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {repayment.status === 'approved' ? t('admin_loans.status_approved') : t('admin_loans.status_rejected')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {repayment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApproveRepayment(repayment._id)} className="p-1.5 bg-success/10 hover:bg-success/20 text-success rounded-md transition-colors" title={t('admin_loans.approve')}>
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleRejectRepayment(repayment._id)} className="p-1.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-md transition-colors" title={t('admin_loans.reject')}>
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && repayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">{t('admin_loans.no_repayments')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Approve Loan</h3>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Interest Rate (%)</label>
            <input 
              type="number"
              step="0.1"
              value={approvalModal.currentRate}
              onChange={(e) => setApprovalModal({ ...approvalModal, currentRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl mb-6 outline-none focus:border-primary text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleApproveLoan(approvalModal.id, approvalModal.currentRate)}
                className="px-5 py-2.5 text-sm font-medium bg-primary text-white hover:bg-primary-dark rounded-xl transition-colors"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
