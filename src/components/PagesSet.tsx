import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  Trophy,
  History,
  TrendingUp,
  Settings as SettingsIcon,
  Cloud,
  ShieldCheck,
  Download,
  Upload,
  Lock,
  LogOut,
  Calendar,
  X,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Badge, Input, Select } from './ui/Shared';
import { AnimatePresence } from 'motion/react';
import { fmt, fmtS, today, cn, fmtN } from '../lib/utils';
import { Expense, Target, Settings } from '../types';
import { CATEGORIES } from '../constants';
import confetti from 'canvas-confetti';

export const ExpensesPage = ({ expenses, onAdd, onMarkPaid, onDelete }: {
  expenses: Expense[],
  onAdd: () => void,
  onMarkPaid: (id: string) => void,
  onDelete: (id: string) => void
}) => {
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substr(0, 7));

  const filtered = expenses.filter(e => !filterMonth || e.month === filterMonth);
  const total = filtered.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-6">
           <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase tracking-[2px] block">Filter Timeline</label>
             <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-[180px] bg-slate-100/50 border-slate-200" />
           </div>
           <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
           <div>
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payload</p>
             <p className="text-2xl font-black text-slate-800 font-mono italic tracking-tighter">{fmtS(total)}</p>
           </div>
        </div>
        <Button onClick={onAdd} size="sm" className="w-full md:w-auto h-12">
          <Plus size={16} /> New Allocation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filtered.map(exp => (
          <Card key={exp.id} className={cn('relative group border-l-2', exp.completed ? 'opacity-60 grayscale border-emerald-500' : 'border-slate-200')}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500">
                  <Badge variant="gray">{exp.cat.charAt(0)}</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {exp.desc}
                    {exp.recurring && <RefreshCw size={12} className="text-blue-500 animate-spin-slow" />}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{exp.cat}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-600 uppercase">Amount</p>
                   <p className="text-lg font-black font-mono text-blue-600">{fmtN(exp.amount)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {!exp.completed && <button onClick={() => onMarkPaid(exp.id)} className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 size={18} /></button>}
                  <button onClick={() => onDelete(exp.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TargetsPage = ({ targets, onAdd, onAddSaving, onDelete, onDeleteSaving }: {
  targets: Target[],
  onAdd: () => void,
  onAddSaving: (tid: string) => void,
  onDelete: (id: string) => void,
  onDeleteSaving: (tid: string, sid: string) => void
}) => {
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);

  const activeHistoryTarget = targets.find(t => t.id === historyTargetId);

  const handleSavingsLog = (tid: string) => {
    onAddSaving(tid);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#ffffff', '#3b82f6']
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Strategic Reserves</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Growth Targets & Achievement Tracking</p>
        </div>
        <Button onClick={onAdd} size="sm"><Plus size={16} /> Asset Goal</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {targets.map(t => {
          const saved = t.savings.reduce((s, x) => s + x.amount, 0);
          const progress = Math.min(100, Math.round((saved / t.amount) * 100));
          const completed = saved >= t.amount;

          return (
            <Card key={t.id} className="relative overflow-hidden pt-12">
              <AnimatePresence>
                {completed && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-4 right-4 text-emerald-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-[2px] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
                  >
                    <Trophy size={14} /> Peak Performance
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-1 uppercase italic">{t.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[2px]">
                  <Calendar size={12} /> Target Deadline: {t.deadline}
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-3 px-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-blue-600 tracking-tighter">{progress}%</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase">Capital Growth</span>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-0.5">Objective: {fmtS(t.amount)}</p>
                   <p className="text-sm font-black text-emerald-500 font-mono italic">Deployed: {fmtN(saved)}</p>
                </div>
              </div>

              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-8 border border-slate-200 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn('h-full transition-all duration-1000 shadow-sm', completed ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-gradient-to-r from-blue-600 to-blue-400')} 
                  onAnimationComplete={() => { if(completed) triggerCelebration(); }}
                />
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                       <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Recent Allocation History</p>
                       <button onClick={() => setHistoryTargetId(t.id)} className="text-[8px] font-black text-blue-500 uppercase hover:underline">View All Ledger</button>
                    </div>
                    <div className="space-y-1">
                       {t.savings.slice(-3).reverse().map(s => (
                         <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400">{s.date}</span>
                            <span className="text-[10px] font-black text-blue-600 font-mono">+{fmtN(s.amount)}</span>
                         </div>
                       ))}
                       {t.savings.length === 0 && <p className="text-[10px] text-slate-700 italic py-2 text-center">No allocations yet recorded</p>}
                    </div>
                 </div>

                 <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => handleSavingsLog(t.id)} disabled={completed} variant={completed ? 'secondary' : 'primary'}>
                    {completed ? 'Target Realized' : 'Allocate Capital'}
                  </Button>
                  <Button variant="danger" onClick={() => { if(confirm('Delete entire target?')) onDelete(t.id)}} size="sm"><Trash2 size={16} /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* History Ledger Modal */}
      <AnimatePresence>
        {historyTargetId && activeHistoryTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50/90 backdrop-blur-md" onClick={() => setHistoryTargetId(null)} />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden relative shadow-2xl">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                   <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{activeHistoryTarget.name} - Full Ledger</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Complete saving transactions</p>
                   </div>
                   <button onClick={() => setHistoryTargetId(null)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500"><X size={20} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-2">
                   {activeHistoryTarget.savings.slice().reverse().map(s => (
                     <div key={s.id} className="flex justify-between items-center p-3 bg-slate-100/50 border border-slate-200 rounded-xl group">
                        <div className="flex items-center gap-4">
                           <Calendar size={14} className="text-slate-500" />
                           <div>
                              <p className="text-xs font-bold text-slate-700">{s.date}</p>
                              {s.notes && <p className="text-[9px] text-slate-500 italic mt-0.5">{s.notes}</p>}
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="font-mono text-xs font-black text-emerald-500">+{fmtN(s.amount)}</span>
                           <button onClick={() => onDeleteSaving(activeHistoryTarget.id, s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 rounded-md transition-all">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-6 bg-white border-t border-slate-200">
                   <Button variant="secondary" className="w-full" onClick={() => setHistoryTargetId(null)}>Return to Targets</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
