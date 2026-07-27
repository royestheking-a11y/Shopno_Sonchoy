import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowDownRight, ShieldCheck, PieChart, ArrowUpRight, Receipt, Search, Calendar, User as UserIcon, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';
import { useSocket } from '../../../context/SocketContext';
import { toast } from 'sonner';

export function MasterWallet() {
  const { t } = useTranslation();
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [currentPlatformBalance, setCurrentPlatformBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { updateTicker } = useSocket();

  // Admin withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [updateTicker]);

  const fetchWalletData = async () => {
    try {
      const [depositsRes, loansRes, walletRes, withdrawalsRes] = await Promise.all([
        api.get('/deposits'),
        api.get('/loans'),
        api.get('/masterwallets'),
        api.get('/masterwallets/withdrawals')
      ]);

      const deposits = depositsRes.data;
      const loans = loansRes.data;
      const wallet = walletRes.data;
      const withdrawalData = withdrawalsRes.data;

      const approvedDeposits = deposits.filter((t: any) => t.status === 'approved').reduce((sum: number, t: any) => sum + t.amount, 0);
      const activeLoans = loans.filter((l: any) => ['approved', 'active'].includes(l.status)).reduce((sum: number, l: any) => sum + l.amount, 0);
      
      setTotalDeposits(approvedDeposits);
      setTotalLoans(activeLoans);
      setCurrentPlatformBalance(wallet?.balance || 0);
      setWithdrawals(withdrawalData.withdrawals || []);
      setTotalWithdrawn(withdrawalData.totalWithdrawn || 0);
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawReason) {
      toast.error('Please enter both amount and reason for the withdrawal.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await api.post('/masterwallets/withdraw', { amount: Number(withdrawAmount), reason: withdrawReason });
      toast.success('Master Wallet withdrawal / expense recorded successfully!');
      setWithdrawAmount('');
      setWithdrawReason('');
      fetchWalletData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Withdrawal failed. Please check wallet balance.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const reason = (w.reference || '').toLowerCase();
    const adminName = (w.userId?.name || '').toLowerCase();
    const memberId = (w.userId?.memberId || '').toLowerCase();
    return reason.includes(term) || adminName.includes(term) || memberId.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_master_wallet.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_master_wallet.subtitle')}</p>
      </div>

      {/* Main Balance & Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 h-[200px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32 bg-slate-700" />
                  <Skeleton className="h-12 w-64 bg-slate-700" />
                </div>
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 h-[160px]">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Liquid Balance Header Banner */}
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700/80 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={160} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5 text-slate-300 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <Wallet size={18} />
                    </div>
                    <span className="font-semibold text-sm tracking-wide uppercase">{t('admin_master_wallet.liquid_balance')}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">৳ {currentPlatformBalance.toLocaleString()}</h2>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={16} />
                    <span>{t('admin_master_wallet.safe_secured')}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 min-w-[170px]">
                    <p className="text-slate-400 text-xs font-medium mb-1">{t('admin_master_wallet.total_assets')}</p>
                    <p className="text-xl font-bold text-white">৳ {(currentPlatformBalance + totalLoans).toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-500/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-rose-500/20 min-w-[170px]">
                    <p className="text-rose-300 text-xs font-medium mb-1">Lifetime Withdrawals</p>
                    <p className="text-xl font-bold text-rose-400">৳ {totalWithdrawn.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Card 1: Total Member Deposits */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <ArrowDownRight size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.total_deposits')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalDeposits.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-2">{t('admin_master_wallet.total_deposits_desc')}</p>
            </div>

            {/* Stat Card 2: Active Loans Disbursed */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.active_loans')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalLoans.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-2">{t('admin_master_wallet.active_loans_desc')}</p>
            </div>

            {/* Stat Card 3: Total Withdrawn (Set after Active Loans Disbursed) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-rose-500/30 transition-all">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <ArrowUpRight size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Withdrawn</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalWithdrawn.toLocaleString()}</h3>
              <p className="text-xs text-rose-500 font-medium mt-2">Expenses & Admin Payouts</p>
            </div>

            {/* Stat Card 4: Fund Utilization Rate */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                <PieChart size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.fund_utilization')}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalDeposits ? ((totalLoans / totalDeposits) * 100).toFixed(1) : 0}%
              </h3>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${totalDeposits ? Math.min(100, (totalLoans / totalDeposits) * 100) : 0}%` }}></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin Withdrawal Form Section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E7EB] dark:border-slate-700/80">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Master Wallet Withdrawal / Expense</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log operational costs, admin withdrawals, or system expenses from liquid balance.</p>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 dark:text-white transition-all"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Reason / Details <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={withdrawReason}
                onChange={e => setWithdrawReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 dark:text-white transition-all"
                placeholder="e.g. Office Supplies / Server Maintenance"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="submit"
              disabled={isWithdrawing}
              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowUpRight size={18} />
              {isWithdrawing ? 'Processing...' : 'Withdraw & Save Log'}
            </button>
          </div>
        </form>
      </div>

      {/* Withdrawal & Expense History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal & Expense History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete audit log of all master wallet withdrawals and expenses.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by reason or admin..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Receipt size={44} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No Withdrawal History Found</p>
              <p className="text-xs text-slate-400 mt-1">Recorded expenses and withdrawals will appear here automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-[#E5E7EB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Reason / Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Withdrawn By</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                {filteredWithdrawals.map((w: any) => (
                  <tr key={w._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                        #{w._id.toString().slice(-5).toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {w.reference || 'Master Wallet Expense'}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Category: Operational Expense</span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-base">
                        - ৳ {w.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                          <UserIcon size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-xs">{w.userId?.name || 'Admin'}</p>
                          <p className="text-[10px] text-slate-400">{w.userId?.memberId || 'System'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(w.date || w.createdAt || Date.now()).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                        Approved Expense
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
