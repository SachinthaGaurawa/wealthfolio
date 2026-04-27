import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Key, RefreshCw, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input } from '../ui/Shared';
import { sha256 } from '../../lib/utils';
import { AuthData } from '../../types';

export const LoginScreen = ({ authData, onLogin, onReset }: { 
  authData: AuthData, 
  onLogin: () => void,
  onReset: () => void 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [securityInput, setSecurityInput] = useState('');

  const handlePinInput = async (val: string) => {
    if (val.length > 4) return;
    setPin(val);
    if (val.length === 4) {
      const hash = await sha256(val);
      if (hash === authData.pinHash) {
        onLogin();
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setPin('');
        }, 1000);
      }
    }
  };

  const verifyRecovery = async () => {
    const sHash = await sha256(securityInput.toLowerCase().trim());
    if (recoveryInput === authData.recoveryCode && sHash === authData.securityAnswerHash) {
      onReset();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        {!forgotMode ? (
          <div className="w-full max-w-xs space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                <Lock className="text-blue-600" size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter">WEALTHFLOW</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[4px]">Enter Secure PIN</p>
            </div>

            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={cn(
                  'w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-300',
                  pin.length > i ? 'bg-blue-600 border-blue-500 text-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700',
                  error && 'border-red-500 text-red-500 animate-shake'
                )}>
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            <input 
              autoFocus 
              type="tel" 
              inputMode="numeric" 
              pattern="[0-9]*"
              value={pin}
              onChange={e => handlePinInput(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
            />

            <button 
              onClick={() => setForgotMode(true)}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest pt-4"
            >
              Forgot Access PIN?
            </button>
          </div>
        ) : (
          <Card className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-500" /> Identity Verification
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Answer security credentials to reset</p>
            </div>

            <div className="space-y-4">
              <Input 
                label="Master Recovery Code" 
                placeholder="16-character code"
                value={recoveryInput}
                onChange={e => setRecoveryInput(e.target.value)}
              />
              <Input 
                label={`Security Hint: ${authData.securityQuestion}`}
                placeholder="Your Answer"
                value={securityInput}
                onChange={e => setSecurityInput(e.target.value)}
              />
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-black uppercase text-center">
                  Verification Failed: Invalid Credentials
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setForgotMode(false)}>Cancel</Button>
              <Button className="flex-1" onClick={verifyRecovery}>Verify Identity</Button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export const SetupScreen = ({ onComplete }: { onComplete: (auth: AuthData) => void }) => {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState('What was your first business name?');
  const [answer, setAnswer] = useState('');
  const [recoveryCode] = useState(() => Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      if (pin.length !== 4) return setError('PIN must be 4 digits');
      setStep(2);
    } else if (step === 2) {
      if (pin !== confirmPin) return setError('PINs do not match');
      setStep(3);
    } else if (step === 3) {
      if (!answer) return setError('Please provide an answer');
      const pinHash = await sha256(pin);
      const answerHash = await sha256(answer.toLowerCase().trim());
      onComplete({
        pinHash,
        securityQuestion: question,
        securityAnswerHash: answerHash,
        recoveryCode,
        lastLogin: Date.now()
      });
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">System Setup</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step {step} of 3</p>
          </div>
          <div className="flex gap-1">
             {[1, 2, 3].map(i => (
               <div key={i} className={cn('w-6 h-1 rounded-full', step >= i ? 'bg-blue-600' : 'bg-slate-800')} />
             ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Create Access PIN</label>
                 <Input 
                   type="password" 
                   maxLength={4} 
                   inputMode="numeric" 
                   pattern="[0-9]*" 
                   className="text-center text-2xl tracking-[1.5em] font-black"
                   value={pin}
                   onChange={e => setPin(e.target.value)}
                 />
               </div>
               <p className="text-xs text-slate-500 italic">"Security is the foundation of wealth management."</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Re-enter PIN to Confirm</label>
                 <Input 
                   type="password" 
                   maxLength={4} 
                   inputMode="numeric" 
                   pattern="[0-9]*" 
                   className="text-center text-2xl tracking-[1.5em] font-black"
                   value={confirmPin}
                   onChange={e => setConfirmPin(e.target.value)}
                 />
               </div>
               {error && <p className="text-[10px] font-bold text-red-500 uppercase">{error}</p>}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div className="space-y-4">
                 <Input label="Security Question" value={question} onChange={e => setQuestion(e.target.value)} />
                 <Input label="Your Answer" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Keep it simple and memorable" />
                 
                 <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <Key size={12} /> Master Recovery Code
                    </p>
                    <p className="font-mono text-xs text-slate-300 break-all">{recoveryCode}</p>
                    <p className="text-[10px] text-slate-500 italic">Store this code safely offline. It is needed to reset your PIN.</p>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={handleNext} className="w-full py-4 uppercase tracking-[4px] font-black group">
          {step === 3 ? 'Finalize & Initialize' : 'Continue'} <ChevronRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Card>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
