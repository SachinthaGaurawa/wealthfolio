import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { differenceInDays, parseISO, addDays } from 'date-fns';
import {
    Lock, Unlock, LayoutDashboard, Wallet, TrendingUp,
    CreditCard, Target, PieChart as PieChartIcon, CheckCircle2,
    AlertCircle, LogOut, Plus, ShieldCheck, Banknote
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { formatCurrency, calculateEMI, encodeData, decodeData } from './utils/financeUtils';
import ConfirmModal from './components/ConfirmModal';

// --- INITIAL STATE STRUCTURE ---
const INITIAL_DATA = {
    cashBalance: 0,
    incomes:,           // Regular monthly incomes
    investments:,       // Dividends & Capital deployments
    loans:,             // Bank loans (EMI)
    ccInstallments:,    // Credit Card Installment payments
    ccGracePeriods:,    // 50-day Supermarket/Medicine payments
    otherExpenses:,     // Daily/Regular expenses
    targets:,           // Countdown goals
    completedTasks:     // History of confirmed payments/tasks
};

// --- BANK OPTIONS ---
const BANK_OPTIONS =;

export default function App() {
    // 1. System States
    const [isLocked, setIsLocked] = useState(true);
    const = useState(false);
    const = useState(false);

    // 2. Input States
    const [passcode, setPasscode] = useState('');
    const = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // 3. Application States
    const = useState('dashboard');
    const = useState(INITIAL_DATA);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: null });

    // --- BOOTSTRAP & HYDRATION ---
    useEffect(() => {
        const storedPass = localStorage.getItem('wealthfolio_pass');
        if (!storedPass) {
            setIsSetup(true);
        }
    },);

    useEffect(() => {
        if (!isLocked) {
            const storedData = localStorage.getItem('wealthfolio_data');
            if (storedData) {
                try {
                    // Merge stored data with initial structure to prevent missing keys on updates
                    setData({ ...INITIAL_DATA, ...decodeData(storedData) });
                } catch (e) {
                    console.error("Data corruption detected during hydration.", e);
                }
            }
        }
    }, [isLocked]);

    useEffect(() => {
        if (!isLocked) {
            localStorage.setItem('wealthfolio_data', encodeData(data));
        }
    }, [data, isLocked]);

    // --- AUTHENTICATION HANDLERS ---
    const handleSetup = (e) => {
        e.preventDefault();
        if (passcode.length < 4) {
            setErrorMsg("Passcode requires a minimum of 4 digits.");
            return;
        }
        if (securityAnswer.length < 3) {
            setErrorMsg("A valid security answer is required for recovery.");
            return;
        }
        localStorage.setItem('wealthfolio_pass', btoa(passcode));
        localStorage.setItem('wealthfolio_recovery', btoa(securityAnswer.toLowerCase().trim()));
        setIsSetup(false);
        setIsLocked(false);
        setPasscode('');
        setSecurityAnswer('');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const storedPass = atob(localStorage.getItem('wealthfolio_pass'));
        if (passcode === storedPass) {
            setIsLocked(false);
            setErrorMsg('');
        } else {
            setErrorMsg("Authentication failed. Incorrect passcode.");
        }
        setPasscode('');
    };

    const handleRecovery = (e) => {
        e.preventDefault();
        const storedRec = atob(localStorage.getItem('wealthfolio_recovery'));
        if (securityAnswer.toLowerCase().trim() === storedRec) {
            localStorage.removeItem('wealthfolio_pass');
            setRecoveryMode(false);
            setIsSetup(true);
            setErrorMsg("Identity verified. Please configure a new passcode.");
        } else {
            setErrorMsg("Identity verification failed.");
        }
        setSecurityAnswer('');
    };

    // --- DATA MUTATION METHODS ---
    const updateBalance = (amount, operation) => {
        const val = parseFloat(amount);
        if (isNaN(val)) return;
        setData(prev => ({
            ...prev,
            cashBalance: operation === 'add' ? prev.cashBalance + val : prev.cashBalance - val
        }));
    };

    const executeWithConfirmation = (title, message, callback) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            action: () => {
                callback();
                setModalConfig({ isOpen: false });
            }
        });
    };

    // --- TAB CONTENT RENDERERS ---

    const renderDashboard = () => {
        // Projections & Aggregations
        const monthlyIncome = data.incomes.reduce((acc, inc) => acc + inc.amount, 0) +
            data.investments.filter(inv => inv.frequency === 'Monthly').reduce((acc, inv) => acc + inv.dividend, 0);

        let monthlyLoanEMI = 0;
        data.loans.forEach(l => monthlyLoanEMI += calculateEMI(l.amount, l.interest, l.duration));

        let monthlyCCInstallments = 0;
        data.ccInstallments.forEach(cc => monthlyCCInstallments += calculateEMI(cc.amount, cc.interest, cc.duration));

        const regularExpenses = data.otherExpenses.reduce((acc, exp) => acc + exp.amount, 0);

        const totalExpenses = monthlyLoanEMI + monthlyCCInstallments + regularExpenses;
        const netCashFlow = monthlyIncome - totalExpenses;

        // Chart Data Preparation
        const expenseChartData =.filter(item => item.value > 0);

        const COLORS = ['#6366f1', '#ec4899', '#14b8a6'];

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-2xl border-t-4 border-t-indigo-500">
                        <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">Liquid Cash Balance</h3>
                        <p className="text-4xl font-extrabold text-slate-800">{formatCurrency(data.cashBalance)}</p>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border-t-4 border-t-emerald-500">
                        <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">Projected Monthly Inflow</h3>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(monthlyIncome)}</p>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border-t-4 border-t-pink-500">
                        <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">Projected Monthly Outflow</h3>
                        <p className="text-3xl font-bold text-pink-600">{formatCurrency(totalExpenses)}</p>
                        <p className={`text-sm mt-2 font-medium ${netCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            Net Flow: {formatCurrency(netCashFlow)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Balance Update */}
                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Wallet size={20} className="text-indigo-500" /> Adjust Ledger Balance
                        </h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            updateBalance(e.target.amount.value, e.target.type.value);
                            e.target.reset();
                        }} className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <input type="number" name="amount" required placeholder="Enter Amount" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                <select name="type" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="add">Deposit (+)</option>
                                    <option value="subtract">Withdraw (-)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-semibold transition-colors">
                                Commit Transaction
                            </button>
                        </form>
                    </div>

                    {/* Expense Visualization */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 w-full text-left">Expense Distribution</h3>
                        {expenseChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={expenseChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {expenseChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-400">Insufficient data to render visualization.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderIncome = () => {
        const handleAddInvestment = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const amount = parseFloat(fd.get('amount'));

            if (amount > data.cashBalance) {
                alert("Transaction Failed: Investment amount exceeds current liquid cash balance.");
                return;
            }

            executeWithConfirmation(
                "Deploy Capital",
                `Deduct ${formatCurrency(amount)} from cash balance to fund this investment in ${fd.get('company')}?`,
                () => {
                    const newInv = {
                        id: Date.now(),
                        company: fd.get('company'),
                        amount: amount,
                        date: fd.get('date'),
                        endDate: fd.get('endDate'),
                        dividend: parseFloat(fd.get('dividend')),
                        frequency: fd.get('frequency'),
                        payoutDay: fd.get('payoutDay')
                    };
                    setData(prev => ({
                        ...prev,
                        cashBalance: prev.cashBalance - amount,
                        investments: [...prev.investments, newInv]
                    }));
                    e.target.reset();
                }
            );
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Register Capital Investment</h3>
                    <form onSubmit={handleAddInvestment} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <input type="text" name="company" required placeholder="Company / Entity" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input type="number" name="amount" required placeholder="Invested Amount (LKR)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 ml-1 mb-1">Investment Date</label>
                            <input type="date" name="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 ml-1 mb-1">Maturity / End Date</label>
                            <input type="date" name="endDate" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 ml-1 mb-1">Dividend Frequency</label>
                            <select name="frequency" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                                <option value="Monthly">Monthly</option>
                                <option value="Annually">Annually</option>
                            </select>
                        </div>
                        <input type="number" name="dividend" required placeholder="Dividend Return Amount" className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-5 md:mt-0" />
                        <input type="number" name="payoutDay" min="1" max="31" required placeholder="Payout Day (1-31)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />

                        <button type="submit" className="md:col-span-2 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg shadow-emerald-200 transition-all">
                            Initialize Investment & Deduct Balance
                        </button>
                    </form>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Active Investment Portfolio</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm tracking-wide">
                                    <th className="p-4 rounded-tl-xl">Entity</th>
                                    <th className="p-4">Capital</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4">Yield</th>
                                    <th className="p-4 rounded-tr-xl">Schedule</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {data.investments.map(inv => (
                                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-900">{inv.company}</td>
                                        <td className="p-4">{formatCurrency(inv.amount)}</td>
                                        <td className="p-4 text-sm">{inv.date} to {inv.endDate}</td>
                                        <td className="p-4 font-medium text-emerald-600">{formatCurrency(inv.dividend)}</td>
                                        <td className="p-4 text-sm">{inv.frequency} (Day {inv.payoutDay})</td>
                                    </tr>
                                ))}
                                {data.investments.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No capital currently deployed.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderDebt = () => {
        const handleAddCCInstallment = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const newInst = {
                id: Date.now(),
                type: 'cc',
                bank: fd.get('bank'),
                product: fd.get('product'),
                buyer: fd.get('buyer'),
                amount: parseFloat(fd.get('amount')),
                interest: parseFloat(fd.get('interest')),
                duration: parseInt(fd.get('duration')),
                purchaseDate: fd.get('date')
            };
            setData(prev => ({ ...prev, ccInstallments: [...prev.ccInstallments, newInst] }));
            e.target.reset();
        };

        const handleAddCCGrace = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const newGrace = {
                id: Date.now(),
                bank: fd.get('bank'),
                product: fd.get('product'),
                amount: parseFloat(fd.get('amount')),
                purchaseDate: fd.get('date'),
                isPaid: false
            };
            setData(prev => ({ ...prev, ccGracePeriods: [...prev.ccGracePeriods, newGrace] }));
            e.target.reset();
        };

        const handleMarkGracePaid = (id, amount) => {
            executeWithConfirmation(
                "Settle Credit Card Liability",
                `Deduct ${formatCurrency(amount)} from your liquid balance to settle this specific transaction?`,
                () => {
                    setData(prev => ({
                        ...prev,
                        cashBalance: prev.cashBalance - amount,
                        ccGracePeriods: prev.ccGracePeriods.map(c => c.id === id ? { ...c, isPaid: true } : c),
                        completedTasks:
          }));
                }
            );
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">

                {/* 50-DAY GRACE PERIOD ENGINE */}
                <div className="glass-card p-6 rounded-2xl border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-orange-500" size={24} />
                        <h3 className="text-xl font-bold text-slate-800">50-Day Interest-Free Period Tracking</h3>
                    </div>
                    <p className="text-slate-500 mb-6 text-sm">Monitor non-installment credit card purchases (e.g., supermarket, medical) to avoid interest capitalization. Payments must be settled within 50 days.</p>

                    <form onSubmit={handleAddCCGrace} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
                        <select name="bank" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Select Bank</option>
                            {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input type="text" name="product" required placeholder="Description / Product" className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        <input type="number" name="amount" required placeholder="Amount" className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        <input type="date" name="date" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-slate-600" />
                        <button type="submit" className="py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-md">Add Tracker</button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {data.ccGracePeriods.filter(c => !c.isPaid).map(item => {
                            // Mathematical calculation of remaining days
                            const pDate = new Date(item.purchaseDate);
                            const dueDate = addDays(pDate, 50);
                            const daysLeft = differenceInDays(dueDate, new Date());

                            // Conditional styling thresholds
                            const isOverdue = daysLeft < 0;
                            const isCritical = daysLeft <= 10 && !isOverdue;

                            let cardStyle = "bg-white border-slate-200";
                            let textStyle = "text-slate-600";
                            let statusText = `${daysLeft} Days Remaining`;

                            if (isOverdue) {
                                cardStyle = "bg-red-50 border-red-300";
                                textStyle = "text-red-600 font-bold";
                                statusText = `${Math.abs(daysLeft)} Days OVERDUE`;
                            } else if (isCritical) {
                                cardStyle = "bg-orange-50 border-orange-300";
                                textStyle = "text-orange-600 font-bold";
                            }

                            return (
                                <div key={item.id} className={`p-5 rounded-xl border shadow-sm flex flex-col ${cardStyle}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.product}</h4>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Banknote size={12} /> {item.bank}</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800">{formatCurrency(item.amount)}</span>
                                    </div>

                                    <div className={`mt-auto mb-4 text-sm ${textStyle}`}>
                                        {statusText}
                                        {isCritical && <span className="block text-xs mt-1 animate-pulse">Immediate action required!</span>}
                                    </div>

                                    <button
                                        onClick={() => handleMarkGracePaid(item.id, item.amount)}
                                        className="mt-auto w-full py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 flex justify-center items-center gap-2 transition-colors"
                                    >
                                        <CheckCircle2 size={18} /> Settle from Balance
                                    </button>
                                </div>
                            );
                        })}
                        {data.ccGracePeriods.filter(c => !c.isPaid).length === 0 && (
                            <p className="text-slate-400 italic text-sm">No pending short-term credit purchases.</p>
                        )}
                    </div>
                </div>

                {/* CREDIT CARD INSTALLMENTS */}
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Log Credit Card Installment Plan</h3>
                    <form onSubmit={handleAddCCInstallment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select name="bank" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <option value="">Select Bank</option>
                            {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input type="text" name="product" required placeholder="Product Name" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input type="text" name="buyer" required placeholder="Buyer / Assignee" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input type="date" name="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600" />
                        <input type="number" name="amount" required placeholder="Total Amount" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input type="number" name="interest" step="0.1" required placeholder="Yearly Interest (%)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                        <input type="number" name="duration" required placeholder="Duration (Months)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl" />

                        <button type="submit" className="py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-md">
                            Calculate & Add EMI
                        </button>
                    </form>

                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm tracking-wide">
                                    <th className="p-4 rounded-tl-xl">Bank & Product</th>
                                    <th className="p-4">Principal</th>
                                    <th className="p-4">Interest (Y)</th>
                                    <th className="p-4">Tenure</th>
                                    <th className="p-4 rounded-tr-xl">Monthly EMI</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {data.ccInstallments.map(inst => (
                                    <tr key={inst.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-900">{inst.product}</div>
                                            <div className="text-xs text-slate-500">{inst.bank} • {inst.buyer}</div>
                                        </td>
                                        <td className="p-4">{formatCurrency(inst.amount)}</td>
                                        <td className="p-4">{inst.interest}%</td>
                                        <td className="p-4">{inst.duration} mos</td>
                                        <td className="p-4 font-bold text-pink-600">{formatCurrency(calculateEMI(inst.amount, inst.interest, inst.duration))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        );
    };

    const renderTargets = () => {
        const handleAddTarget = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const newTarget = {
                id: Date.now(),
                title: fd.get('title'),
                targetAmount: parseFloat(fd.get('targetAmount')),
                savedAmount: 0,
                startDate: fd.get('startDate'),
                endDate: fd.get('endDate')
            };
            setData(prev => ({ ...prev, targets: }));
            e.target.reset();
        };

        const handleAllocate = (id, amount) => {
            if (amount > data.cashBalance) {
                alert("Transaction Failed: Allocation exceeds available liquid cash.");
                return;
            }

            const target = data.targets.find(t => t.id === id);
            executeWithConfirmation(
                "Fund Savings Target",
                `Allocate ${formatCurrency(amount)} from your liquid balance to the goal "${target.title}"?`,
                () => {
                    let isComplete = false;
                    setData(prev => {
                        const newTargets = prev.targets.map(t => {
                            if (t.id === id) {
                                const newTotal = t.savedAmount + amount;
                                if (newTotal >= t.targetAmount) isComplete = true;
                                return { ...t, savedAmount: newTotal };
                            }
                            return t;
                        });
                        return {
                            ...prev,
                            cashBalance: prev.cashBalance - amount,
                            targets: newTargets
                        };
                    });

                    // Trigger physics engine if target is reached
                    if (isComplete) {
                        setTimeout(() => {
                            confetti({
                                particleCount: 200,
                                spread: 90,
                                origin: { y: 0.5 },
                                colors: ['#FFC107', '#4CAF50', '#03A9F4', '#E91E63']
                            });
                        }, 300);
                    }
                }
            );
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="glass-card p-6 rounded-2xl border-t-4 border-t-blue-500">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Initialize Saving Goal</h3>
                    <form onSubmit={handleAddTarget} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="title" required placeholder="Goal Title (e.g., Land Purchase)" className="p-3 border border-slate-200 rounded-xl" />
                        <input type="number" name="targetAmount" required placeholder="Target Amount (LKR)" className="p-3 border border-slate-200 rounded-xl" />
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 ml-1 mb-1">Start Date</label>
                            <input type="date" name="startDate" required className="p-3 border border-slate-200 rounded-xl text-slate-600" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 ml-1 mb-1">Target Date</label>
                            <input type="date" name="endDate" required className="p-3 border border-slate-200 rounded-xl text-slate-600" />
                        </div>
                        <button type="submit" className="md:col-span-2 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md tracking-wide">
                            Establish Financial Target
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {data.targets.map(target => {
                        const percentage = Math.min((target.savedAmount / target.targetAmount) * 100, 100);
                        const isFinished = percentage >= 100;

                        return (
                            <div key={target.id} className="glass-card p-8 rounded-2xl relative overflow-hidden group border border-slate-200">
                                {isFinished && (
                                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={14} /> Congratulations: Target Reached!
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                                    <div>
                                        <h4 className="text-3xl font-black text-slate-800">{target.title}</h4>
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Target Horizon: {target.endDate}</p>
                                    </div>
                                    <div className="text-left md:text-right w-full md:w-auto bg-slate-50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Master Target</p>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(target.targetAmount)}</p>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">
                                            Deficit: <span className="text-blue-600">{formatCurrency(target.targetAmount - target.savedAmount)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="w-full bg-slate-200 rounded-full h-6 mb-2 overflow-hidden shadow-inner relative">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2 ${isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    >
                                        {percentage > 5 && <span className="text-white text-[10px] font-bold">{percentage.toFixed(1)}%</span>}
                                    </div>
                                </div>

                                {!isFinished && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleAllocate(target.id, parseFloat(e.target.allocateAmt.value));
                                            e.target.reset();
                                        }}
                                        className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-slate-100"
                                    >
                                        <input type="number" name="allocateAmt" required placeholder="Amount to allocate" className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                                        <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-md transition-transform active:scale-95">
                                            Transfer Funds
                                        </button>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ROOT ---
    return (
        <>
            {isLocked ? (
                // LOCK SCREEN VIEW
                <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
                    <div className="glass-card p-10 rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-center mb-8">
                            <div className="p-5 bg-indigo-500/10 rounded-2xl">
                                <Lock className="text-indigo-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-center text-slate-800 mb-8 tracking-tight">
                            {isSetup ? 'System Initialization' : recoveryMode ? 'Account Recovery' : 'Wealthfolio Login'}
                        </h2>

                        {errorMsg && (
                            <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}

                        {recoveryMode ? (
                            <form onSubmit={handleRecovery} className="space-y-5">
                                <div>
                                    <label className="text-slate-600 font-semibold text-sm ml-1">Security Verification: What is your favorite city?</label>
                                    <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="w-full mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none" placeholder="Security Answer" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg">Verify Identity</button>
                                <button type="button" onClick={() => setRecoveryMode(false)} className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 mt-2">Back to Login</button>
                            </form>
                        ) : isSetup ? (
                            <form onSubmit={handleSetup} className="space-y-5">
                                <div>
                                    <label className="text-slate-600 font-semibold text-sm ml-1">Define Master Passcode</label>
                                    <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-center text-3xl tracking-[0.5em] font-mono" maxLength={8} />
                                </div>
                                <div>
                                    <label className="text-slate-600 font-semibold text-sm ml-1">Recovery Question: What is your favorite city?</label>
                                    <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="w-full mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none" placeholder="Security Answer" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg">Secure & Initialize System</button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-center text-3xl tracking-[0.5em] font-mono" maxLength={8} autoFocus placeholder="••••" />
                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg">Unlock Dashboard</button>
                                <div className="text-center">
                                    <button type="button" onClick={() => setRecoveryMode(true)} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Forgot Passcode?</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                // DASHBOARD VIEW
                <div className="flex h-screen overflow-hidden bg-slate-100">
                    {/* Main Navigation Sidebar */}
                    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                        <div className="p-8 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Wealthfolio</h1>
                        </div>

                        <nav className="flex-1 px-4 space-y-2 mt-4">
                            {.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 font-semibold ${activeTab === item.id
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <item.icon size={20} className={activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="p-6 border-t border-slate-100">
                            <button onClick={() => setIsLocked(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 font-bold hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-200 hover:border-transparent">
                                <Lock size={18} /> Lock System
                            </button>
                        </div>
                    </aside>

                    {/* Dynamic Content Area */}
                    <main className="flex-1 overflow-y-auto relative">
                        <header className="bg-white/80 backdrop-blur-md px-10 py-6 border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
                            <h2 className="text-2xl font-black text-slate-800 capitalize">
                                {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                            </h2>
                            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
                                <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Liquid Cap:</span>
                                <span className="text-lg font-black text-emerald-600">{formatCurrency(data.cashBalance)}</span>
                            </div>
                        </header>

                        <div className="p-10 max-w-[1600px] mx-auto pb-24">
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'income' && renderIncome()}
                            {activeTab === 'debt' && renderDebt()}
                            {activeTab === 'targets' && renderTargets()}
                        </div>
                    </main>

                    {/* Global Task Confirmation Modal */}
                    <ConfirmModal
                        isOpen={modalConfig.isOpen}
                        title={modalConfig.title}
                        message={modalConfig.message}
                        onConfirm={modalConfig.action}
                        onCancel={() => setModalConfig({ isOpen: false })}
                    />
                </div>
            )}
        </>
    );
}
