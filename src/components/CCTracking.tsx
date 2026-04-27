import React from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ChevronRight, 
  History, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  SkipForward,
  Info
} from 'lucide-react';
import { Card, Button, Badge } from './ui/Shared';
import { fmt, fmtS, cn, curMonth, pM, fmtN } from '../lib/utils';
import { CCInstallment, CCOneTime } from '../types';

export const CCInstallmentsPage = ({ 
  ccinstall, 
  onAdd, 
  onDelete, 
  onMarkDone, 
  onSkip 
}: {
  ccinstall: CCInstallment[],
  onAdd: () => void,
  onDelete: (id: string) => void,
  onMarkDone: (id: string) => void,
  onSkip: (id: string, month: string) => void
}) => {
  const currentMonthIdx = new Date().toISOString().substr(0, 7);
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthIdx = prevMonthDate.toISOString().substr(0, 7);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
             <CreditCard size={24} />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Installment Matrix</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Credit Card Plans</p>
           </div>
        </div>
        <Button onClick={onAdd} size="sm">New Facility</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ccinstall.map(cc => {
          const isSkippedThisMonth = cc.skippedMonths.includes(currentMonthIdx);
          const wasSkippedLastMonth = cc.skippedMonths.includes(prevMonthIdx);
          const installmentToPay = wasSkippedLastMonth ? cc.monthly * 2 : cc.monthly;
          const progress = Math.round((cc.current / cc.months) * 100);

          return (
            <Card key={cc.id} className={cn('relative group', cc.completed && 'opacity-60 grayscale')}>
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                   <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{cc.name}</h3>
                   <div className="flex items-center gap-2">
                     <Badge variant="blue">{cc.bank}</Badge>
                     <Badge variant="gray">{cc.current}/{cc.months} Paid</Badge>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Monthly Cost</p>
                   <p className={cn('text-xl font-black font-mono', wasSkippedLastMonth ? 'text-blue-600' : 'text-slate-800')}>
                     {fmtS(installmentToPay)}
                   </p>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                       <span>Plan Progress</span>
                       <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400" />
                    </div>
                 </div>

                 {wasSkippedLastMonth && (
                   <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                      <AlertCircle className="text-amber-500" size={16} />
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
                        Last month skipped. Double installment due this cycle.
                      </p>
                   </div>
                 )}

                 {isSkippedThisMonth && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                      <Info className="text-blue-500" size={16} />
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-relaxed">
                        SKIPPED: Payment deferred to next month.
                      </p>
                   </div>
                 )}

                 <div className="flex gap-2">
                    {!cc.completed && !isSkippedThisMonth && (
                      <Button className="flex-1" size="sm" onClick={() => onMarkDone(cc.id)}>
                        Log Payment
                      </Button>
                    )}
                    {!cc.completed && !isSkippedThisMonth && (
                      <Button variant="secondary" onClick={() => onSkip(cc.id, currentMonthIdx)} size="sm" className="group">
                        <SkipForward size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => onDelete(cc.id)}>
                       <Trash2 size={16} />
                    </Button>
                 </div>
              </div>
            </Card>
          );
        })}
        {ccinstall.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-600 space-y-4">
             <CreditCard size={48} className="opacity-10" />
             <p className="text-xs font-black uppercase tracking-[4px]">No active facilities found</p>
             <Button onClick={onAdd} variant="secondary" size="sm">Setup First Installment</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const CCOneTimePage = ({ cconetime, onAdd, onMarkPaid, onDelete }: {
  cconetime: CCOneTime[],
  onAdd: () => void,
  onMarkPaid: (id: string) => void,
  onDelete: (id: string) => void
}) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
             <CreditCard size={24} />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Single Term Obligations</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">One-time Card Expenditures</p>
           </div>
        </div>
        <Button onClick={onAdd} size="sm">New Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cconetime.map(cc => (
          <Card key={cc.id} className={cn('relative group', cc.completed && 'opacity-50 grayscale')}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{cc.desc}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{cc.bank}</p>
              </div>
              <Badge variant={cc.completed ? 'green' : 'yellow'}>{cc.completed ? 'Settled' : 'Open'}</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Due</p>
                 <p className="text-xl font-black text-slate-800 font-mono tracking-tighter">{fmtN(cc.amount)}</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-100/50 rounded-lg border border-slate-200">
                 <AlertCircle size={14} className="text-blue-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase">Deadline: {cc.deadline}</span>
              </div>
              <div className="flex gap-2">
                {!cc.completed && <Button className="flex-1" size="sm" onClick={() => onMarkPaid(cc.id)}>Clear Debt</Button>}
                <Button variant="danger" size="sm" onClick={() => onDelete(cc.id)}><Trash2 size={16} /></Button>
              </div>
            </div>
          </Card>
        ))}
        {cconetime.length === 0 && (
           <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-600 gap-4">
              <CreditCard size={48} className="opacity-10" />
              <p className="text-xs font-black uppercase tracking-[4px]">No one-time debts recorded</p>
           </div>
        )}
      </div>
    </div>
  );
};
