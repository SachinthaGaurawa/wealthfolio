// src/hooks/useFinance.ts
import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { encryptData, decryptData } from '@/lib/encryption';
import { FinancialState, CreditCardInstallment, Investment, CreditCardPurchase50Day, Loan, Income, MonthlyExpense } from '@/types/finance';

const STORAGE_KEY = 'wealthfolio_secure_vault';

const initialState: FinancialState = {
  income:,
  monthlyExpenses:,
  ccInstallments:,
  ccPurchases50Day:,
  loans:,
  investments:,
  targetSavings: {
    targetAmount: Number(process.env.NEXT_PUBLIC_TARGET_GOAL) |

| 10000000,
    currentAmount: 0,
    startDate: new Date().toISOString().split('T'),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T'),
  }
};

export const useFinance = (passcode: string) => {
  const = useState<FinancialState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const decrypted = decryptData(stored, passcode);
      if (decrypted) setData(decrypted);
    }
    setIsLoaded(true);
  }, [passcode]);

  useEffect(() => {
    if (isLoaded) {
      const encrypted = encryptData(data, passcode);
      localStorage.setItem(STORAGE_KEY, encrypted);
    }
  }, [data, isLoaded, passcode]);

  const calculateTotalMonthlyIncome = useMemo(() => {
    return data.income.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [data.income]);

  const calculateTotalMonthlyExpenses = useMemo(() => {
    const baseExpenses = data.monthlyExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const activeInstallments = data.ccInstallments
     .filter(item =>!item.completed)
     .reduce((sum, item) => sum + Number(item.monthlyPayment), 0);
    const activeLoans = data.loans
     .filter(item =>!item.completed)
     .reduce((sum, item) => sum + Number(item.monthlyPayment), 0);
    return baseExpenses + activeInstallments + activeLoans;
  }, [data.monthlyExpenses, data.ccInstallments, data.loans]);

  const getAvailableBalance = () => {
    return calculateTotalMonthlyIncome - calculateTotalMonthlyExpenses;
  };

  const addCCInstallment = (installment: Omit<CreditCardInstallment, 'id' | 'monthlyPayment' | 'completed'>) => {
    const P = Number(installment.totalAmount);
    const r = (Number(installment.interestRateYearly) / 100) / 12;
    const n = Number(installment.durationMonths);
    const monthlyPayment = r === 0? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const newItem: CreditCardInstallment = {
     ...installment,
      id: uuidv4(),
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      completed: false
    };
    setData(prev => ({...prev, ccInstallments: [...prev.ccInstallments, newItem] }));
  };

  const addLoan = (loan: Omit<Loan, 'id' | 'monthlyPayment' | 'completed'>) => {
    const P = Number(loan.amount);
    const r = (Number(loan.interestRateYearly) / 100) / 12;
    const n = Number(loan.durationMonths);
    const monthlyPayment = r === 0? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const newItem: Loan = {
     ...loan,
      id: uuidv4(),
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      completed: false
    };
    setData(prev => ({...prev, loans: [...prev.loans, newItem] }));
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const available = getAvailableBalance();
    if (investment.amount > available) {
      if (!confirm(`WARNING: Your investment of Rs. ${investment.amount.toLocaleString()} exceeds your current monthly rolling balance of Rs. ${available.toLocaleString()}. Do you wish to proceed using external capital?`)) {
        return;
      }
    }
    const newItem: Investment = {...investment, id: uuidv4() };
    setData(prev => ({...prev, investments: [...prev.investments, newItem] }));
  };

  const add50DayPurchase = (purchase: Omit<CreditCardPurchase50Day, 'id' | 'completed'>) => {
    const newItem: CreditCardPurchase50Day = {...purchase, id: uuidv4(), completed: false };
    setData(prev => ({...prev, ccPurchases50Day: }));
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newItem: Income = {...income, id: uuidv4() };
    setData(prev => ({...prev, income: [...prev.income, newItem] }));
  };

  const addExpense = (expense: Omit<MonthlyExpense, 'id'>) => {
    const newItem: MonthlyExpense = {...expense, id: uuidv4() };
    setData(prev => ({...prev, monthlyExpenses: [...prev.monthlyExpenses, newItem] }));
  };

  const markTaskCompleted = (category: keyof FinancialState, id: string) => {
    setData(prev => {
      const updatedList = (prev[category] as any).map((item: any) => 
        item.id === id? {...item, completed: true } : item
      );
      return {...prev, [category]: updatedList };
    });
  };

  const deleteItem = (category: keyof FinancialState, id: string) => {
    setData(prev => {
      const updatedList = (prev[category] as any).filter((item: any) => item.id!== id);
      return {...prev, [category]: updatedList };
    });
  };

  const updateTargetSavings = (amountToAdd: number) => {
    setData(prev => ({
     ...prev,
      targetSavings: {
       ...prev.targetSavings,
        currentAmount: prev.targetSavings.currentAmount + amountToAdd
      }
    }));
  };

  return {
    data,
    calculateTotalMonthlyIncome,
    calculateTotalMonthlyExpenses,
    getAvailableBalance,
    addCCInstallment,
    addLoan,
    addInvestment,
    add50DayPurchase,
    addIncome,
    addExpense,
    markTaskCompleted,
    deleteItem,
    updateTargetSavings
  };
};
