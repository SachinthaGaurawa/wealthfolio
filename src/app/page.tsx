// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import SecurityGate from '@/components/SecurityGate';
import { useFinance } from '@/hooks/useFinance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { TargetCountdown } from '@/components/TargetCountdown';
import { FiftyDayCreditView } from '@/components/FiftyDayCreditView';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AppDashboard() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');

  if (!isUnlocked) {
    return <SecurityGate onUnlock={(code) => { setPasscode(code); setIsUnlocked(true); }} />;
  }

  return <DashboardCore passcode={passcode} />;
}

function DashboardCore({ passcode }: { passcode: string }) {
  const finance = useFinance(passcode);
  const { data } = finance;

  const totalIncome = finance.calculateTotalMonthlyIncome;
  const totalExpenses = finance.calculateTotalMonthlyExpenses;
  const availableBalance = finance.getAvailableBalance();

  const chartData =;

  // Forms State
  const [ccForm, setCcForm] = useState({ product: '', buyer: '', bank: '', totalAmount: '', interest: '', duration: '', date: '' });
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', date: '', isDividend: false });
  const [loanForm, setLoanForm] = useState({ bank: '', amount: '', duration: '', interest: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', date: '' });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">WealthFolio</h1>
          <p className="text-zinc-400 text-sm mt-1">High-Security Personal Finance Architecture</p>
        </div>
        <div className="text-left md:text-right bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <p className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Net Monthly Rolling Balance</p>
          <p className={`text-3xl font-bold mt-1 ${availableBalance >= 0? 'text-green-500' : 'text-red-500'}`}>
            Rs. {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TargetCountdown 
              targetAmount={data.targetSavings.targetAmount}
              currentAmount={data.targetSavings.currentAmount}
              startDate={data.targetSavings.startDate}
              endDate={data.targetSavings.endDate}
              onAddSavings={finance.updateTargetSavings}
            />
          </div>
          
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col justify-center items-center p-6">
            <h3 className="text-zinc-400 text-sm uppercase tracking-wider font-semibold mb-4 w-full text-left">Monthly Cash Flow</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Modular Tabs Interface */}
        <Tabs defaultValue="cc-installments" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 w-full justify-start overflow-x-auto p-1 flex-nowrap">
            <TabsTrigger value="cc-installments" className="data-[state=active]:bg-zinc-800 shrink-0">CC Installments</TabsTrigger>
            <TabsTrigger value="cc-50day" className="data-[state=active]:bg-zinc-800 shrink-0">50-Day CC Payments</TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:bg-zinc-800 shrink-0">Income & Dividends</TabsTrigger>
            <TabsTrigger value="investments" className="data-[state=active]:bg-zinc-800 shrink-0">Investments</TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:bg-zinc-800 shrink-0">Loans</TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-zinc-800 shrink-0">Other Expenses</TabsTrigger>
          </TabsList>

          {/* CC Installments Tab */}
          <TabsContent value="cc-installments" className="mt-6 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add New CC Installment</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Bank" value={ccForm.bank} onChange={e => setCcForm({...ccForm, bank: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input placeholder="Product" value={ccForm.product} onChange={e => setCcForm({...ccForm, product: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input placeholder="Buyer" value={ccForm.buyer} onChange={e => setCcForm({...ccForm, buyer: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Total Amount" value={ccForm.totalAmount} onChange={e => setCcForm({...ccForm, totalAmount: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Interest Rate (%)" value={ccForm.interest} onChange={e => setCcForm({...ccForm, interest: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Duration (Months)" value={ccForm.duration} onChange={e => setCcForm({...ccForm, duration: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="date" value={ccForm.date} onChange={e => setCcForm({...ccForm, date: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Button onClick={() => {
                  finance.addCCInstallment({
                    bank: ccForm.bank, product: ccForm.product, buyer: ccForm.buyer,
                    totalAmount: Number(ccForm.totalAmount), interestRateYearly: Number(ccForm.interest),
                    durationMonths: Number(ccForm.duration), purchaseDate: ccForm.date
                  });
                  setCcForm({ product: '', buyer: '', bank: '', totalAmount: '', interest: '', duration: '', date: '' });
                }} className="bg-blue-600 hover:bg-blue-700">Add Installment</Button>
              </div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/50 text-zinc-400">
                    <tr>
                      <th className="p-4">Product / Buyer</th>
                      <th className="p-4">Bank</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Terms</th>
                      <th className="p-4 text-right">Monthly Deduction</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.ccInstallments.filter(i =>!i.completed).map(inst => (
                      <tr key={inst.id} className="hover:bg-zinc-800/20">
                        <td className="p-4"><span className="font-medium text-white">{inst.product}</span><br/><span className="text-xs text-zinc-500">{inst.buyer}</span></td>
                        <td className="p-4">{inst.bank}</td>
                        <td className="p-4">Rs. {inst.totalAmount.toLocaleString()}</td>
                        <td className="p-4">{inst.durationMonths}M @ {inst.interestRateYearly}%</td>
                        <td className="p-4 text-right font-bold text-red-400">Rs. {inst.monthlyPayment.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => finance.markTaskCompleted('ccInstallments', inst.id)} className="border-zinc-700 hover:bg-zinc-800">Complete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cc-50day" className="mt-6">
             <FiftyDayCreditView 
                purchases={data.ccPurchases50Day} 
                onAdd={finance.add50DayPurchase}
                onComplete={(id) => finance.markTaskCompleted('ccPurchases50Day', id)} 
                onDelete={(id) => finance.deleteItem('ccPurchases50Day', id)}
              />
          </TabsContent>

          {/* Income & Dividends Tab */}
          <TabsContent value="income" className="mt-6 space-y-6">
             <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Monthly Income / Dividend</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Source (Company/Person)" value={incomeForm.source} onChange={e => setIncomeForm({...incomeForm, source: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Amount" value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="date" value={incomeForm.date} onChange={e => setIncomeForm({...incomeForm, date: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Button onClick={() => {
                  finance.addIncome({ source: incomeForm.source, amount: Number(incomeForm.amount), date: incomeForm.date, isDividend: incomeForm.isDividend });
                  setIncomeForm({ source: '', amount: '', date: '', isDividend: false });
                }} className="bg-blue-600 hover:bg-blue-700">Add Income</Button>
              </div>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
              <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/50 text-zinc-400">
                    <tr><th className="p-4">Source</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.income.map(inc => (
                      <tr key={inc.id} className="hover:bg-zinc-800/20">
                        <td className="p-4 text-white">{inc.source}</td>
                        <td className="p-4">{inc.date}</td>
                        <td className="p-4 text-right font-bold text-green-400">Rs. {inc.amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => finance.deleteItem('income', inc.id)} className="text-red-400 hover:text-red-300">Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="mt-6 space-y-6">
             <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Bank Loan</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input placeholder="Bank Name" value={loanForm.bank} onChange={e => setLoanForm({...loanForm, bank: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Principal Amount" value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Duration (M)" value={loanForm.duration} onChange={e => setLoanForm({...loanForm, duration: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Yearly Interest %" value={loanForm.interest} onChange={e => setLoanForm({...loanForm, interest: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Button onClick={() => {
                  finance.addLoan({ bank: loanForm.bank, amount: Number(loanForm.amount), durationMonths: Number(loanForm.duration), interestRateYearly: Number(loanForm.interest), startDate: new Date().toISOString().split('T') });
                  setLoanForm({ bank: '', amount: '', duration: '', interest: '', date: '' });
                }} className="bg-blue-600 hover:bg-blue-700">Add Loan</Button>
              </div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
              <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/50 text-zinc-400">
                    <tr><th className="p-4">Bank</th><th className="p-4">Principal</th><th className="p-4">Terms</th><th className="p-4 text-right">Auto Monthly Pymt</th><th className="p-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.loans.filter(l =>!l.completed).map(loan => (
                      <tr key={loan.id} className="hover:bg-zinc-800/20">
                        <td className="p-4 text-white">{loan.bank}</td>
                        <td className="p-4">Rs. {loan.amount.toLocaleString()}</td>
                        <td className="p-4">{loan.durationMonths}M @ {loan.interestRateYearly}%</td>
                        <td className="p-4 text-right font-bold text-red-400">Rs. {loan.monthlyPayment.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => finance.markTaskCompleted('loans', loan.id)} className="border-zinc-700 hover:bg-zinc-800">Complete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-6 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Daily / Other Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Category (e.g. Utilities)" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="number" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="bg-zinc-800 border-zinc-700" />
                <Button onClick={() => {
                  finance.addExpense({ category: expenseForm.category, amount: Number(expenseForm.amount), date: expenseForm.date });
                  setExpenseForm({ category: '', amount: '', date: '' });
                }} className="bg-blue-600 hover:bg-blue-700">Add Expense</Button>
              </div>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
              <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/50 text-zinc-400">
                    <tr><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.monthlyExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-zinc-800/20">
                        <td className="p-4 text-white">{exp.category}</td>
                        <td className="p-4">{exp.date}</td>
                        <td className="p-4 text-right font-bold text-red-400">Rs. {exp.amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => finance.deleteItem('monthlyExpenses', exp.id)} className="text-red-400 hover:text-red-300">Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </Card>
          </TabsContent>
          
        </Tabs>
      </main>
    </div>
  );
}
