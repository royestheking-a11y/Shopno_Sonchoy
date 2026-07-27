import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function RepayLoan({ user }: { user: any }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(user);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingRepayment, setHasPendingRepayment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, loansRes, repaymentsRes] = await Promise.all([
          api.get(`/users/${user._id || user.id}`),
          api.get('/loans'),
          api.get('/loans/repayments').catch(() => ({ data: [] }))
        ]);
        setUserData(userRes.data);
        
        const activeLoan = loansRes.data.find((l: any) => l.status === 'active' || l.status === 'approved');
        if (activeLoan) {
          setActiveLoanId(activeLoan._id);
        }

        const pending = (repaymentsRes.data || []).some((r: any) => r.status === 'pending');
        setHasPendingRepayment(pending);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user._id || user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const repayAmount = parseInt(amount);
    
    if (!repayAmount || repayAmount <= 0) {
      setError(t('member_repay_loan.error_amount'));
      return;
    }
    
    if (repayAmount > (userData.loanBalance || 0)) {
      setError(t('member_repay_loan.error_exceeds', { balance: (userData.loanBalance || 0).toLocaleString() }));
      return;
    }

    if (!activeLoanId) {
      setError(t('member_repay_loan.error_no_loan'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/loans/${activeLoanId}/repay`, {
        amount: repayAmount,
        method: method === 'Cash at Branch' ? 'Cash at Branch' : `${method} - ${trxId}`
      });
      setStep(2);
    } catch (err: any) {
      console.error('Failed to submit repayment', err);
      setError(err.response?.data?.error || err.response?.data?.message || t('member_repay_loan.error_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPendingRepayment) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 text-center">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pending Repayment Request</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You already have a pending loan repayment request. Please wait for the admin to approve it before submitting another one.
        </p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 text-center">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('member_repay_loan.success_title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {t('member_repay_loan.success_desc', { amount: parseInt(amount).toLocaleString(), method: method })}
        </p>
        <button 
          onClick={() => { setStep(1); setAmount(''); setTrxId(''); }}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-medium transition-colors"
        >
          {t('member_repay_loan.another_btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('member_repay_loan.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('member_repay_loan.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex justify-between items-center border border-amber-200 dark:border-amber-700/50">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('member_repay_loan.outstanding_balance')}</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">৳ {(userData.loanBalance || 0).toLocaleString()}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 flex items-center gap-2 font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && (userData.loanBalance || 0) <= 0 ? (
          <div className="text-center py-8 px-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-1">
              No Outstanding Loan
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              You do not have any active or pending loan balance. All your loans have been fully repaid!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_repay_loan.amount_label')}</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                placeholder={t('member_repay_loan.amount_placeholder')}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('member_repay_loan.method_label')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'bKash', label: t('member_repay_loan.method_bkash') },
                  { id: 'Nagad', label: t('member_repay_loan.method_nagad') },
                  { id: 'Rocket', label: t('member_repay_loan.method_rocket') },
                  { id: 'Bank Transfer', label: t('member_repay_loan.method_bank') },
                  { id: 'Cash at Branch', label: t('member_repay_loan.method_cash') }
                ].map(m => {
                  const isSelected = method === m.id;
                  let activeColor = 'bg-primary/10 border-primary text-primary dark:bg-primary/20';
                  if (m.id === 'bKash') activeColor = 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400';
                  if (m.id === 'Nagad') activeColor = 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400';
                  if (m.id === 'Rocket') activeColor = 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400';

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all ${
                        isSelected 
                          ? activeColor 
                          : 'bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {method !== 'Cash at Branch' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_repay_loan.trx_id_label')}</label>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                  placeholder={t('member_repay_loan.trx_id_placeholder')}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={(userData.loanBalance || 0) <= 0 || isSubmitting || !activeLoanId}
              className="w-full bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold transition-all shadow-md mt-4 disabled:opacity-50"
            >
              {isSubmitting ? t('member_repay_loan.submitting') : t('member_repay_loan.submit_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
