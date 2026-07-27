import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Info, Copy } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';

export function DepositFlow({ user }: { user: any }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    // Fetch latest user balance and check for pending deposits
    Promise.all([
      api.get(`/users/${user._id || user.id}`),
      api.get('/deposits')
    ])
      .then(([authRes, depositsRes]) => {
        setUserData(authRes.data);
        const pending = depositsRes.data.some((d: any) => d.status === 'pending');
        setHasPending(pending);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user._id || user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !trxId) return;

    setIsSubmitting(true);
    try {
      await api.post('/deposits', {
        userId: user._id || user.id,
        type: 'deposit',
        amount: parseInt(amount),
        method,
        reference: trxId
      });
      setStep(2);
    } catch (err: any) {
      console.error('Failed to submit deposit', err);
      toast.error(err.response?.data?.error || t('member_deposit_flow.failed_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPending) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 text-center">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-6">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pending Request</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You already have a pending deposit request. Please wait for the admin to approve it before submitting another one.
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('member_deposit_flow.submitted')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {t('member_deposit_flow.submitted_desc1')} <strong>৳ {parseInt(amount).toLocaleString()}</strong> {t('member_deposit_flow.submitted_desc2')} {method} {t('member_deposit_flow.submitted_desc3')}
        </p>
        <button 
          onClick={() => { setStep(1); setAmount(''); setTrxId(''); }}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-medium transition-colors"
        >
          {t('member_deposit_flow.another_deposit')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('member_deposit_flow.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('member_deposit_flow.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex justify-between items-center border border-[#E5E7EB] dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('member_deposit_flow.wallet_balance')}</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 dark:text-white">৳ {(userData.balance || 0).toLocaleString()}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_deposit_flow.deposit_amount')}</label>
            <input
              type="number"
              required
              min="500"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('member_deposit_flow.payment_method')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['bKash', 'Nagad', 'Rocket', t('member_deposit_flow.bank_transfer')].map(m => {
                const isSelected = method === m;
                let activeColor = 'bg-primary/10 border-primary text-primary dark:bg-primary/20';
                if (m === 'bKash') activeColor = 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400';
                if (m === 'Nagad') activeColor = 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400';
                if (m === 'Rocket') activeColor = 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400';
                
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-3 px-2 text-sm font-bold rounded-xl border transition-all ${
                      isSelected 
                        ? activeColor 
                        : 'bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {method === t('member_deposit_flow.bank_transfer') ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 text-sm space-y-4 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Info size={18} /> {t('member_deposit_flow.official_bank')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('member_deposit_flow.account_number')}</p>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">7017322834366</span>
                    <button type="button" onClick={() => {navigator.clipboard.writeText('7017322834366'); toast.success(t('member_deposit_flow.copied_account'))}} className="text-primary hover:text-primary-dark p-1 transition-colors"><Copy size={16} /></button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('member_deposit_flow.account_name')}</p>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 font-bold shadow-sm text-slate-900 dark:text-white">
                    <span>MD MAFUJ AHMMAD</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('member_deposit_flow.routing_number')}</p>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 font-mono shadow-sm">
                    <span>090540404</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('member_deposit_flow.swift_code')}</p>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 font-mono shadow-sm">
                    <span>DBBLBDDH</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('member_deposit_flow.branch_address')}</p>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                    Kalkini Sub-Branch, London Plaza, Holding-86, Swapan Sorafot Road, Kalkini, Madaripur.
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{t('member_deposit_flow.transfer_instruction')} <strong className="text-slate-900 dark:text-white">৳ {amount || '0'}</strong> {t('member_deposit_flow.transfer_instruction2')}</p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 text-sm space-y-3 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Info size={18} /> {t('member_deposit_flow.official_mobile')}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('member_deposit_flow.accepted_networks')}</p>
              <div className="mt-2">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{t('member_deposit_flow.send_money_number')}</p>
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                  <span className="font-mono text-lg font-bold tracking-wider text-slate-900 dark:text-white">01797256216</span>
                  <button type="button" onClick={() => {navigator.clipboard.writeText('01797256216'); toast.success(t('member_deposit_flow.copied_phone'))}} className="flex items-center gap-1.5 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors font-semibold text-xs border border-primary/20">
                    <Copy size={14} /> {t('member_deposit_flow.copy')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">{t('member_deposit_flow.send_instruction')} <strong className="text-slate-900 dark:text-white">৳ {amount || '0'}</strong> {t('member_deposit_flow.send_instruction2')} {method} {t('member_deposit_flow.send_instruction3')}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('member_deposit_flow.trx_id')}</label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white uppercase placeholder-normal"
              placeholder="e.g. 8XZ7Y9Q2"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            {isSubmitting ? t('member_deposit_flow.submitting') : t('member_deposit_flow.submit_request')}
          </button>
        </form>
      </div>
    </div>
  );
}
