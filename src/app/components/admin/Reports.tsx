import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, DollarSign, Activity } from 'lucide-react';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { 
  generateMemberReportPDF, 
  generateCollectionReportPDF, 
  generateLoanReportPDF, 
  generateAuditReportPDF 
} from '../../../utils/reportGenerators';

export function Reports() {
  const { t } = useTranslation();
  const [membersCount, setMembersCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await api.get('/users');
      setMembersCount(usersRes.data.filter((u: any) => u.role === 'member').length);
    } catch (err) {
      console.error('Failed to fetch report data', err);
    }
  };

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

  const mockMonthlyData = [
    { name: 'Jan', deposits: 4000, loans: 2400 },
    { name: 'Feb', deposits: 3000, loans: 1398 },
    { name: 'Mar', deposits: 2000, loans: 9800 },
    { name: 'Apr', deposits: 2780, loans: 3908 },
    { name: 'May', deposits: 1890, loans: 4800 },
    { name: 'Jun', deposits: 2390, loans: 3800 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_reports.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_reports.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={handleDownloadMember} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'member' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('admin_reports.member_report')}</h3>
            <p className="text-xs text-slate-500">{membersCount} {t('admin_reports.active_members')}</p>
          </div>
          <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'member' ? 'animate-bounce' : ''}`} />
        </div>

        <div onClick={handleDownloadCollection} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 flex justify-between items-center group cursor-pointer hover:border-primary transition-colors ${isDownloading === 'collection' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <div className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center mb-3">
              <DollarSign size={20} />
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
          <Download size={20} className={`text-slate-300 group-hover:text-primary transition-colors ${isDownloading === 'audit' ? 'animate-bounce' : ''}`} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('admin_reports.volume_analytics')}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="deposits" name={t('admin_reports.deposits')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="loans" name={t('admin_reports.loans_disbursed')} fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
