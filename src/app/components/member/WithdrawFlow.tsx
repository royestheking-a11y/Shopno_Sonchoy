import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { Skeleton } from '../ui/skeleton';

export function WithdrawFlow({ user }: { user: any }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest user balance
    api.get(`/users/${user._id || user.id}`)
      .then(res => setUserData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user._id || user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseInt(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > (userData.balance || 0)) {
      setError('Insufficient wallet balance');
      return;
    }

    try {
      await api.post('/transactions', {
        amount: withdrawAmount,
        method,
        type: 'withdraw',
        reference: method === 'Cash at Branch' ? 'Cash at Branch' : accountDetails
      });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit withdrawal request');
    }
  };

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Your withdrawal request of <strong>৳ {parseInt(amount).toLocaleString()}</strong> to {method} is now pending admin review. Funds will be deducted once approved.
        </p>
        <button 
          onClick={() => { setStep(1); setAmount(''); }}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-medium transition-colors"
        >
          Return to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Withdraw Funds</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Transfer funds from your wallet to your personal accounts.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex justify-between items-center border border-[#E5E7EB] dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Wallet Balance</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 dark:text-white">৳ {(userData.balance || 0).toLocaleString()}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <ArrowRight size={24} />
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Withdrawal Amount (৳)</label>
            <input
              type="number"
              required
              min="500"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
              placeholder="Min. 500"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Destination Account</label>
            <div className="grid grid-cols-2 gap-3">
              {['Bank Transfer', 'bKash', 'Nagad', 'Cash at Branch'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-3 px-2 text-sm font-medium rounded-xl border transition-all ${
                    method === m 
                      ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20' 
                      : 'bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {method !== 'Cash at Branch' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Details</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                placeholder={method === 'Bank Transfer' ? "Account Name, A/C No, Bank, Branch" : "Enter Mobile Number"}
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold transition-all shadow-md mt-4"
          >
            Confirm Withdrawal
          </button>
        </form>
      </div>
    </div>
  );
}
