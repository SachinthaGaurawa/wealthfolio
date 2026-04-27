import React, { useState } from 'react';
import { 
  FileCheck, 
  AlertCircle, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Banknote,
  Search,
  Filter,
  ArrowRight,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, Button, Badge, Input } from './ui/Shared';
import { fmt, fmtS, today, cn, fmtN } from '../lib/utils';
import { Cheque, BalanceFlow } from '../types';

export const ChequesPage = ({ cheques, onUpdateStatus, onDelete, onAdd }: {
  cheques: Cheque[],
  onUpdateStatus: (id: string, status: Cheque['status']) => void,
  onDelete: (id: string) => void,
  onAdd: () => void
}) => {
  const [filter, setFilter] = useState('');
  
  const filtered = cheques.filter(chq => 
    chq.party.toLowerCase().includes(filter.toLowerCase()) || 
    chq.no.includes(filter) ||
    chq.bank.toLowerCase().includes(filter.toLowerCase())
  );

  const pendingReceived = cheques.filter(x => x.status === 'pending' && x.type === 'received');
  const pendingIssued = cheques.filter(x => x.status === 'pending' && x.type === 'issued');

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Incoming Pending</p>
          <p className="text-xl font-black text-emerald-500 font-mono tracking-tighter italic">+{fmtS(pendingReceived.reduce((s,x)=>s+x.amount,0))}</p>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <p className="text-[8px] font-black text-red-500/60 uppercase tracking-widest mb-1">Outgoing Pending</p>
          <p className="text-xl font-black text-red-500 font-mono tracking-tighter italic">-{fmtS(pendingIssued.reduce((s,x)=>s+x.amount,0))}</p>
        </Card>
        <Card className="sm:col-span-2 flex items-center justify-between p-4 bg-slate-50 border-slate-200">
           <div className="flex-1 mr-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Seach by Party, Bank or Cheque No..." 
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full bg-slate-100/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 transition-all"
                />
             </div>
           </div>
           <Button onClick={onAdd} size="sm"><Plus size={14} /> Log Cheque</Button>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-600 gap-4">
             <Banknote size={48} className="opacity-10" />
             <p className="text-xs font-black uppercase tracking-[4px]">No cheque records found</p>
          </div>
        )}
        
        {filtered.map(chq => {
          const isUrgent = chq.status === 'pending' && chq.release <= today();
          return (
            <Card key={chq.id} className={cn('relative group border-l-2', 
              chq.status === 'cleared' ? 'opacity-50 grayscale border-emerald-500' : 
              chq.status === 'bounced' ? 'border-red-500' : 
              'border-slate-200 hover:border-blue-500/40'
            )}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
                    chq.type === 'received' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  )}>
                    {chq.type === 'received' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <h4 className="font-black text-slate-800 italic uppercase tracking-tight">{chq.party}</h4>
                       <Badge variant={chq.status === 'cleared' ? 'green' : chq.status === 'bounced' ? 'red' : 'yellow'}>
                         {chq.status}
                       </Badge>
                       {isUrgent && (
                         <motion.span 
                           animate={{ opacity: [1, 0.4, 1] }} 
                           transition={{ repeat: Infinity, duration: 1.5 }}
                           className="flex items-center gap-1 text-[8px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                         >
                           <ShieldAlert size={10} /> CRITICAL DUE
                         </motion.span>
                       )}
                    </div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[2px]">{chq.bank} · <span className="text-slate-400">NO: {chq.no}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-10">
                  <div className="flex items-center gap-4 text-left">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-600 uppercase">Issue Date</p>
                        <p className="text-[10px] font-bold text-slate-400 font-mono italic">{chq.issue}</p>
                     </div>
                     <ArrowRight size={12} className="text-slate-700" />
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-600 uppercase">Release Date</p>
                        <p className={cn('text-xs font-black font-mono tracking-tighter', isUrgent ? 'text-red-500' : 'text-slate-300')}>{chq.release}</p>
                     </div>
                  </div>
                  
                  <div className="text-right min-w-[120px]">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Clearing Value</p>
                    <p className={cn('text-xl font-black font-mono italic tracking-tighter', chq.type === 'received' ? 'text-emerald-500' : 'text-red-500')}>
                      {chq.type === 'received' ? '+' : '-'}{fmtN(chq.amount)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {chq.status === 'pending' && (
                      <>
                        <button onClick={() => onUpdateStatus(chq.id, 'cleared')} className="p-2.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all border border-transparent hover:border-emerald-500/20" title="Confirm Clearing"><FileCheck size={18} /></button>
                        <button onClick={() => onUpdateStatus(chq.id, 'bounced')} className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20" title="Flag as Bounced"><AlertCircle size={18} /></button>
                      </>
                    )}
                    <button onClick={() => onDelete(chq.id)} className="p-2.5 hover:bg-slate-200 text-slate-500 rounded-xl transition-all border border-transparent hover:border-slate-200" title="Remove Entry"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const BalancePage = ({ balance, onSetBalance, onLogFlow, onDeleteFlow }: {
  balance: { total: number, flows: BalanceFlow[] },
  onSetBalance: () => void,
  onLogFlow: () => void,
  onDeleteFlow: (id: string) => void
}) => {
  const investedOut = balance.flows.filter(x => x.type === 'out').reduce((s,x) => s + x.amount, 0);
  const returnsIn = balance.flows.filter(x => x.type === 'in').reduce((s,x) => s + x.amount, 0);
  const net = balance.total - investedOut + returnsIn;

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600/5 border-blue-600/20">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-[3px] mb-2">Primary Capital</p>
          <p className="text-3xl font-black text-blue-500 font-mono tracking-tighter italic">{fmtS(balance.total)}</p>
        </Card>
        <Card className="bg-red-600/5 border-red-600/20">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-[3px] mb-2">Deployed Assets</p>
          <p className="text-3xl font-black text-red-500 font-mono tracking-tighter italic">-{fmtS(investedOut)}</p>
        </Card>
        <Card className="bg-blue-600/5 border-blue-500/30 shadow-[0_0_40px_rgba(245,166,35,0.05)]">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-[3px] mb-2">Net Liquid Position</p>
          <p className="text-3xl font-black text-blue-600 font-mono tracking-tighter italic">{fmtS(net)}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs italic">Asset Deployment Matrix</h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onLogFlow} size="sm">New Entry</Button>
          <Button onClick={onSetBalance} size="sm">Base Adjustment</Button>
        </div>
      </div>

      <div className="space-y-2">
        {balance.flows.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-600 gap-4">
             <ShieldCheck size={48} className="opacity-10" />
             <p className="text-xs font-black uppercase tracking-[4px]">No deployment history</p>
          </div>
        )}
        {[...balance.flows].reverse().map(flow => (
          <div key={flow.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group transition-all hover:border-blue-500/20 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
                flow.type === 'out' ? 'bg-red-500/10 text-red-500' : flow.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
              )}>
                 {flow.type === 'out' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
              </div>
              <div>
                <p className="font-black text-slate-800 uppercase tracking-tight italic">{flow.company}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{flow.date} {flow.notes ? `· ${flow.notes}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className={cn('text-xl font-black font-mono italic tracking-tighter', flow.type === 'out' ? 'text-red-500' : 'text-emerald-500')}>
                {flow.type === 'out' ? '-' : '+'}{fmtN(flow.amount)}
              </div>
              <button onClick={() => onDeleteFlow(flow.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
