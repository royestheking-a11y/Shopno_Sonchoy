import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Download, FileText, Users, Activity, TrendingUp, ArrowDownRight, ArrowUpRight, 
  Search, Filter, Calendar, CreditCard, ShieldCheck, Wallet, CheckCircle2, PieChart
} from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { 
  generateMemberReportPDF, 
  generateCollectionReportPDF, 
  generateLoanReportPDF, 
  generateAuditReportPDF 
} from '../../../utils/reportGenerators';
import { Skeleton } from '../ui/skeleton';
import { useSocket } from '../../../context/SocketContext';

const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span className={`font-extrabold select-none ${className}`}>৳</span>
);

export function Reports() {
  const { t } = useTranslation();
  const { updateTicker } = useSocket();
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Raw data from DB
  const [members, setMembers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Filter state for payment audit table
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'deposit' | 'repayment' | 'expense'>('all');
  const [activeMethodFilter, setActiveMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchAnalyticsData();
  }, [updateTicker]);

  const fetchAnalyticsData = async () => {
    try {
      const [usersRes, depositsRes, loansRes, repaymentsRes, withdrawalsRes] = await Promise.all([
        api.get('/users'),
        api.get('/deposits'),
        api.get('/loans'),
        api.get('/loans/repayments').catch(() => ({ data: [] })),
        api.get('/masterwallets/withdrawals').catch(() => ({ data: { withdrawals: [] } }))
      ]);

      const allMembers = usersRes.data.filter((u: any) => u.role === 'member');
      setMembers(allMembers);
      setDeposits(depositsRes.data || []);
      setLoans(loansRes.data || []);
      setRepayments(repaymentsRes.data || []);
      setWithdrawals(withdrawalsRes.data?.withdrawals || []);
    } catch (err) {
      console.error('Failed to fetch analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  // PDF Export Handlers
  const handleDownloadMember = async () => {
    try {
      setIsDownloading('member');
      const res = await api.get('/users');
      generateMemberReportPDF(res.data);
    } catch (err) {
      console.error('Error downloading member report', err);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadCollection = async () => {
    try {
      setIsDownloading('collection');
      const res = await api.get('/deposits');
      generateCollectionReportPDF(res.data);
    } catch (err) {
      console.error('Error downloading collection report', err);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadLoan = async () => {
    try {
      setIsDownloading('loan');
      const res = await api.get('/loans');
      generateLoanReportPDF(res.data);
    } catch (err) {
      console.error('Error downloading loan report', err);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadAudit = async () => {
    try {
      setIsDownloading('audit');
      const res = await api.get('/ledgers');
      generateAuditReportPDF(res.data);
    } catch (err) {
      console.error('Error downloading audit report', err);
    } finally {
      setIsDownloading(null);
    }
  };

  // Summary Metrics Calculations
  const approvedDeposits = deposits.filter((d: any) => d.status === 'approved');
  const approvedLoans = loans.filter((l: any) => ['approved', 'active', 'repaid'].includes(l.status));
  const approvedRepayments = repayments.filter((r: any) => r.status === 'approved');
  
  const totalDepositsVolume = approvedDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalLoansDisbursed = approvedLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalRepaymentsVolume = approvedRepayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpensesVolume = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  // Current Month & Year Stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyDeposits = approvedDeposits
    .filter((d: any) => {
      const dt = new Date(d.date || d.createdAt);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
    })
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const yearlyDeposits = approvedDeposits
    .filter((d: any) => {
      const dt = new Date(d.date || d.createdAt);
      return dt.getFullYear() === selectedYear;
    })
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const yearlyLoans = approvedLoans
    .filter((l: any) => {
      const dt = new Date(l.requestDate || l.approvalDate || l.createdAt);
      return dt.getFullYear() === selectedYear;
    })
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  // Method Breakdown Stats
  const methodStats = {
    bKash: 0,
    Nagad: 0,
    Rocket: 0,
    Bank: 0
  };

  approvedDeposits.forEach((d: any) => {
    const m = (d.method || '').toLowerCase();
    if (m.includes('bkash')) methodStats.bKash += Number(d.amount) || 0;
    else if (m.includes('nagad')) methodStats.Nagad += Number(d.amount) || 0;
    else if (m.includes('rocket')) methodStats.Rocket += Number(d.amount) || 0;
    else methodStats.Bank += Number(d.amount) || 0;
  });

  const methodTotal = totalDepositsVolume || 1;
  const bKashPercent = Math.round((methodStats.bKash / methodTotal) * 100);
  const nagadPercent = Math.round((methodStats.Nagad / methodTotal) * 100);
  const rocketPercent = Math.round((methodStats.Rocket / methodTotal) * 100);
  const bankPercent = Math.round((methodStats.Bank / methodTotal) * 100);

  // Monthly aggregated data for charts (12 Months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyChartData = monthNames.map((month, index) => {
    const monthDeposits = approvedDeposits
      .filter((d: any) => {
        const dt = new Date(d.date || d.createdAt);
        return dt.getMonth() === index && dt.getFullYear() === selectedYear;
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const monthLoans = approvedLoans
      .filter((l: any) => {
        const dt = new Date(l.requestDate || l.approvalDate || l.createdAt);
        return dt.getMonth() === index && dt.getFullYear() === selectedYear;
      })
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const monthRepayments = approvedRepayments
      .filter((r: any) => {
        const dt = new Date(r.date || r.createdAt);
        return dt.getMonth() === index && dt.getFullYear() === selectedYear;
      })
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const monthExpenses = withdrawals
      .filter((w: any) => {
        const dt = new Date(w.date || w.createdAt);
        return dt.getMonth() === index && dt.getFullYear() === selectedYear;
      })
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    return {
      name: month,
      Deposits: monthDeposits,
      Loans: monthLoans,
      Repayments: monthRepayments,
      Expenses: monthExpenses
    };
  });

  // Consolidated Master Transactions List
  const unifiedTransactions = [
    ...approvedDeposits.map((d: any) => ({
      _id: d._id,
      type: 'deposit',
      typeName: 'Member Deposit',
      user: d.userId,
      amount: Number(d.amount) || 0,
      method: d.method || 'bKash',
      reference: d.reference || 'Deposit Reference',
      date: d.date || d.createdAt,
      status: d.status
    })),
    ...approvedRepayments.map((r: any) => ({
      _id: r._id,
      type: 'repayment',
      typeName: 'Loan Repayment',
      user: r.userId,
      amount: Number(r.amount) || 0,
      method: r.method || 'bKash',
      reference: r.reference || 'Loan Repayment',
      date: r.date || r.createdAt,
      status: r.status
    })),
    ...withdrawals.map((w: any) => ({
      _id: w._id,
      type: 'expense',
      typeName: 'Admin Expense / Withdrawal',
      user: w.userId,
      amount: Number(w.amount) || 0,
      method: 'Master Wallet',
      reference: w.reference || 'Operational Expense',
      date: w.date || w.createdAt,
      status: 'approved'
    }))
  ].sort((a, b) => new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime());

  // Filtered transactions for detail audit table
  const filteredTransactions = unifiedTransactions.filter(t => {
    if (activeTypeFilter !== 'all' && t.type !== activeTypeFilter) return false;
    if (activeMethodFilter !== 'all' && t.method.toLowerCase() !== activeMethodFilter.toLowerCase()) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userName = (typeof t.user === 'object' ? t.user?.name : '').toLowerCase();
      const memberId = (typeof t.user === 'object' ? t.user?.memberId : '').toLowerCase();
      const ref = (t.reference || '').toLowerCase();
      const id = t._id.toString().toLowerCase();
      return userName.includes(q) || memberId.includes(q) || ref.includes(q) || id.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_reports.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_reports.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('admin_reports.filter_year')}</label>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Top Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 h-[150px]">
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-36" />
            </div>
          ))
        ) : (
          <>
            {/* Card 1: Total Member Deposits */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-emerald-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <ArrowDownRight size={24} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {t('admin_reports.deposits')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('admin_reports.lifetime_deposits')}</p>
              <h3 title={`৳ ${totalDepositsVolume.toLocaleString()}`} className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">৳ {totalDepositsVolume.toLocaleString()}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/60 gap-2">
                <span className="truncate flex-1" title={`৳ ${monthlyDeposits.toLocaleString()}`}>Monthly: <strong className="text-emerald-600 dark:text-emerald-400">৳ {monthlyDeposits.toLocaleString()}</strong></span>
                <span className="truncate flex-1 text-right" title={`৳ ${yearlyDeposits.toLocaleString()}`}>Yearly: <strong className="text-slate-900 dark:text-white">৳ {yearlyDeposits.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Card 2: Total Loan Disbursements */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-amber-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <TrendingUp size={24} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {t('admin_reports.loan_report')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('admin_reports.lifetime_loans')}</p>
              <h3 title={`৳ ${totalLoansDisbursed.toLocaleString()}`} className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">৳ {totalLoansDisbursed.toLocaleString()}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/60 gap-2">
                <span className="truncate flex-1" title={`৳ ${totalRepaymentsVolume.toLocaleString()}`}>Repaid: <strong className="text-emerald-600 dark:text-emerald-400">৳ {totalRepaymentsVolume.toLocaleString()}</strong></span>
                <span className="truncate flex-1 text-right" title={`৳ ${yearlyLoans.toLocaleString()}`}>Yearly: <strong className="text-slate-900 dark:text-white">৳ {yearlyLoans.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Card 3: Total Expenses & Withdrawals */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-rose-500/40 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                  <ArrowUpRight size={24} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {t('admin_reports.expenses')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('admin_reports.master_expenses')}</p>
              <h3 title={`৳ ${totalExpensesVolume.toLocaleString()}`} className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">৳ {totalExpensesVolume.toLocaleString()}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/60 gap-2">
                <span className="truncate flex-1">Logs Recorded: <strong className="text-slate-900 dark:text-white">{withdrawals.length}</strong></span>
                <span className="text-rose-500 font-semibold truncate flex-1 text-right">Operational Costs</span>
              </div>
            </div>

            {/* Card 4: Active Members & Net Asset Growth */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 hover:border-primary/40 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Users size={24} />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('admin_reports.active_members')}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{members.length}</h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <span>System Status: <strong className="text-emerald-500 font-bold">100% Healthy</strong></span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Charts & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Financial Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_reports.monthly_breakdown')} ({selectedYear})</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live comparison of member deposits, loan disbursements, and repayments month by month.</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-700" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                  <Tooltip 
                    formatter={(val: any) => [`৳ ${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Bar dataKey="Deposits" name={t('admin_reports.deposits')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Loans" name={t('admin_reports.loan_report')} fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Repayments" name={t('admin_reports.loan_repayments')} fill="#0F6FFF" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_reports.payment_distribution')}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Percentage share of total deposits processed by payment gateway.</p>

            <div className="space-y-4">
              {/* bKash */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-pink-600 dark:text-pink-400">bKash</span>
                  <span className="text-slate-900 dark:text-white">৳ {methodStats.bKash.toLocaleString()} ({bKashPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${bKashPercent}%` }}></div>
                </div>
              </div>

              {/* Nagad */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-orange-600 dark:text-orange-400">Nagad</span>
                  <span className="text-slate-900 dark:text-white">৳ {methodStats.Nagad.toLocaleString()} ({nagadPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${nagadPercent}%` }}></div>
                </div>
              </div>

              {/* Rocket */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-purple-600 dark:text-purple-400">Rocket</span>
                  <span className="text-slate-900 dark:text-white">৳ {methodStats.Rocket.toLocaleString()} ({rocketPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${rocketPercent}%` }}></div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-blue-600 dark:text-blue-400">Bank Transfer</span>
                  <span className="text-slate-900 dark:text-white">৳ {methodStats.Bank.toLocaleString()} ({bankPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${bankPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Gateway:</span>
            <strong className="text-pink-600 dark:text-pink-400 font-bold">bKash (Mobile Banking)</strong>
          </div>
        </div>
      </div>

      {/* Export PDF Reports Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t('admin_reports.download_pdf')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={handleDownloadMember} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'member' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t('admin_reports.member_report')}</h3>
              <p className="text-xs text-slate-500">{members.length} {t('admin_reports.active_members')}</p>
            </div>
            <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'member' ? 'animate-bounce' : ''}`} />
          </div>

          <div onClick={handleDownloadCollection} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'collection' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <div className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center mb-3 font-extrabold text-lg select-none">
                ৳
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t('admin_reports.collection_report')}</h3>
              <p className="text-xs text-slate-500">{t('admin_reports.all_deposits')}</p>
            </div>
            <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'collection' ? 'animate-bounce' : ''}`} />
          </div>

          <div onClick={handleDownloadLoan} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'loan' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-3">
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t('admin_reports.loan_report')}</h3>
              <p className="text-xs text-slate-500">{t('admin_reports.disbursements_interest')}</p>
            </div>
            <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'loan' ? 'animate-bounce' : ''}`} />
          </div>

          <div onClick={handleDownloadAudit} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'audit' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t('admin_reports.audit_report')}</h3>
              <p className="text-xs text-slate-500">{t('admin_reports.ledger_journals')}</p>
            </div>
            <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'audit' ? 'opacity-50 pointer-events-none' : ''}`} />
          </div>
        </div>
      </div>

      {/* Part-by-Part Master Payment Details & Transaction Audit Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-[#E5E7EB] dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_reports.master_audit')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete breakdown of every deposit, loan repayment, and master wallet expense.</p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search member, ID or Trx..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Type Filters */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('admin_reports.all_transactions')} ({unifiedTransactions.length})
              </button>
              <button
                onClick={() => setActiveTypeFilter('deposit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'deposit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                {t('admin_reports.deposits')} ({approvedDeposits.length})
              </button>
              <button
                onClick={() => setActiveTypeFilter('repayment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'repayment' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
                }`}
              >
                {t('admin_reports.loan_repayments')} ({approvedRepayments.length})
              </button>
              <button
                onClick={() => setActiveTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                {t('admin_reports.expenses')} ({withdrawals.length})
              </button>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Method:</span>
              <select
                value={activeMethodFilter}
                onChange={e => setActiveMethodFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary"
              >
                <option value="all">{t('admin_reports.all_gateways')}</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText size={44} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No Transactions Found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-[#E5E7EB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Ref / Trx ID</th>
                  <th className="px-6 py-4">Transaction Type</th>
                  <th className="px-6 py-4">Member / Admin</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                {filteredTransactions.map((t: any) => {
                  const isUserObj = typeof t.user === 'object' && t.user !== null;
                  const userName = isUserObj ? t.user.name : 'System / Admin';
                  const memberId = isUserObj ? t.user.memberId : 'Admin';

                  return (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Trx ID */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                          #{t._id.toString().slice(-5).toUpperCase()}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {t.typeName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[180px]">
                          {t.reference}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white text-xs">{userName}</div>
                        <span className="text-[10px] text-primary font-bold">{memberId}</span>
                      </td>

                      {/* Method */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          t.method.toLowerCase().includes('bkash') ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20' :
                          t.method.toLowerCase().includes('nagad') ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' :
                          t.method.toLowerCase().includes('rocket') ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {t.method}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-bold text-sm">
                        <span className={t.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {t.type === 'expense' ? '- ' : '+ '}৳ {t.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(t.date || Date.now()).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
