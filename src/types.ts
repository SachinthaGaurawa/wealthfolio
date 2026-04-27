export type PageView = 
  | 'dashboard' | 'monthly' | 'income' | 'loans' 
  | 'ccinstall' | 'cconetime' | 'cheques' | 'expenses' 
  | 'targets' | 'balance' | 'dscr' | 'settings';

export interface IncomeSource {
  id: string;
  name: string;
  company: string;
  amount: number;
  rate: number;
  monthly: number;
  freq: 'monthly' | 'annual';
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  amount: number;
  monthly: number;
  term: number;
  remaining: number;
  start: string;
}

export interface CCInstallment {
  id: string;
  bank: string;
  name: string;
  total: number;
  monthly: number;
  current: number;
  months: number;
  completed: boolean;
  skippedMonths: string[]; // Logic for doubling next month
}

export interface CCOneTime {
  id: string;
  bank: string;
  desc: string;
  amount: number;
  deadline: string;
  completed: boolean;
}

export interface Cheque {
  id: string;
  party: string;
  bank: string;
  no: string;
  amount: number;
  issue: string; // Issued Date
  release: string; // Release Date
  type: 'issued' | 'received';
  status: 'pending' | 'cleared' | 'bounced';
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  cat: string;
  month: string;
  completed: boolean;
  recurring: boolean;
}

export interface Saving {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Target {
  id: string;
  name: string;
  amount: number;
  savings: Saving[];
  deadline: string;
  completed: boolean;
}

export interface BalanceFlow {
  id: string;
  company: string;
  amount: number;
  type: 'in' | 'out';
  date: string;
  notes?: string;
}

export interface AppData {
  income: IncomeSource[];
  loans: Loan[];
  ccinstall: CCInstallment[];
  cconetime: CCOneTime[];
  cheques: Cheque[];
  expenses: Expense[];
  targets: Target[];
  balance: {
    total: number;
    flows: BalanceFlow[];
  };
}

export interface Settings {
  theme: 'dark' | 'light';
  backupFreq: 'daily' | 'weekly' | 'monthly';
  lastBackup?: number;
  autoFormat: boolean;
  user: {
    name: string;
    email: string;
  };
}

export interface AuthData {
  pinHash: string | null;
  securityQuestion: string;
  securityAnswerHash: string | null;
  recoveryCode: string | null;
  lastLogin: number | null;
}
