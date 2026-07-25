import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';

export function LoanRequest({ user }: { user: any }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    // Fetch latest user balance
    api.get(`/users/${user._id || user.id}`).then(res => setUserData(res.data)).catch(console.error);
  }, [user._id || user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestAmount = parseInt(amount);
    
    if (!requestAmount || requestAmount <= 0) {
      setError(t('member_loan_request.error_amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/loans', {
        userId: user._id || user.id,
        amount: requestAmount,
        purpose: method === 'Cash at Branch' ? 'Cash Withdrawal' : `Payout via ${method} - ${accountDetails}`
      });
      setStep(2);
    } catch (err) {
      console.error('Failed to submit loan request', err);
      setError(t('member_loan_request.error_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('member_loan_request.success_title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {t('member_loan_request.success_desc', { amount: parseInt(amount).toLocaleString() })}
        </p>
        <button 
          onClick={() => { setStep(1); setAmount(''); setAccountDetails(''); }}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-medium transition-colors"
        >
          {t('member_loan_request.back_btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('member_loan_request.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('member_loan_request.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex justify-between items-center border border-[#E5E7EB] dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('member_loan_request.present_balance')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">৳ {(userData.balance || 0).toLocaleString()}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 flex items-center gap-2 font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_loan_request.amount_label')}</label>
            <input
              type="number"
              required
              min="500"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
              placeholder={t('member_loan_request.amount_placeholder')}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('member_loan_request.destination_label')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Bank Transfer', label: t('member_loan_request.method_bank') },
                { id: 'bKash', label: t('member_loan_request.method_bkash') },
                { id: 'Nagad', label: t('member_loan_request.method_nagad') },
                { id: 'Cash at Branch', label: t('member_loan_request.method_cash') }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`py-3 px-2 text-sm font-medium rounded-xl border transition-all ${
                    method === m.id 
                      ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20' 
                      : 'bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {method !== 'Cash at Branch' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_loan_request.account_details_label')}</label>
              <input
                type="text"
                required
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                placeholder={method === 'Bank Transfer' ? t('member_loan_request.account_details_placeholder_bank') : t('member_loan_request.account_details_placeholder_mobile')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold transition-all shadow-md mt-4 disabled:opacity-50"
          >
            {isSubmitting ? t('member_loan_request.submitting') : t('member_loan_request.submit_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}
