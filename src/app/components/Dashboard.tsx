import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Users, DollarSign } from 'lucide-react';
import { cn } from './Layout';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import { generateDashboardReport } from '../../utils/pdfGenerator';
import { Skeleton } from './ui/skeleton';
import { useSocket } from '../../context/SocketContext';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1.5">
      <div className={cn(
        "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
        trend === 'up' ? "text-success bg-success/10" : "text-danger bg-danger/10"
      )}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
    </div>
  </div>
);

export function Dashboard() {
  const { t } = useTranslation();
  const { updateTicker } = useSocket();
  const [data, setData] = useState({
    activeMembers: 0,
    currentFund: 0,
    todaysCollection: 0,
    currentInvestment: 0,
    loanProfit: 0,
    recentDeposits: [] as any[],
    pendingApprovals: [] as any[],
    cashFlowData: [] as any[],
    savingsData: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [updateTicker]);

  const fetchData = async () => {
    try {
      const [usersRes, depositsRes, loansRes, walletRes, txnsRes] = await Promise.all([
        api.get('/users'),
        api.get('/deposits'),
        api.get('/loans'),
        api.get('/masterwallets'),
        api.get('/transactions')
      ]);

      const users = usersRes.data.filter((u: any) => u.role === 'member');
      const deposits = depositsRes.data;
      const loans = loansRes.data;
      const wallet = walletRes.data;
      const txns = txnsRes.data;

      const currentFund = wallet?.balance || 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const todaysCollection = deposits
        .filter((txn: any) => {
          const d = new Date(txn.date);
          return txn.status === 'approved' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum: number, txn: any) => sum + txn.amount, 0);

      const recentDeposits = deposits
        .filter((txn: any) => txn.status === 'approved')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

      const totalLoans = loans.filter((l: any) => ['approved', 'active'].includes(l.status)).reduce((sum: number, l: any) => sum + l.amount, 0);

      const totalProfit = loans.filter((l: any) => l.status === 'repaid').reduce((sum: number, l: any) => sum + (l.amount * ((l.interestRate || 5) / 100)), 0);

      const pendingDeposits = deposits.filter((txn: any) => txn.status === 'pending').map((txn: any) => ({ ...txn, kind: t('admin_dashboard.deposit'), isTxnRoute: false }));
      const pendingWithdrawals = txns.filter((txn: any) => txn.status === 'pending' && txn.type === 'withdraw').map((txn: any) => ({ ...txn, kind: 'Withdrawal', isTxnRoute: true }));
      const pendingLoans = loans.filter((l: any) => l.status === 'pending').map((l: any) => ({ ...l, kind: t('admin_dashboard.loan_request'), isTxnRoute: false }));
      const pendingApprovals = [...pendingDeposits, ...pendingWithdrawals, ...pendingLoans]
        .sort((a: any, b: any) => new Date(b.date || b.requestDate).getTime() - new Date(a.date || a.requestDate).getTime())
        .slice(0, 3);

      const cashFlowData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        const depositsInMonth = deposits.filter((txn: any) => {
          const dt = new Date(txn.date);
          return txn.status === 'approved' && dt.getMonth() === m && dt.getFullYear() === y;
        }).reduce((sum: number, txn: any) => sum + txn.amount, 0);
        
        const withdrawalsInMonth = txns.filter((txn: any) => {
          const dt = new Date(txn.date);
          return txn.type === 'withdraw' && txn.status === 'approved' && dt.getMonth() === m && dt.getFullYear() === y;
        }).reduce((sum: number, txn: any) => sum + txn.amount, 0);

        const loansInMonth = loans.filter((l: any) => {
          const dt = new Date(l.requestDate || l.approvalDate || l.createdAt);
          return ['approved', 'active', 'repaid'].includes(l.status) && dt.getMonth() === m && dt.getFullYear() === y;
        }).reduce((sum: number, l: any) => sum + l.amount, 0);

        cashFlowData.push({
          name: monthNames[m],
          in: depositsInMonth,
          out: withdrawalsInMonth + loansInMonth
        });
      }

      const savingsData = [
        { name: 'Week 1', amount: 0 },
        { name: 'Week 2', amount: 0 },
        { name: 'Week 3', amount: 0 },
        { name: 'Week 4', amount: 0 },
      ];
      
      deposits.forEach((txn: any) => {
        const dt = new Date(txn.date);
        if (txn.status === 'approved' && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
          const day = dt.getDate();
          if (day <= 7) savingsData[0].amount += txn.amount;
          else if (day <= 14) savingsData[1].amount += txn.amount;
          else if (day <= 21) savingsData[2].amount += txn.amount;
          else savingsData[3].amount += txn.amount;
        }
      });

      setData({
        activeMembers: users.length,
        currentFund,
        todaysCollection,
        currentInvestment: totalLoans,
        loanProfit: totalProfit,
        recentDeposits,
        pendingApprovals,
        cashFlowData,
        savingsData
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    try {
      if (item.kind === t('admin_dashboard.loan_request')) {
        await api.put(`/loans/${item._id}/status`, { status: 'approved' });
      } else if (item.isTxnRoute) {
        await api.put(`/transactions/${item._id}/status`, { status: 'approved' });
      } else {
        await api.put(`/deposits/${item._id}/status`, { status: 'approved' });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to approve', err);
    }
  };

  const handleReject = async (item: any) => {
    try {
      if (item.kind === t('admin_dashboard.loan_request')) {
        await api.put(`/loans/${item._id}/status`, { status: 'rejected' });
      } else if (item.isTxnRoute) {
        await api.put(`/transactions/${item._id}/status`, { status: 'rejected' });
      } else {
        await api.put(`/deposits/${item._id}/status`, { status: 'rejected' });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to reject', err);
    }
  };

  const getUserName = (userId: any) => userId?.name || t('admin_dashboard.unknown_user');

  // Mock data for charts as we don't have historical aggregates yet
  const { cashFlowData, savingsData } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_dashboard.overview')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_dashboard.overview_desc')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => generateDashboardReport(data, t)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {t('admin_dashboard.download_report')}
          </button>
        </div>
      </div>

      {/* Top Section - Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 h-[160px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title={t('admin_dashboard.current_fund')}
              value={`৳ ${data.currentFund.toLocaleString()}`} 
              trend="up" 
              trendValue="12.5%" 
              icon={DollarSign}
              colorClass="bg-primary/10 text-primary"
            />
            <StatCard 
              title={t('admin_dashboard.todays_collection')}
              value={`৳ ${data.todaysCollection.toLocaleString()}`} 
              trend="up" 
              trendValue="8.2%" 
              icon={Activity}
              colorClass="bg-blue-500/10 text-blue-500"
            />
            <StatCard 
              title={t('admin_dashboard.active_members')}
              value={data.activeMembers.toString()} 
              trend="up" 
              trendValue="2.1%" 
              icon={Users}
              colorClass="bg-purple-500/10 text-purple-500"
            />
            <StatCard 
              title={t('admin_dashboard.current_investment')}
              value={`৳ ${data.currentInvestment.toLocaleString()}`} 
              trend="up" 
              trendValue="1.4%" 
              icon={TrendingUp}
              colorClass="bg-amber-500/10 text-amber-500"
            />
            <StatCard 
              title={t('admin_dashboard.loan_profit')}
              value={`৳ ${data.loanProfit.toLocaleString()}`} 
              trend="up" 
              trendValue="5.0%" 
              icon={DollarSign}
              colorClass="bg-green-500/10 text-green-500"
            />
          </>
        )}
      </div>

      {/* Middle Section - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('admin_dashboard.cash_flow')}</h3>
          <div className="h-[300px] w-full">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs key="defs">
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-700" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="in" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('admin_dashboard.monthly_savings')}</h3>
          <div className="h-[300px] w-full">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-700" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_dashboard.recent_deposits')}</h3>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
              ))
            ) : data.recentDeposits.length === 0 ? (
              <div className="p-6 text-center text-slate-500">{t('admin_dashboard.no_recent_deposits')}</div>
            ) : data.recentDeposits.map((txn, i) => (
              <div key={txn._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium">
                    {getUserName(txn.userId).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{getUserName(txn.userId)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin_dashboard.regular_savings')} • {new Date(txn.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">+৳ {txn.amount.toLocaleString()}</p>
                  <p className="text-xs font-medium text-success">{t('admin_dashboard.completed')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_dashboard.pending_approvals')}</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">{data.pendingApprovals.length} {t('admin_dashboard.requests')}</span>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-7 flex-1 rounded-md" />
                    <Skeleton className="h-7 flex-1 rounded-md" />
                  </div>
                </div>
              ))
            ) : data.pendingApprovals.length === 0 ? (
               <div className="p-6 text-center text-slate-500">{t('admin_dashboard.no_pending_requests')}</div>
            ) : data.pendingApprovals.map((item, i) => (
              <div key={item._id} className="px-6 py-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{item.kind}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin_dashboard.req_by')} {getUserName(item.userId)}</p>
                    {item.reference && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Details:</span> {item.reference}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">৳ {item.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(item)} className="flex-1 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-dark transition-colors">{t('admin_dashboard.approve')}</button>
                  <button onClick={() => handleReject(item)} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{t('admin_dashboard.reject')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
