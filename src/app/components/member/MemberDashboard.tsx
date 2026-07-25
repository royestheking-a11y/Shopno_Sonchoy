import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Clock, PlusCircle } from 'lucide-react';
import { cn } from '../Layout';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function MemberDashboard({ user }: { user: any }) {
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [userData, setUserData] = useState(user);
  const [profitShare, setProfitShare] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [authRes, depositsRes, loansRes, txnsRes, usersRes] = await Promise.all([
        api.get(`/users/${user._id || user.id}`),
        api.get('/deposits'),
        api.get('/loans'),
        api.get('/transactions'),
        api.get('/users')
      ]);

      setUserData(authRes.data);
      const txns = [
        ...depositsRes.data.map((t: any) => ({ ...t, type: 'deposit', date: t.date })),
        ...loansRes.data.map((t: any) => ({ ...t, type: 'loan request', date: t.requestDate })),
        ...txnsRes.data.filter((t: any) => t.type === 'withdraw').map((t: any) => ({ ...t, type: 'withdraw', date: t.date }))
      ].sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.date || b.createdAt || Date.now()).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      });
      setRecentTxns(txns.slice(0, 5));

      const total = txns
        .filter((t: any) => t.type === 'deposit' && t.status === 'approved')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);
      setTotalDeposits(total);

      // Profit Calculation
      const loans = loansRes.data;
      const totalProfit = loans.filter((l: any) => ['approved', 'active', 'repaid'].includes(l.status)).reduce((sum: number, l: any) => sum + (l.amount * ((l.interestRate || 5) / 100)), 0);
      const activeMembers = usersRes.data.filter((u: any) => u.role === 'member').length;
      if (activeMembers > 0) {
        setProfitShare(Math.floor(totalProfit / activeMembers));
      } else {
        setProfitShare(0);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const mockChartData = [
    { name: 'Jan', amount: 12000 },
    { name: 'Feb', amount: 15000 },
    { name: 'Mar', amount: 18000 },
    { name: 'Apr', amount: 25000 },
    { name: 'May', amount: 32000 },
    { name: 'Jun', amount: 45000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.welcome', { name: userData.name?.split(' ')[0] })}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/deposit" className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-primary/20">
            <PlusCircle size={18} />
            {t('dashboard.quick_deposit')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 h-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-40 mb-6 mt-4" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <Wallet size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-slate-300 mb-2">
                  <Wallet size={18} />
                  <span className="font-medium text-sm">{t('dashboard.wallet_balance')}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">৳ {((userData.balance || 0) + profitShare).toLocaleString()}</h2>
                {profitShare > 0 && (
                  <p className="text-xs text-emerald-400 font-medium mb-6 backdrop-blur-sm bg-black/10 w-fit px-2 py-1 rounded-md">
                    + ৳ {profitShare.toLocaleString()} from profits
                  </p>
                )}
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-colors border border-white/5">
                    {t('dashboard.statement')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl shadow-xl border border-primary-light/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <PiggyBank size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-emerald-100 mb-2">
                  <PiggyBank size={18} />
                  <span className="font-medium text-sm">{t('dashboard.total_deposit')}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">৳ {totalDeposits.toLocaleString()}</h2>
                <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                  <ArrowUpRight size={14} />
                  {t('dashboard.all_time_approved')}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-3xl shadow-xl border border-amber-400/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <Clock size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-amber-100 mb-2">
                  <Clock size={18} />
                  <span className="font-medium text-sm">{t('dashboard.total_loan')}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">৳ {(userData.loanBalance || 0).toLocaleString()}</h2>
                <div className="flex items-center gap-2 text-amber-100 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                  {t('dashboard.repayment_pending')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('dashboard.wallet_growth')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs key="uniqueMemberDefs">
                  <linearGradient id="colorAmountUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountUnique)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden flex flex-col min-h-[380px]">
          <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.recent_transactions')}</h3>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700 flex-1 overflow-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))
            ) : recentTxns.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                <Clock size={32} className="mb-3 opacity-20" />
                <p>{t('dashboard.no_recent_activity')}</p>
              </div>
            ) : (
              recentTxns.map((txn) => (
                <div key={txn._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-medium shadow-sm",
                      txn.type === 'deposit' ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    )}>
                      {txn.type === 'deposit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{txn.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(txn.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {txn.reference || txn._id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      txn.type === 'deposit' ? "text-success" : "text-slate-900 dark:text-white"
                    )}>
                      {txn.type === 'deposit' ? '+' : '-'}৳ {txn.amount.toLocaleString()}
                    </p>
                    <p className={cn(
                      "text-xs font-semibold capitalize",
                      txn.status === 'approved' ? "text-success" : 
                      txn.status === 'pending' ? "text-warning" : "text-danger"
                    )}>
                      {txn.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
