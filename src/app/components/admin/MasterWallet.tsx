import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowDownRight, ShieldCheck, PieChart } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';

export function MasterWallet() {
  const { t } = useTranslation();
  const [txns, setTxns] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [currentPlatformBalance, setCurrentPlatformBalance] = useState(0);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [depositsRes, loansRes, walletRes] = await Promise.all([
        api.get('/deposits'),
        api.get('/loans'),
        api.get('/masterwallets')
      ]);

      const deposits = depositsRes.data;
      const loans = loansRes.data;
      const wallet = walletRes.data;

      const approvedDeposits = deposits.filter((t: any) => t.status === 'approved').reduce((sum: number, t: any) => sum + t.amount, 0);
      const activeLoans = loans.filter((l: any) => ['approved', 'active'].includes(l.status)).reduce((sum: number, l: any) => sum + l.amount, 0);
      
      setTotalDeposits(approvedDeposits);
      setTotalLoans(activeLoans);
      setCurrentPlatformBalance(wallet?.balance || 0);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_master_wallet.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_master_wallet.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <ShieldCheck size={140} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-slate-300 mb-2">
                <Wallet size={20} />
                <span className="font-medium text-sm">{t('admin_master_wallet.liquid_balance')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">৳ {currentPlatformBalance.toLocaleString()}</h2>
              <p className="text-emerald-400 text-sm font-medium">{t('admin_master_wallet.safe_secured')}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-slate-400 text-xs font-medium mb-1">{t('admin_master_wallet.total_assets')}</p>
                <p className="text-xl font-bold text-white">৳ {(currentPlatformBalance + totalLoans).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <div className="w-12 h-12 bg-success/10 text-success rounded-xl flex items-center justify-center mb-4">
            <ArrowDownRight size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.total_deposits')}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalDeposits.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2">{t('admin_master_wallet.total_deposits_desc')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.active_loans')}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {totalLoans.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-2">{t('admin_master_wallet.active_loans_desc')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <PieChart size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('admin_master_wallet.fund_utilization')}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalDeposits ? ((totalLoans / totalDeposits) * 100).toFixed(1) : 0}%
          </h3>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${totalDeposits ? ((totalLoans / totalDeposits) * 100) : 0}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
