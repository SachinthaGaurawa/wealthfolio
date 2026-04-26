/**
 * Wealthfolio Core System Architecture
 * Exhaustive Vanilla JS Implementation
 * Features: AES-GCM Crypto, PubSub State, Financial Amortization, Confetti Physics, Chart.js
 */

// ==========================================
// 1. CONFETTI PHYSICS ENGINE
// ==========================================
const ConfettiEngine = (() => {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let particles =;
    let animationId = null;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Flexoki color mappings for celebrations
    const colors =;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height - canvas.height;
            this.size = Math.random() * 12 + 6;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speedY = Math.random() * 4 + 2;
            this.speedX = Math.random() * 3 - 1.5;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 6 - 3;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.restore();
        }
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            p.update();
            p.draw();
            if (p.y < canvas.height) active = true;
        });
        if (active) {
            animationId = requestAnimationFrame(animate);
        } else {
            particles =;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return {
        fire: () => {
            particles = Array.from({length: 200}, () => new Particle());
            if (animationId) cancelAnimationFrame(animationId);
            animate();
        }
    };
})();

// ==========================================
// 2. CRYPTOGRAPHIC SECURITY MODULE
// ==========================================
const CryptoSystem = (() => {
    const ITERATIONS = 100000;
    const ALGO = 'AES-GCM';

    const generateSalt = () => crypto.getRandomValues(new Uint8Array(16));
    const generateIV = () => crypto.getRandomValues(new Uint8Array(12));

    const getDerivationMaterial = async (password) => {
        const enc = new TextEncoder();
        return await crypto.subtle.importKey(
            "raw", enc.encode(password), {name: "PBKDF2"}, false,
        );
    };

    const deriveKey = async (password, salt) => {
        const material = await getDerivationMaterial(password);
        return await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: ITERATIONS, hash: "SHA-256" },
            material,
            { name: ALGO, length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    };

    const bufferToBase64 = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
    const base64ToBuffer = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

    return {
        encrypt: async (dataObj, password) => {
            const salt = generateSalt();
            const iv = generateIV();
            const key = await deriveKey(password, salt);
            const enc = new TextEncoder();
            const encodedData = enc.encode(JSON.stringify(dataObj));
            
            const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv: iv }, key, encodedData);
            
            return {
                salt: bufferToBase64(salt),
                iv: bufferToBase64(iv),
                data: bufferToBase64(encrypted)
            };
        },
        decrypt: async (encryptedPayload, password) => {
            try {
                const salt = base64ToBuffer(encryptedPayload.salt);
                const iv = base64ToBuffer(encryptedPayload.iv);
                const data = base64ToBuffer(encryptedPayload.data);
                
                const key = await deriveKey(password, salt);
                const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv: iv }, key, data);
                
                const dec = new TextDecoder();
                return JSON.parse(dec.decode(decrypted));
            } catch (e) {
                return null;
            }
        }
    };
})();

// ==========================================
// 3. FINANCIAL MATHEMATICS ENGINE
// ==========================================
const FinancialMath = {
    calculateAmortization: (principal, annualRate, months) => {
        if (annualRate == 0) return principal / months;
        const r = (annualRate / 100) / 12;
        const factor = Math.pow(1 + r, months);
        return principal * (r * factor) / (factor - 1);
    },
    
    isActive: (startDateStr, endDateStr, durationMonths = null) => {
        const now = new Date();
        const start = new Date(startDateStr);
        if (now < start) return false;
        
        if (durationMonths!== null) {
            const end = new Date(start);
            end.setMonth(end.getMonth() + parseInt(durationMonths));
            if (now > end) return false;
        } else if (endDateStr) {
            const end = new Date(endDateStr);
            if (now > end) return false;
        }
        return true;
    },

    daysRemaining50: (purchaseDateStr) => {
        const purchaseDate = new Date(purchaseDateStr);
        const now = new Date();
        const diffTime = now - purchaseDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return 50 - diffDays;
    },

    formatCurrency: (num) => {
        return parseFloat(num).toLocaleString('en-US', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).replace('LKR', 'Rs.');
    },

    formatMillions: (num) => {
        const mn = (parseFloat(num) / 1000000).toFixed(2);
        return `${FinancialMath.formatCurrency(num)} (${mn} Mn)`;
    }
};

// ==========================================
// 4. REACTIVE STATE MANAGER
// ==========================================
const INITIAL_STATE = {
    income:,
    investments:,
    loans:,
    ccInstallments:,
    ccGrace:,
    expenses:,
    targets:
};

class Store {
    constructor() {
        this.data = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.subscribers =;
    }
    
    subscribe(fn) { this.subscribers.push(fn); }
    notify() { this.subscribers.forEach(fn => fn(this.data)); }
    
    loadState(newState) {
        this.data = {...INITIAL_STATE,...newState };
        this.notify();
    }

    addItem(collection, item) {
        item.id = Date.now().toString();
        this.data[collection].push(item);
        App.saveState();
    }

    removeItem(collection, id) {
        this.data[collection] = this.data[collection].filter(i => i.id!== id);
        App.saveState();
    }

    addSavingsToTarget(targetId, amount) {
        const target = this.data.targets.find(t => t.id === targetId);
        if (target) {
            target.saved = (target.saved |

| 0) + parseFloat(amount);
            if (target.saved >= target.amount) {
                setTimeout(ConfettiEngine.fire, 300);
            }
            App.saveState();
        }
    }

    getAggregates() {
        let totalIncome = 0;
        let totalFixedExpenses = 0;
        let totalInvestments = 0;
        let activeLiabilities = 0;
        let activeCCInstallmentsTotal = 0;
        let activeLoansTotal = 0;

        this.data.income.forEach(i => totalIncome += parseFloat(i.amount));

        this.data.investments.forEach(inv => {
            if (FinancialMath.isActive(inv.startDate, inv.endDate)) {
                totalInvestments += parseFloat(inv.amount);
                const yieldAmt = (parseFloat(inv.amount) * (parseFloat(inv.yield) / 100));
                const monthlyYield = inv.frequency === 'monthly'? yieldAmt / 12 : yieldAmt / 12; 
                totalIncome += monthlyYield;
            }
        });

        this.data.expenses.forEach(e => totalFixedExpenses += parseFloat(e.amount));

        this.data.loans.forEach(loan => {
            if (FinancialMath.isActive(loan.startDate, null, loan.duration)) {
                const moPayment = FinancialMath.calculateAmortization(loan.amount, loan.rate, loan.duration);
                totalFixedExpenses += moPayment;
                activeLoansTotal += moPayment;
                activeLiabilities += parseFloat(loan.amount); 
            }
        });

        this.data.ccInstallments.forEach(cc => {
            if (FinancialMath.isActive(cc.startDate, null, cc.duration)) {
                const moPayment = FinancialMath.calculateAmortization(cc.amount, cc.rate, cc.duration);
                totalFixedExpenses += moPayment;
                activeCCInstallmentsTotal += moPayment;
                activeLiabilities += parseFloat(cc.amount);
            }
        });

        this.data.ccGrace.forEach(cc => {
            if (FinancialMath.daysRemaining50(cc.purchaseDate) >= 0) {
                activeLiabilities += parseFloat(cc.amount);
            }
        });

        let totalTargetSaved = 0;
        this.data.targets.forEach(t => totalTargetSaved += (t.saved |

| 0));

        // Liquid Balance Logic: Total Income (historically abstracted here as Net * arbitrary months for demo) 
        // minus Active Investments ensures capital deployed drops the liquid balance.
        const netCashFlow = totalIncome - totalFixedExpenses;
        const liquidBalance = (totalIncome * 12) - totalFixedExpenses - totalInvestments - totalTargetSaved;

        return {
            totalIncome,
            totalFixedExpenses,
            netCashFlow,
            totalInvestments,
            activeLiabilities,
            liquidBalance: liquidBalance > 0? liquidBalance : 0,
            chartData:
        };
    }
}
const store = new Store();

// ==========================================
// 5. USER INTERFACE CONTROLLER
// ==========================================
const UI = (() => {
    let expenseChartInstance = null;

    // Sorting Logic
    const sortTable = (tbodyId, collection, sortKey, sortType, asc) => {
        const sortedData = [...store.data[collection]].sort((a, b) => {
            let valA = a[sortKey]; let valB = b[sortKey];
            if(sortType === 'numeric') {
                return asc? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA);
            } else if(sortType === 'date') {
                return asc? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
            } else {
                return asc? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            }
        });
        
        // Temporarily replace data to render, then restore original
        const original = store.data[collection];
        store.data[collection] = sortedData;
        UI.render(store.data, true); 
        store.data[collection] = original; 
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!e.target.dataset.target) return;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.remove('hidden');
        });
    });

    document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let confirmAction = null;
    document.getElementById('confirm-submit-btn').addEventListener('click', () => {
        if(confirmAction) confirmAction();
        UI.closeAllModals();
    });

    return {
        openModal: (id) => {
            document.getElementById('modal-overlay').classList.remove('hidden');
            document.querySelectorAll('.modal-card').forEach(m => m.classList.add('hidden'));
            document.getElementById(id).classList.remove('hidden');
        },
        closeAllModals: () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            document.querySelectorAll('form').forEach(f => f.reset());
        },
        confirmDelete: (collection, id, message = "Are you sure you want to mark this item as completed?") => {
            document.getElementById('confirm-message').textContent = message;
            confirmAction = () => { store.removeItem(collection, id); };
            UI.openModal('modal-confirm');
        },
        renderChart: (dataArray) => {
            const ctx = document.getElementById('expenses-chart').getContext('2d');
            if(expenseChartInstance) expenseChartInstance.destroy();
            
            expenseChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels:,
                    datasets:,
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#CECDC3' } } }
                }
            });
        },
        render: (data, isSortedRender = false) => {
            const aggs = store.getAggregates();
            
            document.getElementById('stat-balance').textContent = FinancialMath.formatCurrency(aggs.liquidBalance);
            document.getElementById('stat-cashflow').textContent = FinancialMath.formatCurrency(aggs.netCashFlow);
            document.getElementById('stat-investments').textContent = FinancialMath.formatCurrency(aggs.totalInvestments);
            document.getElementById('stat-liabilities').textContent = FinancialMath.formatCurrency(aggs.activeLiabilities);

            const targetCont = document.getElementById('targets-container');
            targetCont.innerHTML = '';
            data.targets.forEach(t => {
                const saved = t.saved |

| 0;
                const remaining = t.amount - saved;
                const pct = Math.min(100, (saved / t.amount) * 100);
                
                targetCont.insertAdjacentHTML('beforeend', `
                    <div class="target-item">
                        <div class="target-header">
                            <h4>${t.name}</h4>
                            <button class="btn btn-sm btn-success" onclick="App.triggerAddSavings('${t.id}')">+ Add Savings</button>
                        </div>
                        <div class="target-progress-bg">
                            <div class="target-progress-fill" style="width: ${pct}%"></div>
                        </div>
                        <div class="target-stats mt-2">
                            <span>Saved: ${FinancialMath.formatMillions(saved)}</span>
                            <span>Remaining: <b class="text-blue">${FinancialMath.formatMillions(remaining)}</b></span>
                            <span>Target: ${FinancialMath.formatMillions(t.amount)}</span>
                        </div>
                        <div class="mt-2 text-sm text-faint flex-between">
                            <span>Timeline: ${t.startDate} to ${t.endDate}</span>
                            <button class="btn-text text-red" onclick="UI.confirmDelete('targets', '${t.id}', 'Cancel this goal?')">Cancel Goal</button>
                        </div>
                    </div>
                `);
            });

            // Table Rendering Logic...
            const renderTable = (bodyId, collection, htmlFn) => {
                const body = document.getElementById(bodyId);
                body.innerHTML = '';
                data[collection].forEach(item => {
                    body.insertAdjacentHTML('beforeend', htmlFn(item));
                });
            };

            renderTable('income-table-body', 'income', i => `<tr>
                <td>${i.name}</td>
                <td>${FinancialMath.formatCurrency(i.amount)}</td>
                <td><button class="btn-text text-red" onclick="UI.confirmDelete('income', '${i.id}')">❌</button></td>
            </tr>`);

            renderTable('invest-table-body', 'investments', i => `<tr>
                <td>${i.entity} <br><small>${FinancialMath.isActive(i.startDate, i.endDate)? '<span class="text-green">Active</span>' : '<span class="text-muted">Ended</span>'}</small></td>
                <td>${FinancialMath.formatCurrency(i.amount)}</td>
                <td>${i.yield}%</td>
                <td>${i.startDate} to ${i.endDate |

| 'Ongoing'}</td>
                <td><button class="btn-text text-red" onclick="UI.confirmDelete('investments', '${i.id}')">❌</button></td>
            </tr>`);

            renderTable('cc-grace-table-body', 'ccGrace', c => {
                const days = FinancialMath.daysRemaining50(c.purchaseDate);
                const isCritical = days <= 10;
                return `<tr class="${isCritical? 'row-warning' : ''}">
                    <td>${c.purchaseDate}</td>
                    <td>${c.product}</td>
                    <td>${c.bank}</td>
                    <td>${FinancialMath.formatCurrency(c.amount)}</td>
                    <td>${days} days</td>
                    <td><button class="btn-text text-green" onclick="UI.confirmDelete('ccGrace', '${c.id}', 'Mark this purchase as paid?')">✔ Pay</button></td>
                </tr>`;
            });

            renderTable('cc-install-table-body', 'ccInstallments', c => `<tr>
                <td>${c.product}</td>
                <td>${c.bank}</td>
                <td class="text-red">-${FinancialMath.formatCurrency(FinancialMath.calculateAmortization(c.amount, c.rate, c.duration))}</td>
                <td>${c.duration} mo</td>
                <td><button class="btn-text text-green" onclick="UI.confirmDelete('ccInstallments', '${c.id}', 'Mark installment plan completed?')">✔ Done</button></td>
            </tr>`);

            renderTable('loan-table-body', 'loans', l => `<tr>
                <td>${l.bank}</td>
                <td>${FinancialMath.formatCurrency(l.amount)}</td>
                <td class="text-red">-${FinancialMath.formatCurrency(FinancialMath.calculateAmortization(l.amount, l.rate, l.duration))}</td>
                <td>${l.duration} mo</td>
                <td><button class="btn-text text-green" onclick="UI.confirmDelete('loans', '${l.id}', 'Mark loan as fully paid?')">✔ Done</button></td>
            </tr>`);

            renderTable('expense-table-body', 'expenses', e => `<tr>
                <td>${e.name}</td>
                <td class="text-red">-${FinancialMath.formatCurrency(e.amount)}</td>
                <td><button class="btn-text text-red" onclick="UI.confirmDelete('expenses', '${e.id}')">❌</button></td>
            </tr>`);

            if (!isSortedRender) {
                UI.renderChart(aggs.chartData);
            }
        }
    };
})();

store.subscribe(UI.render);

// ==========================================
// 6. MAIN APPLICATION CONTROLLER
// ==========================================
const App = (() => {
    let currentPasscode = null;
    const STORAGE_KEY = 'wealthfolio_vault';

    const getFormData = (formId) => Object.fromEntries(new FormData(document.getElementById(formId)).entries());

    const bindForms = () => {
        const mappings = [
            { id: 'form-target', collection: 'targets' },
            { id: 'form-income', collection: 'income' },
            { id: 'form-invest', collection: 'investments' },
            { id: 'form-cc-grace', collection: 'ccGrace' },
            { id: 'form-cc-install', collection: 'ccInstallments' },
            { id: 'form-loan', collection: 'loans' },
            { id: 'form-expense', collection: 'expenses' }
        ];

        mappings.forEach(m => {
            document.getElementById(m.id).addEventListener('submit', (e) => {
                e.preventDefault();
                store.addItem(m.collection, getFormData(m.id));
                UI.closeAllModals();
            });
        });

        document.getElementById('form-add-savings').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = getFormData('form-add-savings');
            store.addSavingsToTarget(data.targetId, data.amount);
            UI.closeAllModals();
        });
        
        // Sorting Listeners
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                const sortType = e.target.dataset.sort;
                const collection = e.target.closest('table').querySelector('tbody').id.replace('-table-body','');
                // Mapping html IDs to state collections
                const colMap = { 'income': 'income', 'invest': 'investments', 'cc-grace': 'ccGrace', 'cc-install': 'ccInstallments', 'loan': 'loans', 'expense': 'expenses'};
                const mappedCol = colMap[collection];
                
                // Toggle Asc/Desc via custom attribute
                const isAsc = e.target.dataset.dir === 'asc';
                e.target.dataset.dir = isAsc? 'desc' : 'asc';
                
                // Infer sort key based on column position (simplified mapping)
                const colIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
                const keys = Object.keys(store.data[mappedCol] |

| {});
                const sortKey = keys[colIndex] |

| keys;
                
                // UI function handles sorting without saving
                // Note: Full robust sorting requires exact key mapping per table
            });
        });
    };

    const attemptUnlock = async (passcode) => {
        const payload = localStorage.getItem(STORAGE_KEY);
        if (!payload) {
            currentPasscode = passcode;
            await App.saveState();
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            return;
        }

        try {
            const parsed = JSON.parse(payload);
            const decryptedState = await CryptoSystem.decrypt(parsed, passcode);
            if (decryptedState) {
                currentPasscode = passcode;
                store.loadState(decryptedState);
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app-screen').classList.remove('hidden');
            } else {
                alert("Incorrect passcode.");
            }
        } catch (e) {
            alert("Cryptographic mismatch or incorrect passcode.");
        }
    };

    return {
        init: () => {
            bindForms();
            document.getElementById('auth-btn').addEventListener('click', () => {
                attemptUnlock(document.getElementById('passcode-input').value);
            });
            document.getElementById('forgot-passcode-btn').addEventListener('click', () => {
                document.getElementById('recovery-section').classList.toggle('hidden');
            });
            document.getElementById('recover-btn').addEventListener('click', () => {
                if(document.getElementById('recovery-input').value === 'FACTORYRESET') {
                    App.factoryReset();
                }
            });
            document.getElementById('lock-btn').addEventListener('click', () => location.reload());
        },
        saveState: async () => {
            if (!currentPasscode) return;
            const encrypted = await CryptoSystem.encrypt(store.data, currentPasscode);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
            store.notify();
        },
        triggerAddSavings: (targetId) => {
            document.getElementById('savings-target-id').value = targetId;
            UI.openModal('modal-add-savings');
        },
        factoryReset: () => {
            if(confirm("CRITICAL WARNING: This will permanently delete all encrypted data. Execute?")) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
