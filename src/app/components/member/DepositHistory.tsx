import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowDownRight, Clock, Download, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../utils/api';
import { cn } from '../Layout';
import { useTranslation } from 'react-i18next';

export function DepositHistory({ user }: { user: any }) {
  const { t } = useTranslation();
  const [txns, setTxns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user._id || user.id]);

  const fetchData = async () => {
    try {
      const res = await api.get('/deposits');
      const userTxns = res.data
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date || a.createdAt || Date.now()).getTime();
          const dateB = new Date(b.date || b.createdAt || Date.now()).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
      setTxns(userTxns);
    } catch (err) {
      console.error('Failed to fetch deposit history', err);
    }
  };

  const filteredTxns = txns.filter(t => {
    const matchesSearch = !search || t._id.toLowerCase().includes(search.toLowerCase()) || (t.reference && t.reference.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Shopno Sonchoy', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Premium Deposit History', 14, 28);
    
    // User Info
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Member Name: ${user.name || 'N/A'}`, 14, 40);
    doc.text(`Member ID: ${user.memberId || 'N/A'}`, 14, 46);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 52);
    
    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 57, 196, 57);
    
    // Table
    const tableData = filteredTxns.map(txn => [
      new Date(txn.date).toLocaleDateString(),
      txn._id,
      txn.reference || '-',
      txn.method,
      `BDT ${txn.amount.toLocaleString()}`,
      txn.status.charAt(0).toUpperCase() + txn.status.slice(1)
    ]);

    autoTable(doc, {
      startY: 64,
      head: [['Date', 'Transaction ID', 'Reference', 'Method', 'Amount', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    
    doc.save(`Shopno_Sonchoy_Deposits_${user.memberId || 'History'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('member_deposit_history.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('member_deposit_history.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full">
            <input 
              type="text" 
              placeholder={t('member_deposit_history.search_placeholder')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 focus:border-primary outline-none rounded-xl text-sm"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none flex items-center gap-2 pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-primary cursor-pointer text-slate-700 dark:text-slate-200 h-full"
              >
                <option value="all">{t('member_deposit_history.status_all')}</option>
                <option value="approved">{t('member_deposit_history.status_approved')}</option>
                <option value="pending">{t('member_deposit_history.status_pending')}</option>
                <option value="rejected">{t('member_deposit_history.status_rejected')}</option>
              </select>
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all shadow-md">
              <Download size={16} /> {t('member_deposit_history.download_pdf')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">{t('member_deposit_history.col_txn_id')}</th>
                <th className="px-6 py-4">{t('member_deposit_history.col_reference')}</th>
                <th className="px-6 py-4">{t('member_deposit_history.col_date')}</th>
                <th className="px-6 py-4">{t('member_deposit_history.col_method')}</th>
                <th className="px-6 py-4">{t('member_deposit_history.col_amount')}</th>
                <th className="px-6 py-4 text-right">{t('member_deposit_history.col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-sm">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Clock size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">{t('member_deposit_history.no_deposits')}</p>
                      <p>{t('member_deposit_history.no_deposits_desc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTxns.map(txn => (
                  <tr key={txn._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <span className="block w-24 truncate" title={txn._id}>{txn._id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{txn.reference || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(txn.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{txn.method}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">৳ {txn.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold inline-block",
                        txn.status === 'approved' ? "bg-success/10 text-success" :
                        txn.status === 'rejected' ? "bg-danger/10 text-danger" :
                        "bg-warning/10 text-warning"
                      )}>
                        {txn.status === 'approved' ? t('member_deposit_history.status_approved') :
                         txn.status === 'rejected' ? t('member_deposit_history.status_rejected') :
                         t('member_deposit_history.status_pending')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
