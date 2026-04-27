import React from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Landmark, 
  ArrowUpRight, 
  Calendar,
  Building,
  Target
} from 'lucide-react';
import { Card, Button, Badge } from './ui/Shared';
import { motion } from 'motion/react';
import { IncomeSource, Loan } from '../types';
import { fmt, fmtS, fmtN, cn } from '../lib/utils';

export const IncomePage = ({ income, onAdd, onEdit, onDelete }: {
  income: IncomeSource[],
  onAdd: () => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
}) => {
  const totalInflow = income.reduce((s, x) => s + x.monthly, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
             <TrendingUp size={24} />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Capital Inflow</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Revenue Streams & Strategic Assets</p>
           </div>
        </div>
        <div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Yield Assessment</p>
           <p className="text-2xl font-black text-emerald-500 font-mono italic tracking-tighter">+{fmtS(totalInflow)}</p>
        </div>
      </div>

      <div className="flex justify-end">
         <Button onClick={onAdd} size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest">
           <Plus size={14} className="mr-2" /> Inject Revenue Stream
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {income.map(item => (
          <Card key={item.id} className="relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="blue">{item.company}</Badge>
                    <Badge variant="gray">{item.freq.toUpperCase()}</Badge>
                  </div>
               </div>
               <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <ArrowUpRight size={18} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-3 bg-slate-100/50 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Yield/Mo</p>
                  <p className="text-md font-black text-emerald-500 font-mono tracking-tighter">{fmtN(item.monthly)}</p>
               </div>
               <div className="p-3 bg-slate-100/50 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Asset Value</p>
                  <p className="text-md font-black text-slate-400 font-mono tracking-tighter">{fmtN(item.amount)}</p>
               </div>
            </div>

            <div className="flex gap-2">
               <Button onClick={() => onEdit(item.id)} variant="secondary" className="flex-1" size="sm"><Edit3 size={14} className="mr-2" /> Adjust</Button>
               <Button onClick={() => onDelete(item.id)} variant="danger" size="sm"><Trash2 size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const LoansPage = ({ loans, onAdd, onEdit, onDelete }: {
  loans: Loan[],
  onAdd: () => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
}) => {
  const totalOutflow = loans.reduce((s, x) => s + x.monthly, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
             <Landmark size={24} />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Liability Registry</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bank Facilities & Amortization Schedules</p>
           </div>
        </div>
        <div>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Monthly Burn</p>
           <p className="text-2xl font-black text-red-500 font-mono italic tracking-tighter">-{fmtS(totalOutflow)}</p>
        </div>
      </div>

       <div className="flex justify-end">
         <Button onClick={onAdd} size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest">
           <Plus size={14} className="mr-2" /> Integrate Facility
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map(loan => {
          const progress = Math.min(100, Math.round(((loan.amount - loan.remaining) / loan.amount) * 100));
          return (
            <Card key={loan.id} className="relative group">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{loan.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="red">{loan.bank}</Badge>
                      <Badge variant="gray">{loan.term} Months</Badge>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Monthly EMI</p>
                       <p className="text-xl font-black text-red-500 font-mono tracking-tighter">{fmtN(loan.monthly)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Remaining</p>
                       <p className="text-[11px] font-black text-slate-400 font-mono">{fmtN(loan.remaining)}</p>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                       <span>Amortization Progress</span>
                       <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-red-500" />
                    </div>
                 </div>

                 <div className="flex gap-2 pt-2">
                   <Button onClick={() => onEdit(loan.id)} variant="secondary" className="flex-1" size="sm">Recalibrate</Button>
                   <Button onClick={() => onDelete(loan.id)} variant="danger" size="sm"><Trash2 size={14} /></Button>
                 </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
