import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../utils/api';
import { cn } from '../Layout';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function MemberWallet({ user }: { user: any }) {
  const { t } = useTranslation();
  const [txns, setTxns] = useState<any[]>([]);
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [authRes, depositsRes] = await Promise.all([
        api.get(`/users/${user._id || user.id}`),
        api.get('/deposits')
      ]);
      setUserData(authRes.data);
      setTxns(depositsRes.data
        .filter((t: any) => t.status === 'approved')
        .map((t: any) => ({ ...t, type: 'deposit' }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Shopno Sonchoy', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Premium Wallet Statement', 14, 28);
    
    // User Info
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Member Name: ${userData.name || 'N/A'}`, 14, 40);
    doc.text(`Member ID: ${userData.memberId || 'N/A'}`, 14, 46);
    doc.text(`Current Balance: BDT ${userData.balance?.toLocaleString() || 0}`, 14, 52);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 58);
    
    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 63, 196, 63);
    
    // Table
    const tableData = txns.map(txn => [
      new Date(txn.date).toLocaleDateString(),
      txn._id,
      txn.method,
      txn.type.charAt(0).toUpperCase() + txn.type.slice(1),
      `${txn.type === 'deposit' ? '+' : '-'} ${txn.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Transaction ID', 'Method', 'Type', 'Amount (BDT)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
    });
    
    doc.save(`Shopno_Sonchoy_Statement_${userData.memberId || 'Wallet'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('member_wallet.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('member_wallet.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{t('member_wallet.current_balance')}</p>
            {loading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">৳ {(userData.balance || 0).toLocaleString()}</h2>
            )}
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Download size={18} />
            {t('member_wallet.download_pdf')}
          </button>
        </div>

        <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : txns.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
              <Clock size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">{t('member_wallet.no_transactions')}</p>
              <p>{t('member_wallet.no_transactions_desc')}</p>
            </div>
          ) : (
            txns.map((txn: any) => (
              <div key={txn._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-medium shadow-sm",
                    txn.type === 'deposit' ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  )}>
                    {txn.type === 'deposit' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{txn.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(txn.date).toLocaleDateString()} • {t('member_wallet.trx_id')} {txn._id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    txn.type === 'deposit' ? "text-success" : "text-slate-900 dark:text-white"
                  )}>
                    {txn.type === 'deposit' ? '+' : '-'}৳ {txn.amount.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
                    {t('member_wallet.completed_via', { method: txn.method })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
