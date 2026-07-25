import React from 'react';
import { PiggyBank, TrendingUp, Target, Plus } from 'lucide-react';
import { cn } from '../Layout';

export function MemberSavings({ user }: { user: any }) {
  const savingsPlans = [
    { id: 1, name: 'General Savings (DPS)', target: 500000, current: 150000, monthly: 5000, status: 'Active' },
    { id: 2, name: 'Emergency Fund', target: 100000, current: 80000, monthly: 2000, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Savings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and manage your savings goals.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          New Savings Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl shadow-xl border border-primary-light/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4">
            <PiggyBank size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 font-medium text-sm mb-1">Total Savings Balance</p>
            <h2 className="text-3xl font-bold mb-4">৳ {user.savings.toLocaleString()}</h2>
            <div className="space-y-2 text-sm text-emerald-50">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Monthly Commitment</span>
                <span className="font-semibold">৳ 7,000</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Expected Profit (YTD)</span>
                <span className="font-semibold text-white">+৳ 12,500</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Plans</h3>
          {savingsPlans.map(plan => {
            const progress = (plan.current / plan.target) * 100;
            return (
              <div key={plan.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center transition-all hover:shadow-md">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Target size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">৳ {plan.monthly.toLocaleString()} / month</p>
                  </div>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">৳ {plan.current.toLocaleString()}</span>
                    <span className="text-slate-500 dark:text-slate-400">Target: ৳ {plan.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
