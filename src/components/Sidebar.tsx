import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  CalendarClock, 
  TrendingUp, 
  Landmark, 
  CreditCard, 
  FileText, 
  PieChart, 
  Settings as SettingsIcon, 
  History,
  ShieldCheck,
  ChevronRight,
  Database,
  Moon,
  Sun,
  RefreshCw,
  Plus,
  CloudCog,
  ArrowDownLeft,
  User
} from 'lucide-react';
import { PageView } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/Shared';

interface SidebarProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  isOpen: boolean;
  onClose: () => void;
  user: { name: string };
}

export const Sidebar = ({ activePage, onNavigate, isOpen, onClose, user }: SidebarProps) => {
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'monthly', label: 'Fiscal Planner', icon: CalendarClock },
    { id: 'income', label: 'Income Assets', icon: TrendingUp },
    { id: 'loans', label: 'Bank Facilities', icon: Landmark },
    { id: 'ccinstall', label: 'CC Matrix', icon: CreditCard },
    { id: 'cconetime', label: 'Direct Debits', icon: FileText },
    { id: 'cheques', label: 'Cheque Ledger', icon: History },
    { id: 'expenses', label: 'Cost Allocation', icon: PieChart },
    { id: 'targets', label: 'Asset Goals', icon: ShieldCheck },
    { id: 'balance', label: 'Capital Flow', icon: Database },
    { id: 'dscr', label: 'Loan Eligibility', icon: User },
    { id: 'settings', label: 'System Prefs', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        'fixed top-0 left-0 bottom-0 w-[280px] bg-slate-50 border-r border-slate-200 z-[100] transition-transform duration-300 transform flex flex-col',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 border-b border-slate-200 space-y-1 bg-white shrink-0">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold tracking-tighter uppercase shadow-sm">
                      <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                   </div>
                   <h1 className="text-xl font-bold text-slate-800 tracking-tight">Wealth<span className="text-blue-600">Flow</span></h1>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-11">Enterprise</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id as PageView); onClose(); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded transition-all duration-200 group text-sm font-semibold',
                  activePage === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                    : 'text-slate-600 hover:text-slate-900 border border-transparent hover:bg-slate-100/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn('transition-transform', activePage === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-slate-200 bg-white shrink-0">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                   <User size={18} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cloud Connected</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Header = ({ 
  onOpenSidebar, 
  isOnline, 
  theme, 
  onToggleTheme, 
  onRefresh, 
  onAddClick 
}: {
  onOpenSidebar: () => void;
  isOnline: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onRefresh: () => void;
  onAddClick: () => void;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 lg:px-8 h-16 flex items-center">
      <div className="w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors">
            <Menu size={24} />
          </button>
          <div className="hidden lg:flex items-center gap-3">
             <div className={cn('flex items-center gap-2 px-3 py-1 bg-slate-50 rounded border border-slate-200 text-xs font-semibold transition-colors text-slate-500',
             )}>
                <div className={cn('w-1.5 h-1.5 rounded-full transition-colors', isOnline ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span className="text-slate-400 font-normal">Sync Status:</span> {isOnline ? 'Online' : 'Offline Mode'}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-1.5 rounded border border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
          </button>
          
          <button 
             onClick={onToggleTheme}
             className="p-1.5 rounded border border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
             <Sun size={16} />
          </button>

          <button onClick={onAddClick} className="ml-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus size={14} className="" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
