// src/types/finance.ts
export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  isDividend: boolean;
}

export interface MonthlyExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

export interface CreditCardInstallment {
  id: string;
  bank: string;
  product: string;
  buyer: string;
  totalAmount: number;
  interestRateYearly: number;
  durationMonths: number;
  purchaseDate: string;
  monthlyPayment: number;
  completed: boolean;
}

export interface CreditCardPurchase50Day {
  id: string;
  bank: string;
  item: string;
  amount: number;
  purchaseDate: string;
  completed: boolean;
}

export interface Loan {
  id: string;
  bank: string;
  amount: number;
  durationMonths: number;
  interestRateYearly: number;
  startDate: string;
  completed: boolean;
  monthlyPayment: number;
}

export interface Investment {
  id: string;
  entity: string; 
  amount: number;
  startDate: string;
  endDate: string;
  dividendPercentage: number;
  payoutFrequency: 'Monthly' | 'Yearly';
  payoutDay: number;
}

export interface FinancialState {
  income: Income;
  monthlyExpenses: MonthlyExpense;
  ccInstallments: CreditCardInstallment;
  ccPurchases50Day: CreditCardPurchase50Day;
  loans: Loan;
  investments: Investment;
  targetSavings: {
    targetAmount: number;
    currentAmount: number;
    startDate: string;
    endDate: string;
  };
}
