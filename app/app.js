// app/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    /* -------------------------------------------------------------------------- */
    /* 1. STATE MANAGEMENT & LOCAL STORAGE ARCHITECTURE                           */
    /* -------------------------------------------------------------------------- */
    const STORAGE_KEY = 'wealthfolio_core_db_v1';
    
    // Centralized Application State
    let state = {
        passcodeHash: null,
        balance: 0,
        incomes:,
        expenses:,
        loans:,
        installments:,
        gracePurchases:,
        targets:,
        tasks: // Array of string IDs tracking completed monthly obligations
    };

    /**
     * Hydrates the application state from local persistence.
     */
    function loadState() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state = JSON.parse(stored);
        }
    }

    /**
     * Serializes and writes the state to localStorage, triggering a UI re-render.
     */
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderDashboard();
    }

    /* -------------------------------------------------------------------------- */
    /* 2. CRYPTOGRAPHIC AUTHENTICATION PROTOCOLS                                  */
    /* -------------------------------------------------------------------------- */
    const authOverlay = document.getElementById('authOverlay');
    const passcodeInput = document.getElementById('passcodeInput');
    const authBtn = document.getElementById('authBtn');
    const authTitle = document.getElementById('authTitle');
    const authError = document.getElementById('authError');
    const forgotBtn = document.getElementById('forgotPasscodeBtn');

    /**
     * Utilizes Web Crypto API to generate a SHA-256 hash.
     * @param {string} passcode - The plaintext user input.
     * @returns {string} - The hexadecimal hash representation.
     */
    async function hashPasscode(passcode) {
        const msgBuffer = new TextEncoder().encode(passcode);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function processAuthentication() {
        const input = passcodeInput.value;
        if (!input) return;

        const hashed = await hashPasscode(input);

        if (!state.passcodeHash) {
            // First-time configuration protocol
            state.passcodeHash = hashed;
            saveState();
            unlockInterface();
        } else {
            // Verification protocol
            if (state.passcodeHash === hashed) {
                unlockInterface();
            } else {
                authError.classList.remove('hidden');
                passcodeInput.value = '';
                // Shake animation for error feedback
                authOverlay.querySelector('div').classList.add('animate-pulse');
                setTimeout(() => authOverlay.querySelector('div').classList.remove('animate-pulse'), 500);
            }
        }
    }

    function unlockInterface() {
        authOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => authOverlay.classList.add('hidden'), 500);
        renderDashboard();
    }

    window.lockSystem = function() {
        passcodeInput.value = '';
        authError.classList.add('hidden');
        authOverlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    };

    // Hard-reset mechanism required for serverless deployments
    forgotBtn.addEventListener('click', () => {
        const resetKey = prompt("CRITICAL WARNING: Enter the Recovery Key to execute a total data purge. Action is irreversible.");
        if (resetKey === "RESET_WEALTHFOLIO") {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        } else if (resetKey!== null) {
            alert("Security Alert: Invalid Recovery Key provided.");
        }
    });

    authBtn.addEventListener('click', processAuthentication);
    passcodeInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') processAuthentication(); 
    });

    /* -------------------------------------------------------------------------- */
    /* 3. DOM ROUTING & NAVIGATION                                                */
    /* -------------------------------------------------------------------------- */
    window.switchTab = function(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
        
        // Reset navigation button states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate target tab and button
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        const activeBtn = document.getElementById(`nav-${tabId}`);
        activeBtn.classList.add('active');
        
        // Update contextual header
        document.getElementById('pageTitle').innerText = activeBtn.innerText;
        renderDashboard();
    };

    // Initialize Header Date
    document.getElementById('currentDateDisplay').innerText = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });

    /* -------------------------------------------------------------------------- */
    /* 4. FINANCIAL MATHEMATICS & TEMPORAL COMPUTATIONS                           */
    /* -------------------------------------------------------------------------- */
    
    // Unique Identifier Generator
    function generateUUID() { 
        return Date.now().toString(36) + Math.random().toString(36).substring(2); 
    }

    /**
     * Computes the Equated Monthly Installment (EMI).
     */
    function computeEMI(principal, annualInterestRate, months) {
        if (!annualInterestRate |

| annualInterestRate === 0) return principal / months;
        const monthlyRate = (annualInterestRate / 100) / 12;
        return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    }

    /**
     * Computes the elapsed month count between two Date objects.
     */
    function getElapsedMonths(startDate, currentDate) {
        let months = (currentDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += currentDate.getMonth();
        return months <= 0? 0 : months;
    }

    /**
     * Formats numerical values into structured currency strings.
     */
    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* -------------------------------------------------------------------------- */
    /* 5. DATA INGESTION & FORM HANDLING (CRUD)                                   */
    /* -------------------------------------------------------------------------- */

    document.getElementById('form-income').addEventListener('submit', (e) => {
        e.preventDefault();
        const investedAmount = parseFloat(document.getElementById('inc-invested').value) |

| 0;
        
        // Capital reallocation: Deduct investment principal from rolling balance
        if (investedAmount > 0) {
            state.balance -= investedAmount;
        }

        state.incomes.push({
            id: generateUUID(),
            source: document.getElementById('inc-source').value,
            invested: investedAmount,
            monthlyReturn: parseFloat(document.getElementById('inc-monthly').value),
            dividendPct: parseFloat(document.getElementById('inc-dividend-pct').value) |

| 0,
            start: document.getElementById('inc-start').value,
            end: document.getElementById('inc-end').value,
            freq: document.getElementById('inc-freq').value,
            payoutDay: document.getElementById('inc-payout-day').value
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-expense').addEventListener('submit', (e) => {
        e.preventDefault();
        state.expenses.push({
            id: generateUUID(),
            name: document.getElementById('exp-name').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            date: document.getElementById('exp-date').value
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-loan').addEventListener('submit', (e) => {
        e.preventDefault();
        state.loans.push({
            id: generateUUID(),
            bank: document.getElementById('loan-bank').value,
            purpose: document.getElementById('loan-purpose').value,
            amount: parseFloat(document.getElementById('loan-amount').value),
            installment: parseFloat(document.getElementById('loan-installment').value),
            interest: parseFloat(document.getElementById('loan-interest').value) |

| 0,
            duration: parseInt(document.getElementById('loan-duration').value),
            start: document.getElementById('loan-start').value
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-install').addEventListener('submit', (e) => {
        e.preventDefault();
        const principal = parseFloat(document.getElementById('inst-total').value);
        const interest = parseFloat(document.getElementById('inst-interest').value);
        const duration = parseInt(document.getElementById('inst-duration').value);
        
        state.installments.push({
            id: generateUUID(),
            bank: document.getElementById('inst-bank').value,
            product: document.getElementById('inst-product').value,
            buyer: document.getElementById('inst-buyer').value,
            total: principal,
            interest: interest,
            duration: duration,
            monthlyPay: computeEMI(principal, interest, duration),
            date: document.getElementById('inst-date').value
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-grace').addEventListener('submit', (e) => {
        e.preventDefault();
        state.gracePurchases.push({
            id: generateUUID(),
            bank: document.getElementById('grc-bank').value,
            desc: document.getElementById('grc-desc').value,
            amount: parseFloat(document.getElementById('grc-amount').value),
            date: document.getElementById('grc-date').value,
            paid: false
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-target').addEventListener('submit', (e) => {
        e.preventDefault();
        state.targets.push({
            id: generateUUID(),
            name: document.getElementById('tgt-name').value,
            amount: parseFloat(document.getElementById('tgt-amount').value),
            saved: 0,
            start: document.getElementById('tgt-start').value,
            end: document.getElementById('tgt-end').value,
            completed: false
        });
        e.target.reset();
        saveState();
    });

    document.getElementById('form-tgt-save').addEventListener('submit', (e) => {
        e.preventDefault();
        const targetId = document.getElementById('tgt-select').value;
        const allocationAmount = parseFloat(document.getElementById('tgt-save-amount').value);
        const targetObj = state.targets.find(t => t.id === targetId);
        
        if (targetObj) {
            targetObj.saved += allocationAmount;
            state.balance -= allocationAmount; // Deduct allocation from liquid rolling balance
            
            // Verify Completion Status
            if (targetObj.saved >= targetObj.amount &&!targetObj.completed) {
                targetObj.completed = true;
                executeConfettiProtocol();
            }
            saveState();
        }
        e.target.reset();
    });

    /* -------------------------------------------------------------------------- */
    /* 6. DATA RENDERING, SORTING, AND DASHBOARD AGGREGATION                      */
    /* -------------------------------------------------------------------------- */
    let dataChart = null;
    let sortToggle = false;

    window.sortTable = function(tableType) {
        sortToggle =!sortToggle;
        if(tableType === 'incomes') {
            state.incomes.sort((a, b) => sortToggle? a.invested - b.invested : b.invested - a.invested);
        }
        saveState(); // Re-render with sorted data
    }

    function renderDashboard() {
        const currentDate = new Date();
        const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        
        let aggregateMonthlyIncome = 0;
        let aggregateMonthlyExpense = 0;
        let aggregateObligations = 0;
        
        // --- Render Income Portfolio ---
        const incomeHtml = state.incomes.map(item => {
            aggregateMonthlyIncome += item.monthlyReturn;
            return `<tr class="hover:bg-gray-50 transition-colors">
                <td class="p-5 font-bold text-gray-800">${item.source}</td>
                <td class="p-5 font-medium">${formatCurrency(item.invested)}</td>
                <td class="p-5 text-green-600 font-bold bg-green-50/50">+${formatCurrency(item.monthlyReturn)}</td>
                <td class="p-5">${item.dividendPct}%</td>
                <td class="p-5 text-gray-500">Day ${item.payoutDay}</td>
                <td class="p-5 text-right"><button onclick="executeDeletion('incomes', '${item.id}')" class="text-red-400 hover:text-red-600 transition-colors font-medium"><i class="ph ph-trash text-lg"></i></button></td>
            </tr>`;
        }).join('');
        document.getElementById('table-incomes').innerHTML = incomeHtml;

        // --- Render Ad-Hoc Expenses ---
        const expenseHtml = state.expenses.filter(e => new Date(e.date).getMonth() === currentDate.getMonth()).map(e => {
            aggregateMonthlyExpense += e.amount;
            return `<tr class="hover:bg-gray-50 transition-colors">
                <td class="p-5 text-gray-500 font-medium">${e.date}</td>
                <td class="p-5 font-bold text-gray-800">${e.name}</td>
                <td class="p-5 text-red-500 font-bold bg-red-50/50">${formatCurrency(e.amount)}</td>
                <td class="p-5 text-right"><button onclick="executeDeletion('expenses', '${e.id}')" class="text-red-400 hover:text-red-600 transition-colors font-medium"><i class="ph ph-trash text-lg"></i></button></td>
            </tr>`;
        }).join('');
        document.getElementById('table-expenses').innerHTML = expenseHtml;

        // --- Render Bank Loans (Chronological Evaluation) ---
        const loanHtml = state.loans.map(loan => {
            const monthsPassed = getElapsedMonths(new Date(loan.start), currentDate);
            const isActive = monthsPassed <= loan.duration;
            if(isActive) aggregateObligations += loan.installment;
            
            return isActive? `<tr class="hover:bg-gray-50 transition-colors">
                <td class="p-5 font-bold text-gray-800">${loan.bank}</td>
                <td class="p-5 text-gray-600">${loan.purpose}</td>
                <td class="p-5 font-medium">${formatCurrency(loan.amount)}</td>
                <td class="p-5 text-orange-600 font-bold bg-orange-50/50">${formatCurrency(loan.installment)}</td>
                <td class="p-5 font-medium text-brand-600">
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-brand-500 h-2 rounded-full" style="width: ${(monthsPassed/loan.duration)*100}%"></div>
                    </div>
                    <span class="text-xs text-gray-400 block mt-1">${loan.duration - monthsPassed} months remaining</span>
                </td>
                <td class="p-5 text-right"><button onclick="executeDeletion('loans', '${loan.id}')" class="text-red-400 hover:text-red-600 transition-colors font-medium"><i class="ph ph-trash text-lg"></i></button></td>
            </tr>` : '';
        }).join('');
        document.getElementById('table-loans').innerHTML = loanHtml;

        // --- Render Credit Card Installments (Chronological Evaluation) ---
        let totalCCInstallments = 0;
        const instHtml = state.installments.map(inst => {
            const monthsPassed = getElapsedMonths(new Date(inst.date), currentDate);
            const isActive = monthsPassed <= inst.duration;
            if(isActive) {
                aggregateObligations += inst.monthlyPay;
                totalCCInstallments += inst.monthlyPay;
            }
            
            return isActive? `<tr class="hover:bg-gray-50 transition-colors">
                <td class="p-5 font-bold text-gray-800">${inst.bank}</td>
                <td class="p-5">
                    <span class="block text-gray-800 font-bold">${inst.product}</span>
                    <span class="text-xs text-brand-500 font-bold uppercase tracking-wider">${inst.buyer}</span>
                </td>
                <td class="p-5 font-medium">${formatCurrency(inst.total)}</td>
                <td class="p-5 text-orange-600 font-bold bg-orange-50/50">${formatCurrency(inst.monthlyPay)}</td>
                <td class="p-5 font-medium text-brand-600">
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-brand-500 h-2 rounded-full" style="width: ${(monthsPassed/inst.duration)*100}%"></div>
                    </div>
                    <span class="text-xs text-gray-400 block mt-1">${inst.duration - monthsPassed} months remaining</span>
                </td>
                <td class="p-5 text-right"><button onclick="executeDeletion('installments', '${inst.id}')" class="text-red-400 hover:text-red-600 transition-colors font-medium"><i class="ph ph-trash text-lg"></i></button></td>
            </tr>` : '';
        }).join('');
        document.getElementById('table-installments').innerHTML = instHtml;

        // --- Render 50-Day Grace Period Countdown Logic ---
        let urgentTasksExist = false;
        const graceHtml = state.gracePurchases.filter(g =>!g.paid).map(g => {
            const purchaseDateObj = new Date(g.date);
            const timeDifferenceMillis = currentDate - purchaseDateObj;
            const daysPassed = Math.floor(timeDifferenceMillis / (1000 * 60 * 60 * 24));
            const daysRemaining = 50 - daysPassed;
            
            const isCritical = daysRemaining <= 10;
            if (isCritical) urgentTasksExist = true;
            
            return `<div class="bg-white border-2 ${isCritical? 'border-red-500 animate-urgent' : 'border-gray-200'} rounded-2xl p-6 shadow-sm relative overflow-hidden group transition-all hover:shadow-lg">
                ${isCritical? '<div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest">Warning</div>' : ''}
                <div class="flex justify-between items-start mb-3">
                    <span class="font-black text-xl text-gray-800 tracking-tight">${g.bank}</span>
                    <span class="px-2 py-1 bg-gray-100 text-xs rounded-md font-bold text-gray-500">${g.date}</span>
                </div>
                <p class="text-gray-500 font-medium mb-6 h-10 line-clamp-2">${g.desc}</p>
                <div class="text-3xl font-black text-gray-800 mb-6 font-mono">${formatCurrency(g.amount)}</div>
                <div class="flex justify-between items-center border-t border-gray-100 pt-4">
                    <div class="flex items-center gap-2">
                        <i class="ph ph-clock-countdown ${isCritical? 'text-red-600' : 'text-green-600'} text-xl"></i>
                        <span class="text-sm font-black ${isCritical? 'text-red-600' : 'text-green-600'}">${daysRemaining} Days</span>
                    </div>
                    <button onclick="executeModalAction('Confirm final settlement of this transaction?', () => { executeDeletion('gracePurchases', '${g.id}'); })" class="text-sm bg-brand-900 text-white px-4 py-2 rounded-lg hover:bg-brand-700 font-bold transition-colors">Settle</button>
                </div>
            </div>`;
        }).join('');
        document.getElementById('graceCardsContainer').innerHTML = graceHtml;
        
        // Update Sidebar Badge Alert
        const badge = document.getElementById('graceBadge');
        if(urgentTasksExist) badge.classList.remove('hidden');
        else badge.classList.add('hidden');

        // --- Render Target Progress & Gamification ---
        const targetHtml = state.targets.map(tgt => {
            const completionPercentage = Math.min((tgt.saved / tgt.amount) * 100, 100).toFixed(1);
            return `<div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden ${tgt.completed? 'ring-2 ring-green-400 bg-green-50/20' : ''}">
                ${tgt.completed? '<div class="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full"><i class="ph ph-check-circle text-xl"></i></div>' : ''}
                <div class="flex justify-between items-end mb-6">
                    <div>
                        <h4 class="font-black text-2xl text-gray-800 tracking-tight">${tgt.name}</h4>
                        <span class="text-sm font-bold text-gray-400 mt-1 block"><i class="ph ph-calendar-blank"></i> ${tgt.start} ➝ ${tgt.end}</span>
                    </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-6 mb-4 overflow-hidden border border-gray-200 p-1">
                    <div class="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2" style="width: ${completionPercentage}%">
                        ${completionPercentage > 10? `<span class="text-[10px] text-white font-bold">${completionPercentage}%</span>` : ''}
                    </div>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg">Capital Secured: ${formatCurrency(tgt.saved)}</span>
                    <span class="font-black text-gray-400 uppercase tracking-widest">Goal: ${formatCurrency(tgt.amount)}</span>
                </div>
            </div>`;
        }).join('');
        document.getElementById('targetsContainer').innerHTML = targetHtml;
        
        // Update Allocation Dropdown (Hide completed)
        document.getElementById('tgt-select').innerHTML = state.targets.filter(t =>!t.completed)
           .map(t => `<option value="${t.id}">${t.name}</option>`).join('');

        // --- Dynamic Rolling Balance Calculation ---
        // Formula: Current_Balance = Prev_Balance + Total_Income - (Daily_Expenses + EMI_Obligations)
        state.balance = state.balance + aggregateMonthlyIncome - aggregateMonthlyExpense - aggregateObligations;
        
        // Inject top metrics into DOM
        document.getElementById('dashBalance').innerText = formatCurrency(state.balance);
        document.getElementById('dashIncome').innerText = '+' + formatCurrency(aggregateMonthlyIncome);
        document.getElementById('dashExpenses').innerText = '-' + formatCurrency(aggregateMonthlyExpense);
        document.getElementById('dashObligations').innerText = '-' + formatCurrency(aggregateObligations);

        // --- Chart.js Instantiation ---
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if (dataChart) dataChart.destroy();
        
        dataChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels:,
                datasets: [{
                    label: 'Financial Output',
                    data: [aggregateMonthlyExpense, totalCCInstallments, aggregateObligations - totalCCInstallments],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: { size: 14, family: 'Inter' },
                        bodyFont: { size: 14, font: 'bold' }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f1f5f9', drawBorder: false },
                        ticks: { font: { family: 'Inter', weight: 'bold' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter', weight: 'bold' } }
                    }
                }
            }
        });

        // Generate Checklist Tasks
        renderTaskChecklist(currentMonthKey);
    }

    /* -------------------------------------------------------------------------- */
    /* 7. MODALS, TASK ENGINE & VISUAL GAMIFICATION                               */
    /* -------------------------------------------------------------------------- */
    
    window.executeDeletion = function(arrayName, objectId) {
        state[arrayName] = state[arrayName].filter(item => item.id!== objectId);
        saveState();
    };

    let activeModalCallback = null;
    const modalNode = document.getElementById('confirmModal');
    const modalContentNode = document.getElementById('confirmModalContent');
    const modalMsgNode = document.getElementById('confirmModalMessage');

    window.executeModalAction = function(message, callbackReference) {
        activeModalCallback = callbackReference;
        modalMsgNode.innerText = message;
        modalNode.classList.remove('hidden');
        // Minor timeout to allow display:block before applying transition classes
        setTimeout(() => modalContentNode.classList.remove('scale-95'), 10);
    };

    function hideModal() {
        modalContentNode.classList.add('scale-95');
        setTimeout(() => modalNode.classList.add('hidden'), 200);
    }

    // Event Listeners for Modal Interactions
    document.getElementById('closeModalIcon').addEventListener('click', hideModal);
    document.getElementById('cancelModalBtn').addEventListener('click', hideModal);
    document.getElementById('submitModalBtn').addEventListener('click', () => {
        if(activeModalCallback) activeModalCallback();
        hideModal();
    });

    /**
     * Parses the current chronological liabilities and renders interactive checklist items.
     */
    function renderTaskChecklist(monthKey) {
        const listContainer = document.getElementById('taskList');
        let injectedHTML = '';
        
        const combinedLiabilities = state.loans.concat(state.installments);
        
        combinedLiabilities.forEach(item => {
            // Task format string explicitly pairs the obligation ID with the chronological month
            const uniqueTaskID = `${item.id}_${monthKey}`;
            const isCompleted = state.tasks.includes(uniqueTaskID);
            
            if(!isCompleted) {
                injectedHTML += `<div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div class="flex items-center gap-4">
                        <div class="bg-orange-50 text-orange-500 p-2 rounded-lg">
                            <i class="ph ${item.purpose? 'ph-bank' : 'ph-credit-card'} text-xl"></i>
                        </div>
                        <div>
                            <p class="font-black text-gray-800 text-sm">${item.bank} - ${item.purpose |

| item.product}</p>
                            <p class="text-orange-500 font-bold text-xs tracking-wider">${formatCurrency(item.installment |

| item.monthlyPay)} Due</p>
                        </div>
                    </div>
                    <button onclick="executeModalAction('Verify transfer of ${formatCurrency(item.installment |

| item.monthlyPay)} to ${item.bank}?', () => processTaskCompletion('${uniqueTaskID}'))" class="w-10 h-10 rounded-full bg-gray-100 text-gray-400 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all group-hover:scale-110">
                        <i class="ph ph-check text-xl font-bold"></i>
                    </button>
                </div>`;
            }
        });
        
        if (injectedHTML === '') {
            injectedHTML = `<div class="h-full flex flex-col items-center justify-center text-center opacity-50">
                <i class="ph ph-check-circle text-6xl text-green-500 mb-4"></i>
                <p class="text-gray-500 font-bold">All obligations cleared for this period.</p>
            </div>`;
        }
        listContainer.innerHTML = injectedHTML;
    }

    window.processTaskCompletion = function(taskIdentifier) {
        state.tasks.push(taskIdentifier);
        saveState();
    };

    /**
     * Integrates canvas-confetti logic to execute randomized celebratory animations.
     */
    function executeConfettiProtocol() {
        const animationDuration = 6 * 1000;
        const terminalTime = Date.now() + animationDuration;
        const configDefaults = { startVelocity: 40, spread: 360, ticks: 80, zIndex: 100 };

        function calculateRandomRange(min, max) { 
            return Math.random() * (max - min) + min; 
        }

        const burstInterval = setInterval(function() {
            const timeRemaining = terminalTime - Date.now();
            if (timeRemaining <= 0) return clearInterval(burstInterval);
            
            const dynamicParticleCount = 60 * (timeRemaining / animationDuration);
            // Left hemisphere origin
            confetti(Object.assign({}, configDefaults, { 
                particleCount: dynamicParticleCount, 
                origin: { x: calculateRandomRange(0.1, 0.3), y: Math.random() - 0.2 } 
            }));
            // Right hemisphere origin
            confetti(Object.assign({}, configDefaults, { 
                particleCount: dynamicParticleCount, 
                origin: { x: calculateRandomRange(0.7, 0.9), y: Math.random() - 0.2 } 
            }));
        }, 250);
    }

    // APPLICATION BOOTSTRAP
    loadState();
    if (!state.passcodeHash) {
        authTitle.innerText = "Setup Security Passcode";
        authBtn.innerText = "Initialize Configuration";
    }
});
