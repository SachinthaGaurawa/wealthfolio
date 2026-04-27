import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Clock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  FileText
} from 'lucide-react';
import { Card, Badge, Button } from './ui/Shared';
import { fmt, fmtS, cn, today, fmtN } from '../lib/utils';
import { AppData, PageView } from '../types';

export const Dashboard = ({ data, onNavigate }: { data: AppData, onNavigate: (page: PageView) => void }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date().toISOString().substr(0, 10);
  const curMonth = new Date().toISOString().substr(0, 7);

  // Financial Stats
  const totalAssets = data.income.reduce((s, x) => s + x.amount, 0) + data.balance.total;
  const totalDebt = data.loans.reduce((s, x) => s + x.remaining, 0) + 
                    data.ccinstall.reduce((s, x) => s + x.total, 0);
  const netWorth = totalAssets - totalDebt;

  const monthlyIncome = data.income.reduce((s, x) => s + x.monthly, 0);
  const monthlyExpenses = data.expenses.filter(e => e.month === curMonth).reduce((s, x) => s + x.amount, 0) +
                          data.loans.reduce((s, x) => s + x.monthly, 0) +
                          data.ccinstall.reduce((s, x) => s + x.monthly, 0);
  const cashFlow = monthlyIncome - monthlyExpenses;

  // Upcoming Payments Logic (Fully Automated)
  const upcomingCheques = data.cheques.filter(c => c.status === 'pending' && c.release >= now).sort((a,b) => a.release.localeCompare(b.release)).slice(0, 3);
  const upcomingCC = data.cconetime.filter(c => !c.completed && c.deadline >= now).sort((a,b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  const unpaidExpenses = data.expenses.filter(e => e.month === curMonth && !e.completed).slice(0, 3);

  const stats = [
    { label: 'Net Capital Value', value: netWorth, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Financial Liability', value: totalDebt, icon: Landmark, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Projected Net Income', value: monthlyIncome, icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Monthly Cash Burn', value: monthlyExpenses, icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">System Status: Active</p>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Command Center</h1>
        </div>
        <div className="flex items-center gap-6 bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
             <Clock className="text-blue-600" size={20} />
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Time</p>
               <p className="text-sm font-semibold text-slate-700 font-mono">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             </div>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="flex items-center gap-3">
             <Calendar className="text-blue-600" size={20} />
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Date</p>
               <p className="text-sm font-semibold text-slate-700 font-mono uppercase">{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:border-blue-200 transition-all cursor-default group">
              <div className="flex justify-between items-start mb-4">
                <div className={cn('p-2.5 rounded shadow-sm', s.bg)}>
                  <s.icon className={s.color} size={20} />
                </div>
                <Badge variant="blue">Real-time</Badge>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">{fmtS(s.value)}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Block */}
        <Card className="lg:col-span-2 p-0 overflow-hidden border border-slate-200">
          <div className="p-6 flex justify-between items-center bg-slate-50 border-b border-slate-200">
             <h3 className="font-bold text-slate-600 text-xs uppercase tracking-widest flex items-center gap-2">
               <TrendingUp size={16} className="text-emerald-500" /> Capital Flow Analysis
             </h3>
             <Badge variant={cashFlow >= 0 ? 'green' : 'red'}>
               {cashFlow >= 0 ? '+' : ''}{fmt(cashFlow)} Surplus
             </Badge>
          </div>
          <div className="p-8 space-y-8 bg-white">
             <div className="flex justify-between items-end">
                <div className="space-y-6 flex-1">
                   {[
                     { label: 'Invested Assets', val: data.income.reduce((s,x)=>s+x.amount, 0), color: 'bg-blue-500' },
                     { label: 'Bank Liabilities', val: totalDebt, color: 'bg-red-500' },
                     { label: 'Liquid Reserve', val: data.balance.total, color: 'bg-emerald-500' }
                   ].map(item => (
                     <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                           <span>{item.label}</span>
                           <span className="text-slate-700 font-mono">{((item.val / totalAssets) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(item.val / totalAssets) * 100}%` }}
                             className={cn('h-full', item.color)} 
                           />
                        </div>
                     </div>
                   ))}
                </div>
                <div className="hidden md:flex flex-col items-center justify-center pl-12">
                   <div className="w-32 h-32 rounded-full border-8 border-slate-100 border-t-emerald-500 border-r-emerald-500 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-2xl font-bold text-slate-800 font-mono">
                         {((totalDebt / totalAssets) * 100).toFixed(0)}%
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">ALR</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">Asset/Liability Ratio</p>
                </div>
             </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-4">
             <Button variant="secondary" size="sm" onClick={() => onNavigate('balance')}>Capital Flow Control</Button>
             <Button variant="secondary" size="sm" onClick={() => onNavigate('dscr')}>Loan Eligibility Eng</Button>
          </div>
        </Card>

        {/* Dynamic Payment Tracker */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-600 uppercase tracking-widest text-xs pl-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-blue-500" /> Automated Priority List
          </h3>
          
          <div className="space-y-4">
            {upcomingCheques.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Critical Cheques</p>
                {upcomingCheques.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                         <FileText size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{c.party}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">{c.release}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-red-600 font-mono">{fmtN(c.amount)}</p>
                  </div>
                ))}
              </div>
            )}

            {upcomingCC.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">CC Deadlines</p>
                {upcomingCC.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                         <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{c.desc}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase text-blue-500">{c.deadline}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-blue-600 font-mono">{fmtN(c.amount)}</p>
                  </div>
                ))}
              </div>
            )}

            {unpaidExpenses.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Pending Payables</p>
                {unpaidExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                         <Landmark size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{e.desc}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">{e.cat}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-amber-600 font-mono">{fmtN(e.amount)}</p>
                  </div>
                ))}
              </div>
            )}

            {upcomingCheques.length === 0 && upcomingCC.length === 0 && unpaidExpenses.length === 0 && (
              <div className="py-12 bg-white border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-3 shadow-sm">
                 <ShieldCheck size={32} className="opacity-50" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">All clear for {curMonth}</p>
              </div>
            )}
          </div>

          <Button variant="ghost" className="w-full text-xs" onClick={() => onNavigate('monthly')}>
             Detailed Planning View <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
