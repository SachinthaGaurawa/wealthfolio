import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWealthFlow } from './hooks/useWealthFlow';
import { Sidebar, Header } from './components/Sidebar';
import { NotificationProvider, useNotification } from './components/ui/Notification';
import { Dashboard } from './components/Dashboard';
import { MonthlyPlan } from './components/MonthlyPlan';
import { IncomePage, LoansPage } from './components/Sections';
import { CCInstallmentsPage, CCOneTimePage } from './components/CCTracking';
import { ChequesPage, BalancePage } from './components/Tracking';
import { ExpensesPage, TargetsPage } from './components/PagesSet';
import { SettingsPage } from './components/SettingsPage';
import { DSCRCalculator } from './components/DSCRCalculator';
import { AppModals } from './components/AppModals';
import { LoginScreen, SetupScreen } from './components/auth/AuthScreens';
import { PageView } from './types';
import { today } from './lib/utils';

export default function App() {
  return (
    <NotificationProvider>
      <WealthFlowApp />
    </NotificationProvider>
  );
}

function WealthFlowApp() {
  const { 
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
  } = useWealthFlow();

  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  
  const { notify } = useNotification();

  const handleAdd = () => {
    const modalMap: Partial<Record<PageView, string>> = {
      income: 'income',
      loans: 'loan',
      ccinstall: 'ccinstall',
      cconetime: 'ccot',
      cheques: 'cheque',
      expenses: 'expense',
      targets: 'target',
      balance: 'balflow'
    };
    if (modalMap[activePage]) {
      setEditId(null);
      setActiveModal(modalMap[activePage]!);
    }
  };

  const handleSaveModal = (type: string, formData: any) => {
    try {
      if (type === 'income') editId ? editIncome(editId, formData) : addIncome(formData);
      else if (type === 'loan') editId ? editLoan(editId, formData) : addLoan(formData);
      else if (type === 'ccinstall') addCCI(formData);
      else if (type === 'ccot') addCCOT(formData);
      else if (type === 'cheque') addCheque(formData);
      else if (type === 'expense') addExpense(formData);
      else if (type === 'target') addTarget(formData);
      else if (type === 'saving') editId && addSaving(editId, formData);
      else if (type === 'balset') setBalance(formData.total);
      else if (type === 'balflow') addBalFlow(formData);
      
      notify('Success: Business ledger updated');
      setActiveModal(null);
      setEditId(null);
    } catch (e) {
      notify('Critical: Operation failed', 'error');
    }
  };

  const handleBackup = () => {
    const backup = { data, settings, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WealthFlow_Ledger_${today()}.json`;
    a.click();
    saveSettings({ lastBackup: Date.now() });
    notify('Ledger Backup Successful');
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.data) {
           // We would need to bulk persist this to Firestore
           // For now, let's notify user to contact system admin or implement bulk save
           notify('Manual recovery active. Please sync data.');
        }
      } catch (err) {
        notify('Recovery corrupted', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 gap-6">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-sm" />
        <p className="text-[10px] font-bold uppercase tracking-[8px] animate-pulse text-slate-500">Initializing WealthFlow</p>
      </div>
    );
  }

  if (!authData?.pinHash) {
    return <SetupScreen onComplete={saveSecurity} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen authData={authData} onLogin={login} onReset={() => setActiveModal('pin_reset')} />;
  }

  const PAGE_MAP: Record<PageView, React.ReactNode> = {
    dashboard: <Dashboard data={data} onNavigate={setActivePage} />,
    monthly: <MonthlyPlan data={data} />,
    income: <IncomePage income={data.income} onAdd={handleAdd} onEdit={(id) => { setEditId(id); setActiveModal('income'); }} onDelete={deleteIncome} />,
    loans: <LoansPage loans={data.loans} onAdd={handleAdd} onEdit={(id) => { setEditId(id); setActiveModal('loan'); }} onDelete={deleteLoan} />,
    ccinstall: <CCInstallmentsPage ccinstall={data.ccinstall} onAdd={handleAdd} onDelete={deleteCCI} onMarkDone={markCCIDone} onSkip={skipCCI} />,
    cconetime: <CCOneTimePage cconetime={data.cconetime} onAdd={handleAdd} onMarkPaid={markCCOTPaid} onDelete={deleteCCOT} />,
    cheques: <ChequesPage cheques={data.cheques} onUpdateStatus={updateCheque} onDelete={deleteCheque} onAdd={handleAdd} />,
    expenses: <ExpensesPage expenses={data.expenses} onAdd={handleAdd} onMarkPaid={markExpensePaid} onDelete={deleteExpense} />,
    targets: <TargetsPage targets={data.targets} onAdd={handleAdd} onAddSaving={id => { setEditId(id); setActiveModal('saving'); }} onDelete={deleteTarget} onDeleteSaving={deleteSaving} />,
    balance: <BalancePage balance={data.balance} onSetBalance={() => setActiveModal('balset')} onLogFlow={handleAdd} onDeleteFlow={deleteBalFlow} />,
    dscr: <DSCRCalculator />,
    settings: <SettingsPage 
                settings={settings} 
                onUpdate={saveSettings} 
                onBackup={handleBackup} 
                onRestore={handleRestore} 
                onClearAll={clearAll} 
                onLogout={logout} 
                onUpdatePin={() => setActiveModal('setup')}
                syncStatus={syncStatus}
                data={data}
              />
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        user={settings.user}
      />

      <div className="lg:ml-[280px]">
        <Header 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isOnline={syncStatus === 'online'}
          theme={settings.theme}
          onToggleTheme={() => saveSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
          onRefresh={() => window.location.reload()}
          onAddClick={handleAdd}
        />

        <main className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {PAGE_MAP[activePage]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AppModals 
        activeModal={activeModal} 
        onClose={() => { setActiveModal(null); setEditId(null); }} 
        onSave={handleSaveModal}
        editData={editId ? (
          data.income.find(x => x.id === editId) || 
          data.loans.find(x => x.id === editId) || 
          data.targets.find(x => x.id === editId)
        ) : null}
      />
    </div>
  );
}
