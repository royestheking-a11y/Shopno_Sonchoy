import React, { useState } from 'react';
import { Calendar, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';

export function MonthlyClosing() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [log, setLog] = useState<string[]>([]);

  const EXPECTED_MONTHLY_DEPOSIT = 1000; // Expected deposit amount
  const PENALTY_PERCENTAGE = 0.05; // 5% penalty of expected amount
  const DEFAULT_LOAN_INTEREST = 0.05; // 5% monthly loan interest

  const runClosing = async () => {
    setStatus('running');
    setLog([t('admin_monthly_closing.log_start')]);

    try {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const currentYear = new Date().getFullYear();

      const res = await api.post('/monthlyclosings', {
        month: currentMonth,
        year: currentYear
      });

      setLog([
        t('admin_monthly_closing.log_success'),
        `${t('admin_monthly_closing.log_total_deposits')}: ৳${res.data.totalDeposits}`,
        `${t('admin_monthly_closing.log_total_loans')}: ৳${res.data.totalLoans}`,
        `${t('admin_monthly_closing.log_profit')}: ৳${res.data.profit}`,
      ]);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setLog([t('admin_monthly_closing.log_error'), err.response?.data?.message || err.message]);
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_monthly_closing.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_monthly_closing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
          <div className="mb-6 flex items-center gap-3 text-slate-900 dark:text-white font-bold text-lg">
            <Calendar className="text-primary" />
            <span>{t('admin_monthly_closing.execute_closing')}</span>
          </div>

          <div className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p>{t('admin_monthly_closing.penalty_warning')}</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p>{t('admin_monthly_closing.interest_warning')}</p>
            </div>
          </div>

          <button
            onClick={runClosing}
            disabled={status === 'running'}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
          >
            {status === 'running' ? (
              <span className="animate-pulse">{t('admin_monthly_closing.processing')}</span>
            ) : (
              <>
                <Play size={18} /> {t('admin_monthly_closing.run_processing')}
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-premium border border-slate-700 p-6 flex flex-col h-[400px]">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="text-success" size={18} /> {t('admin_monthly_closing.system_log')}
          </h3>
          <div className="flex-1 bg-black/50 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-2">
            {log.length === 0 ? (
              <span className="text-slate-600">{t('admin_monthly_closing.awaiting')}</span>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className={entry.includes('success') ? 'text-success' : 'text-slate-300'}>{entry}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
