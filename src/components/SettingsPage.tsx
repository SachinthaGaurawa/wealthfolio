import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Cloud,
  ShieldCheck,
  Download,
  Upload,
  Lock,
  LogOut,
  ChevronRight,
  Database,
  Key,
  Smartphone,
  Trash2,
  FileText,
  RefreshCw,
  User,
  Monitor
} from 'lucide-react';
import { Card, Button, Badge, Input, Select } from './ui/Shared';
import { Settings, AppData } from '../types';
import { cn, today } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const SettingsPage = ({ 
  settings, 
  onUpdate, 
  onBackup, 
  onRestore, 
  onClearAll, 
  onLogout,
  onUpdatePin,
  syncStatus,
  data
}: {
  settings: Settings,
  onUpdate: (s: Partial<Settings>) => void,
  onBackup: () => void,
  onRestore: (file: File) => void,
  onClearAll: () => void,
  onLogout: () => void,
  onUpdatePin: () => void,
  syncStatus: 'online' | 'offline' | 'syncing',
  data: AppData
}) => {
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().substr(0, 7));

  const handlePdfExport = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('WealthFlow Financial Statement', 14, 20);
    doc.setFontSize(10);
    doc.text(`User: ${settings.user.name} | Period: ${exportMonth}`, 14, 30);
    
    // Summary
    const income = data.income.reduce((s,x) => s+x.monthly, 0);
    doc.text(`Total Monthly Income: LKR ${income.toLocaleString()}`, 14, 40);

    const exp = data.expenses.filter(e => e.month === exportMonth);
    doc.autoTable({
      startY: 50,
      head: [['Category', 'Description', 'Amount', 'Status']],
      body: exp.map(e => [e.cat, e.desc, e.amount.toLocaleString(), e.completed ? 'Paid' : 'Pending']),
    });

    doc.save(`WealthFlow_Statement_${exportMonth}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32">
      {/* Profile & Sync */}
      <div className="flex flex-col md:flex-row gap-6">
         <Card className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500 overflow-hidden">
                  <User size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase italic italic tracking-tighter">{settings.user.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[3px]">{settings.user.email}</p>
               </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                   <div className="flex items-center gap-3">
                      <Cloud size={16} className={syncStatus === 'online' ? 'text-emerald-500' : 'text-slate-500'} />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Cloud Pulse</span>
                   </div>
                   <Badge variant={syncStatus === 'online' ? 'green' : syncStatus === 'syncing' ? 'blue' : 'red'}>
                      {syncStatus.toUpperCase()}
                   </Badge>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                   <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-blue-500" />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Multi-Device Sync</span>
                   </div>
                   <Badge variant="blue">ACTIVE</Badge>
                </div>
            </div>
         </Card>

         <Card className="w-full md:w-80 space-y-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Device Identity</h4>
            <div className="space-y-4">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-600 font-bold uppercase">System Kernel</span>
                  <span className="text-xs text-slate-300 font-mono">v3.2.0-ELITE</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-600 font-bold uppercase">Architecture</span>
                  <span className="text-xs text-slate-300 font-mono">Responsive React Engine</span>
               </div>
               <Button variant="secondary" className="w-full h-10 text-[10px] uppercase font-black tracking-widest" onClick={onUpdatePin}>
                  <Lock size={14} className="mr-2" /> Rotate Access PIN
               </Button>
            </div>
         </Card>
      </div>

      {/* Backup & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="space-y-6 border-l-4 border-blue-500">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[4px] flex items-center gap-2">
               <Database size={14} /> Data Archival
            </h4>
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Auto-Backup Frequency</label>
                        <Select value={settings.backupFreq} onChange={e => onUpdate({ backupFreq: e.target.value as any })}>
                           <option value="daily">Daily Internal Sync</option>
                           <option value="weekly">Weekly Checklist</option>
                           <option value="monthly">Monthly Snapshot</option>
                        </Select>
                     </div>
                     <div className="space-y-1 flex flex-col justify-end">
                        <span className="text-[9px] text-slate-600 font-bold uppercase">Last Verification</span>
                        <span className="text-xs text-slate-400">{settings.lastBackup ? new Date(settings.lastBackup).toLocaleString() : 'System New'}</span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="secondary" size="sm" className="flex-1" onClick={onBackup}>
                        <Download size={14} className="mr-2" /> Raw JSON
                     </Button>
                     <Button variant="secondary" size="sm" className="flex-1 relative">
                        <Upload size={14} className="mr-2" /> Restore
                        <input 
                           type="file" 
                           className="absolute inset-0 opacity-0 cursor-pointer" 
                           accept=".json"
                           onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) onRestore(file);
                           }}
                        />
                     </Button>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="space-y-6 border-l-4 border-blue-500">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[4px] flex items-center gap-2">
               <FileText size={14} /> Financial Intelligence Export
            </h4>
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Select Target Period</label>
                  <Input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)} />
               </div>
               <div className="flex gap-2">
                  <Button variant="primary" className="flex-1" size="sm" onClick={handlePdfExport}>
                     <Download size={14} className="mr-2" /> Professional PDF
                  </Button>
                  <Button variant="secondary" className="flex-1" size="sm" onClick={() => onBackup()}>
                     <Download size={14} className="mr-2" /> Ledger CSV/JSON
                  </Button>
               </div>
               <p className="text-[10px] text-slate-600 italic">"PDF export generates a stylized balance sheet for your chosen month."</p>
            </div>
         </Card>
      </div>

      {/* DANGER ZONE */}
      <div className="pt-12 border-t border-red-500/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center sm:text-left">
           <p className="text-xs font-black text-red-500 uppercase tracking-widest">Destructive Operations</p>
           <p className="text-[10px] text-slate-600 font-bold uppercase italic">These actions are irreversible. Proceed with extreme caution.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20" onClick={() => { if(confirm('SURE? ALL DATA GONE.')) onClearAll() }}>
             <Trash2 size={16} className="mr-2" /> Wipe System Data
           </Button>
           <Button variant="ghost" className="text-slate-800 bg-slate-100/50 hover:bg-slate-200" onClick={onLogout}>
             <LogOut size={16} className="mr-2" /> Lock Application
           </Button>
        </div>
      </div>
    </div>
  );
};
