export interface IncomeSource {
  id: string;
  name: string;
  company: string;
  amount: number;
  rate: number;
  start: string;
  end?: string;
  freq: 'monthly' | 'annual' | 'quarterly';
  day: number;
  monthly: number;
  notes?: string;
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  amount: number;
  rate: number;
  duration: number;
  monthly: number;
  start: string;
  purpose?: string;
  notes?: string;
}

export interface CCInstallment {
  id: string;
  product: string;
  buyer: string;
  bank: string;
  total: number;
  rate: number;
  duration: number;
  monthly: number;
  date: string;
  notes?: string;
  completed: boolean;
  skipped: string[]; // YYYY-MM
}

export interface CCOneTime {
  id: string;
  desc: string;
  bank: string;
  type: 'purchase' | 'cash_advance';
  amount: number;
  date: string;
  deadline: string;
  notes?: string;
  paid: boolean;
}

export interface Cheque {
  id: string;
  no: string;
  party: string;
  bank: string;
  type: 'received' | 'issued';
  amount: number;
  issue: string;
  release: string;
  notes?: string;
  status: 'pending' | 'cleared' | 'bounced';
}

export interface Expense {
  id: string;
  desc: string;
  cat: string;
  amount: number;
  month: string; // YYYY-MM
  recurring: boolean;
  notes?: string;
  completed: boolean;
}

export interface Saving {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Target {
  id: string;
  name: string;
  amount: number;
  start: string;
  end: string;
  notes?: string;
  savings: Saving[];
}

export interface BalanceFlow {
  id: string;
  type: 'out' | 'in' | 'set';
  company: string;
  amount: number;
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
  lastBackup: number | null;
  autoBackup: boolean;
}

export interface AuthData {
  pin: string | null;
  secQ: string | null;
  secAHash: string | null;
  codeHash: string | null;
}
