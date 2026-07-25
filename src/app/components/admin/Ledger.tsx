import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Download, Filter } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function Ledger() {
  const { t } = useTranslation();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/ledgers');
      setTxns(res.data);
    } catch (err) {
      console.error('Failed to fetch ledger data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = txns
    .filter((t: any) => {
      if (filterType === 'all') return true;
      return t.type.includes(filterType);
    })
    .filter((t: any) => {
      if (!search) return true;
      const lowerSearch = search.toLowerCase();
      return t._id.toLowerCase().includes(lowerSearch) || t.description.toLowerCase().includes(lowerSearch);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_ledger.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_ledger.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50">
            <Download size={16} /> {t('admin_ledger.export_csv')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin_ledger.search_placeholder')} 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 focus:border-primary outline-none rounded-xl text-sm"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Filter size={16} /> {filterType === 'all' ? t('admin_ledger.filter_all') : filterType === 'deposit' ? t('admin_ledger.filter_deposit') : t('admin_ledger.filter_loan')}
            </button>
            
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-slate-700 py-1 overflow-hidden">
                  <button onClick={() => { setFilterType('all'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_ledger.filter_all')}</button>
                  <button onClick={() => { setFilterType('deposit'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_ledger.filter_deposit')}</button>
                  <button onClick={() => { setFilterType('loan'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">{t('admin_ledger.filter_loan')}</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">{t('admin_ledger.col_date')}</th>
                <th className="px-6 py-4">{t('admin_ledger.col_txn_id')}</th>
                <th className="px-6 py-4">{t('admin_ledger.col_account')}</th>
                <th className="px-6 py-4">{t('admin_ledger.col_desc')}</th>
                <th className="px-6 py-4 text-right">{t('admin_ledger.col_dr')}</th>
                <th className="px-6 py-4 text-right">{t('admin_ledger.col_cr')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <tr>
                      <td className="px-6 py-4" rowSpan={2}><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4" rowSpan={2}><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="px-6 py-3 text-right text-slate-500">-</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 pl-10"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-3 text-right text-slate-500">-</td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  </React.Fragment>
                ))
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t('admin_ledger.no_entries')}</td>
                </tr>
              ) : filteredTxns.map((txn: any) => {
                return (
                  <React.Fragment key={txn._id}>
                    {/* Debit Row */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300" rowSpan={2}>{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white" rowSpan={2}>
                        <span className="block w-24 truncate" title={txn._id}>{txn._id}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{txn.debitAccount}</td>
                      <td className="px-6 py-3 text-slate-500">{txn.description}</td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">৳ {txn.debitAmount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">-</td>
                    </tr>
                    {/* Credit Row */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-slate-50/30 dark:bg-slate-800/10">
                      <td className="px-6 py-3 text-slate-900 dark:text-white font-medium pl-10">{txn.creditAccount}</td>
                      <td className="px-6 py-3 text-slate-500">{t('admin_ledger.record_desc')} {txn.type}</td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">-</td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">৳ {txn.creditAmount.toLocaleString()}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
