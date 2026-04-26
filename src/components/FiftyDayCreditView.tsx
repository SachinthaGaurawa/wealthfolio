// src/components/FiftyDayCreditView.tsx
import React, { useState } from 'react';
import { CreditCardPurchase50Day } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { TaskConfirmModal } from '@/components/TaskConfirmModal';
import { CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  purchases: CreditCardPurchase50Day;
  onAdd: (data: Omit<CreditCardPurchase50Day, 'id' | 'completed'>) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FiftyDayCreditView({ purchases, onAdd, onComplete, onDelete }: Props) {
  const = useState<{ id: string, name: string } | null>(null);
  const [form, setForm] = useState({ bank: '', item: '', amount: '', purchaseDate: '' });

  const calculateDaysRemaining = (purchaseDate: string) => {
    const start = new Date(purchaseDate).getTime();
    const current = new Date().getTime();
    const diffDays = Math.floor(Math.abs(current - start) / (1000 * 60 * 60 * 24));
    return 50 - diffDays;
  };

  const handleSubmit = () => {
    if (form.bank && form.item && form.amount && form.purchaseDate) {
      onAdd({ bank: form.bank, item: form.item, amount: Number(form.amount), purchaseDate: form.purchaseDate });
      setForm({ bank: '', item: '', amount: '', purchaseDate: '' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <h3 className="text-lg font-bold text-white mb-4">Add 50-Day CC Purchase</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Bank Name" value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input placeholder="Item / Product" value={form.item} onChange={e => setForm({...form, item: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input type="number" placeholder="Amount (Rs.)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="bg-zinc-800 border-zinc-700 text-white" />
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Add Purchase</Button>
        </div>
      </Card>

      <div className="space-y-4">
        {purchases.filter(p =>!p.completed).map((p) => {
          const daysLeft = calculateDaysRemaining(p.purchaseDate);
          const isWarning = daysLeft <= 10;

          return (
            <Card key={p.id} className={`bg-zinc-900 border ${isWarning? 'border-red-500/50 shadow-red-500/10' : 'border-zinc-800'}`}>
              <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4">
                <div>
                  <h4 className="text-lg font-medium text-white">{p.item} <span className="text-sm text-zinc-400">({p.bank})</span></h4>
                  <div className={`flex items-center mt-1 text-sm ${isWarning? 'text-red-500 font-bold animate-pulse' : 'text-zinc-400'}`}>
                    {isWarning? <AlertCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
                    {daysLeft} days remaining before interest accrues
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-xl font-bold text-white">Rs. {p.amount.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedTask({ id: p.id, name: p.item })} className="p-2 bg-zinc-800 hover:bg-green-600/20 hover:text-green-500 rounded-md transition-colors text-zinc-400">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-2 bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 rounded-md transition-colors text-zinc-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTask && (
        <TaskConfirmModal isOpen={!!selectedTask} title={selectedTask.name} onClose={() => setSelectedTask(null)} onConfirm={() => onComplete(selectedTask.id)} />
      )}
    </div>
  );
}
