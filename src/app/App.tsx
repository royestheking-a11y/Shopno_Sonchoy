import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './components/Login';
import { AppLayout } from './components/AppLayout';
import { Dashboard as AdminDashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { DepositApprovals } from './components/admin/DepositApprovals';
import { LoanApprovals } from './components/admin/LoanApprovals';
import { Ledger } from './components/admin/Ledger';
import { MasterWallet } from './components/admin/MasterWallet';
import { Reports } from './components/admin/Reports';
import { MemberDashboard } from './components/member/MemberDashboard';
import { MonthlyClosing } from './components/admin/MonthlyClosing';
import { RepayLoan } from './components/member/RepayLoan';
import { DepositFlow } from './components/member/DepositFlow';
import { LoanRequest } from './components/member/LoanRequest';
import { MemberWallet } from './components/member/MemberWallet';
import { DepositHistory } from './components/member/DepositHistory';
import { MemberRules } from './components/member/MemberRules';
import { Settings } from './components/Settings';
import { Broadcasts } from './components/admin/Broadcasts';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-md">
      This module is part of the enterprise plan and is currently under development.
    </p>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authData = localStorage.getItem('swapno_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.user) {
          setUser(parsed.user);
        } else {
          // Fallback for old local storage
          setUser(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-900 flex items-center justify-center">Loading...</div>;


  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout user={user} />}>
          {user.role === 'admin' ? (
            <>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="deposits" element={<DepositApprovals />} />
              <Route path="loans" element={<LoanApprovals />} />
              <Route path="wallet" element={<MasterWallet />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="reports" element={<Reports />} />
              <Route path="monthly-closing" element={<MonthlyClosing />} />
              <Route path="broadcasts" element={<Broadcasts />} />
              <Route path="settings" element={<Settings user={user} />} />
              <Route path="*" element={<Placeholder title="Admin Module" />} />
            </>
          ) : (
            <>
              <Route index element={<MemberDashboard user={user} />} />
              <Route path="deposit" element={<DepositFlow user={user} />} />
              <Route path="deposit-history" element={<DepositHistory user={user} />} />
              <Route path="request-loan" element={<LoanRequest user={user} />} />
              <Route path="repay-loan" element={<RepayLoan user={user} />} />
              <Route path="wallet" element={<MemberWallet user={user} />} />
              <Route path="rules" element={<MemberRules />} />
              <Route path="settings" element={<Settings user={user} />} />
              <Route path="*" element={<Placeholder title="Member Module" />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
