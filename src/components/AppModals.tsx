import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Modal } from './ui/Modal';
import { Input, Select, Button, Badge } from './ui/Shared';
import { BANKS, CATEGORIES } from '../constants';
import { 
  IncomeSource, 
  Loan, 
  CCInstallment, 
  CCOneTime, 
  Cheque, 
  Expense, 
  Target, 
  BalanceFlow 
} from '../types';
import { pM, today, emi, fmtN, fmt, cn } from '../lib/utils';
import { Calendar, Banknote, Landmark, CreditCard, Tag, FileText, User } from 'lucide-react';

interface AppModalsProps {
  activeModal: string | null;
  onClose: () => void;
  onSave: (type: string, data: any) => void;
  editData?: any;
}

export const AppModals = ({ activeModal, onClose, onSave, editData }: AppModalsProps) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (activeModal && editData) {
      setFormData(editData);
    } else {
      setFormData({ 
        date: today(), 
        start: today(), 
        issue: today(), 
        release: today(), 
        deadline: today(),
        month: today().substr(0,7),
        skippedMonths: [],
        type: activeModal === 'cheque' ? 'issued' : undefined,
        status: activeModal === 'cheque' ? 'pending' : undefined
      });
    }
  }, [activeModal, editData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (activeModal) onSave(activeModal, formData);
  };

  // Advanced numeric input with auto-formatting logic
  const NumericInput = ({ label, field, value, placeholder }: any) => (
    <Input 
      label={label}
      placeholder={placeholder}
      value={typeof value === 'number' ? fmtN(value) : (value || '')}
      onChange={e => handleChange(field, pM(e.target.value))}
      onBlur={e => {
        // Enforce the .00 if needed
        const val = pM(e.target.value);
        handleChange(field, val);
      }}
      className="font-mono text-slate-800 font-black italic"
    />
  );

  return (
    <>
      {/* Income Modal */}
      <Modal isOpen={activeModal === 'income'} onClose={onClose} title={editData ? 'Modify Strategic Inflow' : 'Define New Revenue Stream'}>
        <div className="space-y-6">
          <Input label="Source Identifier" placeholder="e.g. Fixed Deposit Alpha" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
          <Select label="Holding Institution" value={formData.company || ''} onChange={e => handleChange('company', e.target.value)}>
             <option value="">Select Financial Institution</option>
             {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <NumericInput label="Principal Assets" field="amount" value={formData.amount} />
            <Input label="Annual Yield %" type="number" step="0.01" value={formData.rate || ''} onChange={e => handleChange('rate', parseFloat(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <NumericInput label="Monthly Payout" field="monthly" value={formData.monthly} />
             <Select label="Distribution Ledger" value={formData.freq || 'monthly'} onChange={e => handleChange('freq', e.target.value)}>
                <option value="monthly">Monthly Cycle</option>
                <option value="annual">Annual Term</option>
             </Select>
          </div>
          <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase italic">Commit Revenue Stream</Button>
        </div>
      </Modal>

      {/* Loan Modal */}
       <Modal isOpen={activeModal === 'loan'} onClose={onClose} title="Liability Matrix Integration">
        <div className="space-y-4">
          <Input label="Credit Facility Profile" placeholder="e.g. Business Expansion Loan" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
          <Select label="Lending Authority" value={formData.bank || ''} onChange={e => handleChange('bank', e.target.value)}>
            <option value="">Select Financial Institution</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <NumericInput label="Total Liability" field="amount" value={formData.amount} />
            <NumericInput label="Monthly Amortization" field="monthly" value={formData.monthly} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Term Duration (Months)" type="number" value={formData.term || ''} onChange={e => handleChange('term', parseInt(e.target.value))} />
            <NumericInput label="Remaining Exposure" field="remaining" value={formData.remaining} />
          </div>
          <Input label="Facility Start Date" type="date" value={formData.start || ''} onChange={e => handleChange('start', e.target.value)} />
          <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Sync Liability To System</Button>
        </div>
      </Modal>

      {/* CC Installment Modal */}
      <Modal isOpen={activeModal === 'ccinstall'} onClose={onClose} title="Advanced CC Amortization">
        <div className="space-y-4">
           <Input label="Installment Profile" placeholder="e.g. MacBook Pro M3" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
           <Select label="Card Issuer" value={formData.bank || ''} onChange={e => handleChange('bank', e.target.value)}>
            <option value="">Select Banking Partner</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <NumericInput label="Total Settlement" field="total" value={formData.total} />
            <NumericInput label="Monthly Impact" field="monthly" value={formData.monthly} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cycle Duration (Months)" type="number" value={formData.months || ''} onChange={e => handleChange('months', parseInt(e.target.value))} />
            <Input label="Active Step" type="number" value={formData.current || '0'} onChange={e => handleChange('current', parseInt(e.target.value))} />
          </div>
          <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Authorize Amortization</Button>
        </div>
      </Modal>

      {/* Cheque Modal */}
      <Modal isOpen={activeModal === 'cheque'} onClose={onClose} title="Secure Cheque Ledger Entry">
         <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl mb-2">
               <button onClick={() => handleChange('type', 'issued')} className={cn('flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all', formData.type === 'issued' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500')}>Outgoing</button>
               <button onClick={() => handleChange('type', 'received')} className={cn('flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all', formData.type === 'received' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500')}>Incoming</button>
            </div>
            <Input label="Counterparty Name" placeholder="Entity or Individual" value={formData.party || ''} onChange={e => handleChange('party', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
               <Select label="Banking Channel" value={formData.bank || ''} onChange={e => handleChange('bank', e.target.value)}>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
               </Select>
               <Input label="Instrument Serial No" value={formData.no || ''} onChange={e => handleChange('no', e.target.value)} />
            </div>
            <NumericInput label="Clearing Amount" field="amount" value={formData.amount} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Issue Date" type="date" value={formData.issue || ''} onChange={e => handleChange('issue', e.target.value)} />
               <Input label="Release/Value Date" type="date" value={formData.release || ''} onChange={e => handleChange('release', e.target.value)} />
            </div>
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Register Instrument</Button>
         </div>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={activeModal === 'expense'} onClose={onClose} title="Strategic Allocation Entry">
         <div className="space-y-4">
            <Input label="Cost Description" value={formData.desc || ''} onChange={e => handleChange('desc', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
               <NumericInput label="Debit Amount" field="amount" value={formData.amount} />
               <Select label="Category" value={formData.cat || ''} onChange={e => handleChange('cat', e.target.value)}>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Fiscal Month" type="month" value={formData.month || ''} onChange={e => handleChange('month', e.target.value)} />
               <div className="flex items-center gap-3 pt-6 px-1">
                  <input type="checkbox" id="rec" checked={formData.recurring || false} onChange={e => handleChange('recurring', e.target.checked)} className="accent-blue-600" />
                  <label htmlFor="rec" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Recurring Cost</label>
               </div>
            </div>
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Record Allocation</Button>
         </div>
      </Modal>

      {/* Asset Goal Modal */}
      <Modal isOpen={activeModal === 'target'} onClose={onClose} title="Define Growth Objective">
         <div className="space-y-4">
            <Input label="Asset Goal Perspective" placeholder="e.g. New Office Real Estate" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
            <NumericInput label="Target Valuation" field="amount" value={formData.amount} />
            <Input label="Strategic Deadline" type="date" value={formData.deadline || ''} onChange={e => handleChange('deadline', e.target.value)} />
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Initiate Growth Path</Button>
         </div>
      </Modal>

      {/* Saving Allocation Modal */}
      <Modal isOpen={activeModal === 'saving'} onClose={onClose} title="Log Strategic Allocation">
         <div className="space-y-4">
            <NumericInput label="Deployment Amount" field="amount" value={formData.amount} />
            <Input label="Deployment Date" type="date" value={formData.date || ''} onChange={e => handleChange('date', e.target.value)} />
            <Input label="Notes / Reference" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} />
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Execute Transfer</Button>
         </div>
      </Modal>

      {/* Balance Adjustment Modal */}
      <Modal isOpen={activeModal === 'balset'} onClose={onClose} title="Adjust Primary Capital Base">
         <div className="space-y-4">
            <NumericInput label="Current Absolute Balance" field="total" value={formData.total} />
            <p className="text-[10px] text-slate-500 italic text-center">"This overrides the current liquid balance in the system."</p>
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase">Re-calibrate Capital</Button>
         </div>
      </Modal>

       {/* Balance Flow Modal */}
       <Modal isOpen={activeModal === 'balflow'} onClose={onClose} title="Log Capital Movement">
         <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl mb-1">
               <button onClick={() => handleChange('type', 'out')} className={cn('flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all', formData.type === 'out' ? 'bg-red-500 text-white' : 'text-slate-500')}>Deployment Out</button>
               <button onClick={() => handleChange('type', 'in')} className={cn('flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all', formData.type === 'in' ? 'bg-emerald-500 text-white' : 'text-slate-500')}>Capital Return</button>
            </div>
            <Input label="Target Project/Company" value={formData.company || ''} onChange={e => handleChange('company', e.target.value)} />
            <NumericInput label="Movement Amount" field="amount" value={formData.amount} />
            <Input label="Execution Date" type="date" value={formData.date || ''} onChange={e => handleChange('date', e.target.value)} />
            <Input label="Internal Reference" value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} />
            <Button onClick={handleSave} className="w-full py-4 tracking-widest font-black uppercase italic">Commit Movement</Button>
         </div>
      </Modal>
    </>
  );
};
