// src/components/SecurityGate.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import { decryptData } from '@/lib/encryption';

interface SecurityGateProps {
  onUnlock: (passcode: string) => void;
}

export default function SecurityGate({ onUnlock }: SecurityGateProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [hasVault, setHasVault] = useState(false);

  useEffect(() => {
    setHasVault(localStorage.getItem('wealthfolio_secure_vault')!== null);
  },);

  const handleUnlock = () => {
    if (!hasVault) {
      if (passcode.length < 4) {
        setError('Passcode must be at least 4 characters.');
        return;
      }
      onUnlock(passcode);
      return;
    }

    const testDecrypt = decryptData(localStorage.getItem('wealthfolio_secure_vault') |

| '', passcode);
    if (testDecrypt) {
      onUnlock(passcode);
    } else {
      setError('Incorrect Passcode. Access Denied.');
    }
  };

  const handleForgotPasscode = () => {
    if (confirm("CRITICAL WARNING: Resetting your passcode will securely erase ALL encrypted local financial data. This cannot be undone. Do you wish to proceed?")) {
      localStorage.removeItem('wealthfolio_secure_vault');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-blue-600/20 p-4 rounded-full mb-4 w-fit">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">WealthFolio Secure Vault</CardTitle>
          <p className="text-zinc-400 text-sm mt-2">
            {hasVault? "Enter your passcode to decrypt your financial data." : "Create a high-security passcode to initialize your vault."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Input 
              type="password" 
              placeholder="Enter Passcode..." 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-center text-xl tracking-widest text-white focus-visible:ring-blue-500 h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            {error && <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1"><ShieldAlert className="w-4 h-4"/>{error}</p>}
          </div>
          
          <Button onClick={handleUnlock} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg transition-all">
            <Unlock className="w-5 h-5 mr-2" />
            {hasVault? 'Decrypt & Access' : 'Initialize Vault'}
          </Button>

          {hasVault && (
            <button onClick={handleForgotPasscode} className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mt-4">
              Forgot Passcode?
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
