import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { AppData, Settings, AuthData, PageView, CCInstallment } from '../types';
import { uid, today, curMonth, nextMonth } from '../lib/utils';

const firebaseConfig = {
  apiKey: "AIzaSyBpIRHoNQJTeMIVYime_oVjBXiQWNH18K4",
  authDomain: "wealthflow-6dffb.firebaseapp.com",
  projectId: "wealthflow-6dffb",
  storageBucket: "wealthflow-6dffb.firebasestorage.app",
  messagingSenderId: "1020193373377",
  appId: "1:1020193373377:web:52ae0662d35b02037f6840",
  measurementId: "G-FKEKQGG8MZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_DATA: AppData = {
  income: [],
  loans: [],
  ccinstall: [],
  cconetime: [],
  cheques: [],
  expenses: [],
  targets: [],
  balance: { total: 0, flows: [] }
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  backupFreq: 'monthly',
  autoFormat: true,
  user: { name: 'Sachintha Gaurawa', email: 'gaurawasachintha@gmail.com' }
};

export function useWealthFlow() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');

  const userId = 'gaurawasachintha'; // Using fixed business ID as per requirements

  // Setup Real-time Listeners
  useEffect(() => {
    const dataRef = doc(db, 'wealthflow', userId);
    const settingsRef = doc(db, 'settings', userId);
    const authRef = doc(db, 'auth', userId);

    const unsubData = onSnapshot(dataRef, (snap) => {
      if (snap.exists()) {
        setData(snap.data() as AppData);
      } else {
        setDoc(dataRef, DEFAULT_DATA);
      }
      setIsLoading(false);
    });

    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) setSettings(snap.data() as Settings);
      else setDoc(settingsRef, DEFAULT_SETTINGS);
    });

    const unsubAuth = onSnapshot(authRef, (snap) => {
      if (snap.exists()) setAuthData(snap.data() as AuthData);
    });

    return () => { unsubData(); unsubSettings(); unsubAuth(); };
  }, []);

  // Persist Changes helper
  const persist = useCallback((newData: AppData) => {
    setSyncStatus('syncing');
    setDoc(doc(db, 'wealthflow', userId), newData)
      .then(() => setSyncStatus('online'))
      .catch(() => setSyncStatus('offline'));
  }, []);

  const saveSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setDoc(doc(db, 'settings', userId), updated);
  }, [settings]);

  const saveSecurity = useCallback((newAuth: AuthData) => {
    setDoc(doc(db, 'auth', userId), newAuth);
  }, []);

  // Data Mutators
  const addIncome = (item: any) => {
    const newData = { ...data, income: [...data.income, { ...item, id: uid() }] };
    persist(newData);
  };

  const editIncome = (id: string, item: any) => {
    const newData = { ...data, income: data.income.map(x => x.id === id ? { ...item, id } : x) };
    persist(newData);
  };

  const deleteIncome = (id: string) => {
    const newData = { ...data, income: data.income.filter(x => x.id !== id) };
    persist(newData);
  };

  const addLoan = (item: any) => {
    const newData = { ...data, loans: [...data.loans, { ...item, id: uid() }] };
    persist(newData);
  };

  const editLoan = (id: string, item: any) => {
    const newData = { ...data, loans: data.loans.map(x => x.id === id ? { ...item, id } : x) };
    persist(newData);
  };

  const deleteLoan = (id: string) => {
    const newData = { ...data, loans: data.loans.filter(x => x.id !== id) };
    persist(newData);
  };

  const addCCI = (item: any) => {
    const newData = { ...data, ccinstall: [...data.ccinstall, { ...item, id: uid(), skippedMonths: [], completed: false }] };
    persist(newData);
  };

  const deleteCCI = (id: string) => {
    const newData = { ...data, ccinstall: data.ccinstall.filter(x => x.id !== id) };
    persist(newData);
  };

  const markCCIDone = (id: string) => {
    const newData = { ...data, ccinstall: data.ccinstall.map(x => {
      if (x.id === id) {
        const next = x.current + 1;
        return { ...x, current: next, completed: next >= x.months };
      }
      return x;
    })};
    persist(newData);
  };

  const skipCCI = (id: string, month: string) => {
    const newData = { ...data, ccinstall: data.ccinstall.map(x => {
      if (x.id === id) {
        return { ...x, skippedMonths: [...(x.skippedMonths || []), month] };
      }
      return x;
    })};
    persist(newData);
  };

  const addCCOT = (item: any) => {
    const newData = { ...data, cconetime: [...data.cconetime, { ...item, id: uid(), completed: false }] };
    persist(newData);
  };

  const markCCOTPaid = (id: string) => {
    const newData = { ...data, cconetime: data.cconetime.map(x => x.id === id ? { ...x, completed: !x.completed } : x) };
    persist(newData);
  };

  const deleteCCOT = (id: string) => {
    const newData = { ...data, cconetime: data.cconetime.filter(x => x.id !== id) };
    persist(newData);
  };

  const addCheque = (item: any) => {
    const newData = { ...data, cheques: [...data.cheques, { ...item, id: uid() }] };
    persist(newData);
  };

  const updateCheque = (id: string, status: any) => {
    const newData = { ...data, cheques: data.cheques.map(x => x.id === id ? { ...x, status } : x) };
    persist(newData);
  };

  const deleteCheque = (id: string) => {
    const newData = { ...data, cheques: data.cheques.filter(x => x.id !== id) };
    persist(newData);
  };

  const addExpense = (item: any) => {
    const newData = { ...data, expenses: [...data.expenses, { ...item, id: uid(), completed: false }] };
    persist(newData);
  };

  const markExpensePaid = (id: string) => {
    const newData = { ...data, expenses: data.expenses.map(x => x.id === id ? { ...x, completed: !x.completed } : x) };
    persist(newData);
  };

  const deleteExpense = (id: string) => {
    const newData = { ...data, expenses: data.expenses.filter(x => x.id !== id) };
    persist(newData);
  };

  const addTarget = (item: any) => {
    const newData = { ...data, targets: [...data.targets, { ...item, id: uid(), savings: [], completed: false }] };
    persist(newData);
  };

  const addSaving = (tid: string, item: any) => {
    const newData = { ...data, targets: data.targets.map(t => {
      if (t.id === tid) {
        const newSavings = [...t.savings, { ...item, id: uid() }];
        const total = newSavings.reduce((s, x) => s + x.amount, 0);
        return { ...t, savings: newSavings, completed: total >= t.amount };
      }
      return t;
    })};
    persist(newData);
  };

  const deleteTarget = (id: string) => {
    const newData = { ...data, targets: data.targets.filter(x => x.id !== id) };
    persist(newData);
  };

  const deleteSaving = (tid: string, sid: string) => {
    const newData = { ...data, targets: data.targets.map(t => {
      if (t.id === tid) {
        const newSavings = t.savings.filter(s => s.id !== sid);
        const total = newSavings.reduce((s, x) => s + x.amount, 0);
        return { ...t, savings: newSavings, completed: total >= t.amount };
      }
      return t;
    })};
    persist(newData);
  };

  const setBalance = (total: number) => {
    const newData = { ...data, balance: { ...data.balance, total } };
    persist(newData);
  };

  const addBalFlow = (item: any) => {
    const newData = { ...data, balance: { ...data.balance, flows: [...data.balance.flows, { ...item, id: uid() }] } };
    persist(newData);
  };

  const deleteBalFlow = (id: string) => {
    const newData = { ...data, balance: { ...data.balance, flows: data.balance.flows.filter(x => x.id !== id) } };
    persist(newData);
  };

  const clearAll = () => {
    persist(DEFAULT_DATA);
  };

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return {
    data, settings, authData, isAuthenticated, isLoading, syncStatus,
    login, logout, saveSettings, saveSecurity,
    addIncome, editIncome, deleteIncome,
    addLoan, editLoan, deleteLoan,
    addCCI, deleteCCI, markCCIDone, skipCCI,
    addCCOT, markCCOTPaid, deleteCCOT,
    addCheque, updateCheque, deleteCheque,
    addExpense, markExpensePaid, deleteExpense,
    addTarget, addSaving, deleteTarget, deleteSaving,
    setBalance, addBalFlow, deleteBalFlow,
    clearAll
  };
}
