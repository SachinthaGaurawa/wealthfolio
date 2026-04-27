import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Landmark, 
  CreditCard, 
  Receipt,
  PieChart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, Badge, Button } from './ui/Shared';
import { fmt, fmtS, cn, fmtN } from '../lib/utils';
import { AppData } from '../types';
import { MONTHS, MONTHS_S } from '../constants';

export const MonthlyPlan = ({ data }: { data: AppData }) => {
  const [activeMonth, setActiveMonth] = useState(new Date().toISOString().substr(0, 7));

  const plan = useMemo(() => {
    const expenses = data.expenses.filter(e => e.month === activeMonth);
    const incomes = data.income.reduce((s, x) => s + x.monthly, 0);
    const loans = data.loans.reduce((s, x) => s + x.monthly, 0);
    const ccs = data.ccinstall.reduce((s, x) => s + x.monthly, 0);
    
    // Check skipped months logic
    const activeCCs = data.ccinstall.map(cc => {
       const isSkipped = cc.skippedMonths.includes(activeMonth);
       const prevMonth = new Date(activeMonth + '-01');
       prevMonth.setMonth(prevMonth.getMonth() - 1);
       const wasSkipped = cc.skippedMonths.includes(prevMonth.toISOString().substr(0, 7));
       const amount = isSkipped ? 0 : (wasSkipped ? cc.monthly * 2 : cc.monthly);
       return { ...cc, activeAmount: amount };
    });
    
    const activeCCsTotal = activeCCs.reduce((s, x) => s + x.activeAmount, 0);
    const totalOut = expenses.reduce((s, x) => s + x.amount, 0) + loans + activeCCsTotal;
    const surplus = incomes - totalOut;

    return { expenses, incomes, loans, activeCCs, activeCCsTotal, totalOut, surplus };
  }, [data, activeMonth]);

  const changeMonth = (dir: number) => {
    const [y, m] = activeMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + dir, 1);
    setActiveMonth(date.toISOString().substr(0, 7));
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xl">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
        <div className="flex flex-col items-center">
           <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter italic">
              {MONTHS[parseInt(activeMonth.split('-')[1]) - 1]} {activeMonth.split('-')[0]}
           </h2>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[4px]">Financial Assessment Cycle</p>
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger Column */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-emerald-500 bg-emerald-500/5">
                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Projected Inflow</p>
                 <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{fmt(plan.incomes)}</p>
              </Card>
              <Card className="border-l-4 border-red-500 bg-red-500/5">
                 <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Mandatory Outflow</p>
                 <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{fmt(plan.totalOut)}</p>
              </Card>
           </div>

           <div className="space-y-4">
              <h3 className="font-black text-slate-400 uppercase tracking-[4px] text-[10px] pl-2 flex items-center gap-2">
                <Receipt size={14} /> Allocation Matrix
              </h3>
              <div className="space-y-2">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-[2px] ml-2">Fixed Installments (Banks & CC)</p>
                 {data.loans.map(l => (
                   <div key={l.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <Landmark size={14} className="text-blue-500" />
                         <span className="text-xs font-bold text-slate-700">{l.name} ({l.bank})</span>
                      </div>
                      <span className="text-xs font-black text-slate-400 font-mono">{fmtN(l.monthly)}</span>
                   </div>
                 ))}
                 {plan.activeCCs.map(cc => (
                   <div key={cc.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <CreditCard size={14} className="text-blue-600" />
                         <span className="text-xs font-bold text-slate-700">{cc.name} ({cc.bank})</span>
                         {cc.activeAmount > cc.monthly && <Badge variant="red">DOUBLED</Badge>}
                         {cc.activeAmount === 0 && <Badge variant="blue">SKIPPED</Badge>}
                      </div>
                      <span className={cn('text-xs font-black font-mono', cc.activeAmount > cc.monthly ? 'text-red-500' : 'text-slate-400')}>
                        {fmtN(cc.activeAmount)}
                      </span>
                   </div>
                 ))}
              </div>

              <div className="space-y-2">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-[2px] ml-2">Variable Expenses</p>
                 {plan.expenses.map(e => (
                   <div key={e.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                         <span className="text-xs font-bold text-slate-700">{e.desc}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <Badge variant="gray">{e.cat}</Badge>
                         <span className="text-xs font-black text-slate-400 font-mono">{fmtN(e.amount)}</span>
                      </div>
                   </div>
                 ))}
                 {plan.expenses.length === 0 && <p className="text-[10px] text-slate-700 italic border border-dashed border-slate-200 p-4 rounded-xl text-center">No expenses recorded for this period</p>}
              </div>
           </div>
        </div>

        {/* Bottom Line Summary */}
        <div className="space-y-6">
           <Card className="bg-white border-slate-200 p-0 overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-1">
                 <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Summary Position</h3>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[2px]">Cycle Balance Assessment</p>
              </div>
              <div className="p-8 space-y-8">
                 <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-3xl border border-slate-200 shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mb-2">Net Disposal Surplus</p>
                    <p className={cn('text-4xl font-black font-mono tracking-tighter italic', plan.surplus >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                       {fmt(plan.surplus)}
                    </p>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-500 uppercase tracking-widest">Efficiency Rating</span>
                       <span className="font-black text-slate-700">{( (plan.totalOut / plan.incomes) * 100 || 0 ).toFixed(1)}% Usage</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (plan.totalOut / plan.incomes) * 100)}%` }}
                        className={cn('h-full', plan.totalOut / plan.incomes > 0.8 ? 'bg-red-500' : 'bg-blue-500')} 
                       />
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex flex-col gap-3">
                 <div className="flex items-start gap-3">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
                    <p className="text-[10px] text-slate-400 italic">"Maintain at least a 20% surplus for emergency strategic reserves across all platforms."</p>
                 </div>
              </div>
           </Card>

           <Card className="bg-blue-600/5 border-blue-500/20 border-dashed space-y-4">
              <div className="flex items-center gap-2">
                 <PieChart className="text-blue-600" size={16} />
                 <h4 className="font-black text-blue-600 uppercase tracking-widest text-[10px]">Allocation Advice</h4>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-bold">
                 {plan.surplus > (plan.incomes * 0.3) 
                    ? "Excellent liquidity. Consider deploying excess surplus into high-growth investment vehicles."
                    : "Caution: Heavy deployment into liabilities. Re-evaluate variable allocations to improve net surplus."}
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
};
