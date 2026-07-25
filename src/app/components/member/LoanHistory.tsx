import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../Layout';
import { useSocket } from '../../../context/SocketContext';

export function LoanHistory({ user }: { user: any }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateTicker } = useSocket();

  useEffect(() => {
    fetchLoans();
  }, [user, updateTicker]);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans');
      // Backend already filters by user if not admin, but let's be safe
      const userLoans = res.data.filter((l: any) => l.userId === user.id || l.userId === user._id || (typeof l.userId === 'object' && l.userId._id === (user.id || user._id)));
      setLoans(userLoans.sort((a: any, b: any) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
    } catch (err) {
      console.error('Failed to fetch loans', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Loan History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your previous and active loan requests.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-20 ml-auto" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              </div>
            ))
          ) : loans.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Clock size={40} className="mx-auto mb-4 opacity-20" />
              <p>You have no loan history.</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div key={loan._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-medium",
                    loan.status === 'approved' || loan.status === 'active' ? "bg-success/10 text-success" : 
                    loan.status === 'repaid' ? "bg-primary/10 text-primary" :
                    loan.status === 'rejected' ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                  )}>
                    {loan.status === 'approved' || loan.status === 'active' ? <CheckCircle2 size={24} /> : 
                     loan.status === 'repaid' ? <CheckCircle2 size={24} /> :
                     loan.status === 'rejected' ? <XCircle size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">৳ {loan.amount.toLocaleString()}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{loan.purpose || 'General Loan'} • {new Date(loan.requestDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    loan.status === 'approved' || loan.status === 'active' ? "bg-success/10 text-success" : 
                    loan.status === 'repaid' ? "bg-primary/10 text-primary" :
                    loan.status === 'rejected' ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                  )}>
                    {loan.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">Interest: {loan.interestRate}%</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
