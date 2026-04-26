// src/components/TargetCountdown.tsx
import React, { useState } from 'react';
import Confetti from 'react-confetti-boom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TargetProps {
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  onAddSavings: (amount: number) => void;
}

export function TargetCountdown({ targetAmount, currentAmount, startDate, endDate, onAddSavings }: TargetProps) {
  const = useState('');
  
  const isCompleted = currentAmount >= targetAmount;
  const balanceRemaining = Math.max(0, targetAmount - currentAmount);
  const progressPercentage = Math.min((currentAmount / targetAmount) * 100, 100);

  const handleSave = () => {
    const val = Number(saveInput);
    if (val > 0) {
      onAddSavings(val);
      setSaveInput('');
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden relative">
      {isCompleted && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <Confetti mode="boom" particleCount={250} colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']} />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Ultimate Target</h3>
            <p className="text-3xl font-bold text-white mt-1">Rs. {(targetAmount / 1000000).toFixed(2)} Mn</p>
            <p className="text-xs text-zinc-500 mt-1">From {startDate} to {endDate}</p>
          </div>
          <div className="text-right">
            <h3 className="text-zinc-400 text-sm uppercase tracking-wider font-semibold">Balance to Save</h3>
            <p className="text-2xl font-semibold text-blue-400 mt-1">Rs. {(balanceRemaining / 1000000).toFixed(2)} Mn</p>
          </div>
        </div>

        <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full ${isCompleted? 'bg-green-500' : 'bg-blue-600'}`}
          />
        </div>

        <AnimatePresence>
          {isCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 text-center"
            >
              <h2 className="text-2xl font-bold text-green-400">🎉 CONGRATULATIONS! 🎉</h2>
              <p className="text-green-300 mt-1">You have successfully achieved your financial target ahead of schedule.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!isCompleted && (
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="Amount to save..." 
              value={saveInput}
              onChange={(e) => setSaveInput(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white flex-1"
            />
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Save Funds</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
