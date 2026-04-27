import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  TrendingDown,
  Landmark,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Input, Badge } from './ui/Shared';
import { fmtN, pM, emi, cn, fmt, sha256 } from '../lib/utils';
import { useWealthFlow } from '../hooks/useWealthFlow';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const DSCRCalculator = () => {
  const { data } = useWealthFlow();
  
  const [monthlyIncome, setMonthlyIncome] = useState<string>('0');
  const [newLoanAmount, setNewLoanAmount] = useState<string>('0');
  const [interestRate, setInterestRate] = useState<string>('12.5');
  const [tenureYears, setTenureYears] = useState<string>('5');
  const [downPayment, setDownPayment] = useState<string>('0');
  
  const [selectedLoans, setSelectedLoans] = useState<string[]>(data.loans.map(l => l.id));
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');

  const existingEmiTotal = useMemo(() => {
    return data.loans
      .filter(l => selectedLoans.includes(l.id))
      .reduce((sum, l) => sum + l.monthly, 0);
  }, [data.loans, selectedLoans]);

  const newLoanEmi = useMemo(() => {
    const p = pM(newLoanAmount) - pM(downPayment);
    if (p <= 0) return 0;
    return emi(p, parseFloat(interestRate), parseInt(tenureYears) * 12);
  }, [newLoanAmount, downPayment, interestRate, tenureYears]);

  const totalDebtService = existingEmiTotal + newLoanEmi;
  const netIncome = pM(monthlyIncome);
  const dscr = totalDebtService > 0 ? netIncome / totalDebtService : 0;
  
  const downPaymentPercent = pM(newLoanAmount) > 0 
    ? (pM(downPayment) / pM(newLoanAmount)) * 100 
    : 0;

  const getStatus = () => {
    if (dscr >= 2.0) return { label: 'STRONG', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: CheckCircle2 };
    if (dscr >= 1.2) return { label: 'GOOD', color: 'text-blue-500', bg: 'bg-blue-500', icon: Info };
    if (dscr >= 1.0) return { label: 'RISK', color: 'text-amber-500', bg: 'bg-amber-500', icon: AlertTriangle };
    return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500', icon: AlertTriangle };
  };

  const status = getStatus();

  const getAiOpinion = async () => {
    setLoadingAi(true);
    try {
      const prompt = `As a Sri Lankan Banking Loan Officer, analyze the following:
      Monthly Income: LKR ${monthlyIncome}
      Existing Loan Payments: LKR ${existingEmiTotal}
      New Loan Amount: LKR ${newLoanAmount}
      New Loan EMI: LKR ${newLoanEmi.toFixed(2)}
      Down Payment: ${downPaymentPercent.toFixed(1)}%
      DSCR: ${dscr.toFixed(2)}
      
      Advice the user if they are eligible for the loan based on 30-35% downpayment rule and Debt Service Coverage. Provide a professional, encouraging yet realistic advice. Max 3 sentences.`;

      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      setAiAdvice(result.text || '');
    } catch (e) {
      setAiAdvice("Connectivity issue. Based on standard SL banking rules, your DSCR of " + dscr.toFixed(2) + " suggests " + status.label + " eligibility.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 italic tracking-tighter uppercase">Loan Eligibility Engine</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[4px]">Advanced DSCR Analysis System</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="blue">SL Bank Standard v2.0</Badge>
          <Badge variant="gold">Business Elite</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Phase */}
        <Card className="lg:col-span-1 space-y-6">
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
            <Calculator size={14} /> Financial Variables
          </h3>
          
          <div className="space-y-4">
            <Input label="Average Monthly Income" placeholder="LKR" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} />
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Linked Existing Loans</label>
              <div className="flex flex-wrap gap-2">
                {data.loans.map(loan => (
                  <button 
                    key={loan.id}
                    onClick={() => setSelectedLoans(prev => prev.includes(loan.id) ? prev.filter(id => id !== loan.id) : [...prev, loan.id])}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border',
                      selectedLoans.includes(loan.id) 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-600' 
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    )}
                  >
                    {loan.name} (EMI: {fmt(loan.monthly)})
                  </button>
                ))}
                {data.loans.length === 0 && <p className="text-[10px] text-slate-600 italic">No system loans found</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-200">
               <Input label="Target Property Value" placeholder="LKR" value={newLoanAmount} onChange={e => setNewLoanAmount(e.target.value)} />
               <Input label="Your Down Payment" placeholder="LKR" value={downPayment} onChange={e => setDownPayment(e.target.value)} />
               <div className="flex justify-between items-center px-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Required (30%): {fmt(pM(newLoanAmount) * 0.3)}</span>
                 <Badge variant={downPaymentPercent >= 30 ? 'green' : 'red'}>{downPaymentPercent.toFixed(1)}% Applied</Badge>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Bank Rate %" type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
              <Input label="Tenure (Years)" type="number" value={tenureYears} onChange={e => setTenureYears(e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Output & Gauge Phase */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="relative overflow-hidden flex flex-col items-center justify-center py-12">
            <div className="absolute top-4 right-4 flex items-center gap-2">
               <ShieldCheck className={status.color} size={20} />
               <span className={cn('font-black text-xs uppercase tracking-widest', status.color)}>{status.label} POSITION</span>
            </div>

            {/* Gauge Component */}
            <div className="relative w-64 h-32 mb-8 overflow-hidden">
              <div className="absolute w-64 h-64 border-[16px] border-slate-200 rounded-full" />
              <div 
                className={cn('absolute w-64 h-64 border-[16px] rounded-full transition-all duration-1000 border-t-transparent border-l-transparent border-r-transparent')}
                style={{ 
                  borderColor: status.bg.replace('bg-', ''), 
                  transform: `rotate(${Math.min(180, (dscr / 2.5) * 180)}deg)`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
                }} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                 <span className="text-4xl font-black text-slate-800 font-mono tracking-tighter">{dscr.toFixed(2)}</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DSCR Ratio</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-6">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">New Loan EMI</p>
                <p className="text-xl font-black text-slate-800 font-mono">{fmtN(newLoanEmi)}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Commitments</p>
                <p className="text-xl font-black text-slate-800 font-mono">{fmtN(totalDebtService)}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Residual Income</p>
                <p className="text-xl font-black text-emerald-500 font-mono">{fmtN(netIncome - totalDebtService)}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bank Liability Ratio</p>
                <p className="text-xl font-black text-blue-500 font-mono">{( (totalDebtService / netIncome) * 100 || 0 ).toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card className="bg-blue-600/5 border-blue-500/20 space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="font-black text-blue-600 uppercase tracking-widest text-[10px] flex items-center gap-2">
                 <Sparkles size={14} /> AI Banker Insight
               </h3>
               <Button size="sm" onClick={getAiOpinion} disabled={loadingAi} className="h-8 text-[10px]">
                 {loadingAi ? 'Analyzing Profile...' : 'Get Dynamic Advice'}
               </Button>
             </div>
             
             <div className="min-h-[60px] flex items-center">
                {aiAdvice ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-300 italic leading-relaxed">
                    "{aiAdvice}"
                  </motion.p>
                ) : (
                  <p className="text-xs text-slate-600 italic">Click the button above to generate a professional loan officer's review of your current financial standing.</p>
                )}
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-slate-800/20 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={12} /> Collateral Requirement
                </p>
                <p className="text-xs text-slate-300">Standard Sri Lankan banks typically require a forced sale value (FSV) coverage of 1.5x the loan amount.</p>
             </div>
             <div className="p-4 bg-slate-800/20 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown size={12} /> Debt Consolidation Tip
                </p>
                <p className="text-xs text-slate-300">If your DBR exceeds 60%, consider consolidating small loans into one long-term facility to improve DSCR.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
