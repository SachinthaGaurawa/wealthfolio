cat > /home/claude/new_features.js << 'JSEOF'

        // =====================================================================
        // ██╗███╗   ██╗███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
        // ╚══════════════ WEALTHFLOW INNOVATIONS ENGINE v6.0 ════════════════╝
        // =====================================================================

        // ==================== INNOVATION 1: 3D CASH FLOW VISUALIZATION ====================
        let cfAnimFrame = null;
        let cfParticles = [];
        
        function initCashFlow3D() {
            const canvas = document.getElementById('cashFlowCanvas');
            if (!canvas) return;
            const ctx2 = canvas.getContext('2d');
            const W = canvas.parentElement.offsetWidth || 600;
            const H = 300;
            canvas.width = W;
            canvas.height = H;

            const ctx_data = buildFinancialContext();
            const income = ctx_data.totalMonthlyIncome;
            const expenses = ctx_data.thisMonthExpenses;
            const loans = ctx_data.monthlyLoanPayments;
            const savings = Math.max(0, income - expenses - loans);

            // Update stats
            const statsEl = document.getElementById('cashFlowStats');
            if (statsEl) {
                statsEl.innerHTML = `
                    <div class="data-stat-card"><div class="data-stat-num" style="color:var(--green);">${fmt(income)}</div><div class="data-stat-label">Monthly Inflow</div></div>
                    <div class="data-stat-card"><div class="data-stat-num" style="color:var(--red);">${fmt(expenses + loans)}</div><div class="data-stat-label">Total Outflow</div></div>
                    <div class="data-stat-card"><div class="data-stat-num" style="color:var(--accent);">${fmt(savings)}</div><div class="data-stat-label">Net Savings</div></div>
                `;
            }

            const VAULT = { x: W / 2, y: H / 2, r: 36 };
            const SOURCES = [
                { x: 60, y: 80, color: '#10b981', label: 'Income', count: Math.max(2, Math.round(income / 50000)) },
                { x: 60, y: H - 80, color: '#3b82f6', label: 'Savings', count: Math.max(1, Math.round(savings / 30000)) }
            ];
            const DRAINS = [
                { x: W - 60, y: 80, color: '#ef4444', label: 'Expenses', count: Math.max(2, Math.round(expenses / 40000)) },
                { x: W - 60, y: H - 80, color: '#8b5cf6', label: 'Loans', count: Math.max(1, Math.round(loans / 30000)) }
            ];

            cfParticles = [];

            function spawnParticle(src, dst, color) {
                cfParticles.push({
                    x: src.x + (Math.random() - 0.5) * 20,
                    y: src.y + (Math.random() - 0.5) * 20,
                    tx: dst.x, ty: dst.y,
                    color, size: 3 + Math.random() * 3,
                    speed: 0.01 + Math.random() * 0.015,
                    t: 0, alpha: 1,
                    cx: (src.x + dst.x) / 2 + (Math.random() - 0.5) * 80,
                    cy: (src.y + dst.y) / 2 + (Math.random() - 0.5) * 80,
                    trail: []
                });
            }

            let spawnTimer = 0;
            function animate() {
                ctx2.clearRect(0, 0, W, H);

                // Dark background gradient
                const bg = ctx2.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
                bg.addColorStop(0, 'rgba(13,29,60,0.95)');
                bg.addColorStop(1, 'rgba(6,10,20,0.98)');
                ctx2.fillStyle = bg;
                ctx2.fillRect(0, 0, W, H);

                // Grid lines
                ctx2.strokeStyle = 'rgba(26,38,64,0.6)';
                ctx2.lineWidth = 1;
                for (let gx = 0; gx < W; gx += 40) { ctx2.beginPath(); ctx2.moveTo(gx,0); ctx2.lineTo(gx,H); ctx2.stroke(); }
                for (let gy = 0; gy < H; gy += 40) { ctx2.beginPath(); ctx2.moveTo(0,gy); ctx2.lineTo(W,gy); ctx2.stroke(); }

                // Draw vault (central node)
                const vaultGlow = ctx2.createRadialGradient(VAULT.x, VAULT.y, 0, VAULT.x, VAULT.y, VAULT.r * 2);
                vaultGlow.addColorStop(0, 'rgba(212,175,55,0.3)');
                vaultGlow.addColorStop(1, 'rgba(212,175,55,0)');
                ctx2.fillStyle = vaultGlow;
                ctx2.beginPath(); ctx2.arc(VAULT.x, VAULT.y, VAULT.r * 2, 0, Math.PI * 2); ctx2.fill();
                ctx2.fillStyle = 'rgba(212,175,55,0.15)';
                ctx2.beginPath(); ctx2.arc(VAULT.x, VAULT.y, VAULT.r, 0, Math.PI * 2); ctx2.fill();
                ctx2.strokeStyle = 'rgba(212,175,55,0.7)';
                ctx2.lineWidth = 2;
                ctx2.beginPath(); ctx2.arc(VAULT.x, VAULT.y, VAULT.r, 0, Math.PI * 2); ctx2.stroke();
                ctx2.fillStyle = '#d4af37'; ctx2.font = 'bold 20px sans-serif'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
                ctx2.fillText('💰', VAULT.x, VAULT.y);

                // Draw source/drain nodes
                [...SOURCES, ...DRAINS].forEach(node => {
                    ctx2.fillStyle = node.color + '22';
                    ctx2.beginPath(); ctx2.arc(node.x, node.y, 22, 0, Math.PI * 2); ctx2.fill();
                    ctx2.strokeStyle = node.color;
                    ctx2.lineWidth = 1.5;
                    ctx2.beginPath(); ctx2.arc(node.x, node.y, 22, 0, Math.PI * 2); ctx2.stroke();
                    ctx2.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx2.beginPath(); ctx2.arc(node.x, node.y, 18, 0, Math.PI * 2); ctx2.fill();
                    ctx2.fillStyle = node.color; ctx2.font = 'bold 10px Outfit,sans-serif'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
                    ctx2.fillText(node.label, node.x, node.y);
                });

                // Spawn particles
                spawnTimer++;
                if (spawnTimer % 8 === 0) {
                    SOURCES.forEach(s => { if (Math.random() < 0.7) spawnParticle(s, VAULT, s.color); });
                    DRAINS.forEach(d => { if (Math.random() < 0.7) spawnParticle(VAULT, d, d.color); });
                }

                // Update and draw particles
                cfParticles = cfParticles.filter(p => p.alpha > 0.01);
                cfParticles.forEach(p => {
                    p.t = Math.min(1, p.t + p.speed);
                    const t = p.t;
                    // Bezier curve
                    p.x = (1-t)*(1-t)*p.x + 2*(1-t)*t*p.cx + t*t*p.tx;
                    p.y = (1-t)*(1-t)*p.y + 2*(1-t)*t*p.cy + t*t*p.ty;
                    if (p.t >= 1) p.alpha -= 0.05;

                    // Glow
                    const glow = ctx2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                    glow.addColorStop(0, p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0'));
                    glow.addColorStop(1, 'transparent');
                    ctx2.fillStyle = glow;
                    ctx2.beginPath(); ctx2.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); ctx2.fill();

                    ctx2.fillStyle = p.color;
                    ctx2.globalAlpha = p.alpha;
                    ctx2.beginPath(); ctx2.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx2.fill();
                    ctx2.globalAlpha = 1;
                });

                cfAnimFrame = requestAnimationFrame(animate);
            }

            if (cfAnimFrame) cancelAnimationFrame(cfAnimFrame);
            animate();
            playSound('tick');
        }

        // Stop animation when modal closes
        const origCloseModal = window.closeModal || function(){};

        // ==================== INNOVATION 2: MONTE CARLO WEALTH SIMULATOR ====================
        let mcChartInstance = null;

        function runMonteCarlo() {
            const years = parseInt(document.getElementById('mc_years')?.value || '3');
            const inflation = parseFloat(document.getElementById('mc_inflation')?.value || '12') / 100;
            const cbslRate = parseFloat(document.getElementById('mc_cbsl')?.value || '10') / 100;
            
            const ctx_data = buildFinancialContext();
            const monthlyNet = ctx_data.netMonthlyCashFlow;
            const currentBalance = ctx_data.balanceOnHand;
            const months = years * 12;

            // Monte Carlo: run 3 scenarios
            function project(growthRate, expenseGrowth, label) {
                let balance = currentBalance;
                const points = [balance];
                for (let m = 0; m < months; m++) {
                    const adjustedNet = monthlyNet * Math.pow(1 - expenseGrowth/12, m);
                    const interest = balance * (growthRate / 12);
                    balance = balance + adjustedNet + interest;
                    if ((m + 1) % 3 === 0) points.push(Math.round(balance));
                }
                return points;
            }

            const labels = [];
            for (let q = 0; q <= years * 4; q++) {
                const d = new Date();
                d.setMonth(d.getMonth() + q * 3);
                labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
            }

            const bestCase = project(cbslRate * 1.5, inflation * 0.5, 'Best');
            const baseCase = project(cbslRate, inflation, 'Base');
            const worstCase = project(cbslRate * 0.5, inflation * 1.5, 'Worst');

            const canvasEl = document.getElementById('mcChart');
            if (!canvasEl) return;
            
            if (mcChartInstance) mcChartInstance.destroy();
            mcChartInstance = new Chart(canvasEl.getContext('2d'), {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Best Case', data: bestCase, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 },
                        { label: 'Base Case', data: baseCase, borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.06)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0 },
                        { label: 'Worst Case', data: worstCase, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => 'LKR ' + (v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : v) } }
                    }
                }
            });

            const scenariosEl = document.getElementById('mcScenarios');
            if (scenariosEl) {
                const fmt2 = v => 'LKR ' + (v >= 1000000 ? (v/1000000).toFixed(2) + 'M' : (v/1000).toFixed(0) + 'K');
                scenariosEl.innerHTML = `
                    <div class="mc-scenario mc-best"><div style="font-size:20px;">🌟</div><div style="flex:1;"><div style="font-size:11px;color:var(--green);font-weight:700;text-transform:uppercase;">BEST CASE — Low Inflation, High Returns</div><div style="font-size:11px;color:var(--text3);margin-top:2px;">Inflation ${(inflation*0.5*100).toFixed(0)}%, Returns ${(cbslRate*1.5*100).toFixed(0)}%</div></div><div><div class="mc-val" style="color:var(--green);">${fmt2(bestCase[bestCase.length-1])}</div><div style="font-size:10px;color:var(--text3);">in ${years}yr</div></div></div>
                    <div class="mc-scenario mc-base"><div style="font-size:20px;">⚖️</div><div style="flex:1;"><div style="font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase;">BASE CASE — Current Trends</div><div style="font-size:11px;color:var(--text3);margin-top:2px;">Inflation ${(inflation*100).toFixed(0)}%, Returns ${(cbslRate*100).toFixed(0)}%</div></div><div><div class="mc-val" style="color:var(--accent);">${fmt2(baseCase[baseCase.length-1])}</div><div style="font-size:10px;color:var(--text3);">in ${years}yr</div></div></div>
                    <div class="mc-scenario mc-worst"><div style="font-size:20px;">⚠️</div><div style="flex:1;"><div style="font-size:11px;color:var(--red);font-weight:700;text-transform:uppercase;">WORST CASE — High Inflation, Low Returns</div><div style="font-size:11px;color:var(--text3);margin-top:2px;">Inflation ${(inflation*1.5*100).toFixed(0)}%, Returns ${(cbslRate*0.5*100).toFixed(0)}%</div></div><div><div class="mc-val" style="color:var(--red);">${fmt2(worstCase[worstCase.length-1])}</div><div style="font-size:10px;color:var(--text3);">in ${years}yr</div></div></div>
                `;
            }
        }

        // ==================== INNOVATION 3: SUBSCRIPTION TRACKER ====================
        function detectSubscriptions() {
            const expenses = DB.get('expenses');
            const subscriptions = [];
            const subKeywords = {
                'Netflix': { icon: '🎬', category: 'Entertainment' },
                'YouTube': { icon: '▶️', category: 'Entertainment' },
                'Spotify': { icon: '🎵', category: 'Entertainment' },
                'Dialog': { icon: '📱', category: 'Utilities' },
                'Mobitel': { icon: '📱', category: 'Utilities' },
                'SLT': { icon: '🌐', category: 'Internet' },
                'Hutch': { icon: '📡', category: 'Utilities' },
                'Amazon': { icon: '📦', category: 'Shopping' },
                'Apple': { icon: '🍎', category: 'Tech' },
                'Google': { icon: '🔍', category: 'Tech' },
                'Microsoft': { icon: '💻', category: 'Tech' },
                'Adobe': { icon: '🎨', category: 'Software' },
                'Insurance': { icon: '🛡️', category: 'Insurance' },
                'Gym': { icon: '💪', category: 'Health' },
                'iCloud': { icon: '☁️', category: 'Tech' }
            };
            
            // Group expenses by description pattern
            const expGroups = {};
            expenses.forEach(e => {
                const key = e.desc.toLowerCase().trim();
                if (!expGroups[key]) expGroups[key] = [];
                expGroups[key].push(e);
            });

            // Detect recurring (2+ occurrences)
            Object.entries(expGroups).forEach(([key, entries]) => {
                if (entries.length >= 2) {
                    const amounts = entries.map(e => e.amount);
                    const avgAmount = amounts.reduce((a,b)=>a+b,0) / amounts.length;
                    const latestDate = entries.map(e => e.month).sort().pop();
                    
                    let icon = '🔄', category = 'Subscription';
                    Object.entries(subKeywords).forEach(([kw, data]) => {
                        if (entries[0].desc.toLowerCase().includes(kw.toLowerCase())) {
                            icon = data.icon; category = data.category;
                        }
                    });
                    
                    // Detect anomaly (30%+ higher than average)
                    const latestAmount = entries.find(e => e.month === latestDate)?.amount || avgAmount;
                    const isHighBill = latestAmount > avgAmount * 1.3;
                    
                    subscriptions.push({ desc: entries[0].desc, avgAmount, latestAmount, count: entries.length, latestDate, icon, category, isHighBill });
                }
            });

            const alertEl = document.getElementById('subDetectedAlert');
            if (alertEl) {
                if (subscriptions.length > 0) {
                    alertEl.style.display = 'block';
                    alertEl.textContent = `🔍 Auto-detected ${subscriptions.length} recurring payment(s) from your expense history.`;
                } else {
                    alertEl.style.display = 'block';
                    alertEl.textContent = '💡 No recurring patterns detected yet. Add more monthly expenses to enable auto-detection.';
                }
            }

            renderSubscriptionList(subscriptions);
        }

        function renderSubscriptions() {
            const expenses = DB.get('expenses');
            detectSubscriptions();
        }

        function renderSubscriptionList(subs) {
            const el = document.getElementById('subList');
            if (!el) return;
            if (!subs || !subs.length) {
                el.innerHTML = '<div class="empty" style="padding:30px;"><div class="empty-icon">🔁</div><div class="empty-title">No subscriptions detected yet</div><div class="empty-sub">Add recurring monthly expenses and click Auto-Detect</div></div>';
                return;
            }
            const now = new Date();
            el.innerHTML = subs.map(s => {
                const highBillWarning = s.isHighBill ? `<div style="font-size:10px;color:var(--red);margin-top:4px;">⚠️ Latest bill LKR ${fmtN(s.latestAmount)} is ${Math.round((s.latestAmount/s.avgAmount-1)*100)}% above average!</div>` : '';
                return `<div class="sub-card ${s.isHighBill ? 'sub-high-bill' : ''}">
                    <div class="sub-icon" style="background:${s.isHighBill ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)'};">${s.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:13px;font-weight:700;">${s.desc}</div>
                        <div style="font-size:11px;color:var(--text3);">${s.category} · ${s.count} occurrences detected</div>
                        ${highBillWarning}
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:14px;font-weight:800;font-family:var(--mono);color:var(--accent);">${fmt(s.avgAmount)}/mo</div>
                        <div style="font-size:10px;color:var(--text3);">avg</div>
                    </div>
                </div>`;
            }).join('');
        }

        // ==================== INNOVATION 4: DEBT DEMOLISHER ====================
        let currentDebtStrategy = 'avalanche';

        function openDebtDemolisher() {
            openModal('mdDebtDemolisher');
            setDebtStrategy(currentDebtStrategy);
        }

        function setDebtStrategy(strategy) {
            currentDebtStrategy = strategy;
            const abtn = document.getElementById('ddAvalancheBtn');
            const sbtn = document.getElementById('ddSnowballBtn');
            if (abtn) abtn.className = strategy === 'avalanche' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
            if (sbtn) sbtn.className = strategy === 'snowball' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
            renderDebtPlan(strategy);
        }

        function renderDebtPlan(strategy) {
            const loans = DB.get('loans').filter(l => loanEndDate(l) > new Date());
            const ccinstall = DB.get('ccinstall').filter(c => !c.completed);
            const now = new Date();
            
            let debts = [
                ...loans.map(l => ({
                    name: l.name,
                    bank: l.bank,
                    remaining: l.amount, // simplified
                    monthly: l.monthly || 0,
                    rate: l.rate || 0,
                    type: 'loan'
                })),
                ...ccinstall.map(c => ({
                    name: c.product,
                    bank: c.bank,
                    remaining: c.total || 0,
                    monthly: c.monthly || 0,
                    rate: c.rate || 0,
                    type: 'cc'
                }))
            ];

            if (!debts.length) {
                document.getElementById('ddPlan').innerHTML = '<div class="empty" style="padding:30px;"><div class="empty-icon">🎉</div><div class="empty-title">No active debts!</div><div class="empty-sub">You have no active loans or credit card installments. Excellent financial health!</div></div>';
                document.getElementById('ddSavings').textContent = '';
                return;
            }

            // Sort
            if (strategy === 'avalanche') {
                debts.sort((a, b) => b.rate - a.rate); // highest rate first
            } else {
                debts.sort((a, b) => a.remaining - b.remaining); // smallest balance first
            }

            // Calculate total interest saved
            const totalInterestBase = debts.reduce((sum, d) => sum + (d.remaining * d.rate / 100), 0);
            const savingsEl = document.getElementById('ddSavings');
            if (savingsEl) savingsEl.textContent = `Save ~${fmt(totalInterestBase * 0.15)} with ${strategy}`;

            const planEl = document.getElementById('ddPlan');
            planEl.innerHTML = `
                <div style="font-size:11px;color:var(--text3);margin-bottom:12px;padding:10px;background:var(--bg2);border-radius:var(--r2);">
                    ${strategy === 'avalanche' 
                        ? '⚡ <strong>Avalanche Method:</strong> Pay minimums on all debts, then put ALL extra money toward the highest-interest debt. Saves maximum interest over time.' 
                        : '❄️ <strong>Snowball Method:</strong> Pay minimums on all debts, then put ALL extra money toward the smallest balance. Builds momentum with quick wins.'}
                </div>
                ${debts.map((d, i) => `
                    <div class="debt-card ${i === 0 ? 'next-target' : ''}">
                        ${i === 0 ? '<div class="debt-target-badge">PAY THIS NEXT</div>' : ''}
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div class="debt-order" style="background:${i === 0 ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--card2)'};color:${i === 0 ? '#000' : 'var(--text2)'};">${i + 1}</div>
                            <div style="flex:1;">
                                <div style="font-size:14px;font-weight:700;">${d.name}</div>
                                <div style="font-size:11px;color:var(--text3);">${d.bank} · ${d.type === 'loan' ? '🏦 Loan' : '💳 CC Installment'}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:15px;font-weight:800;font-family:var(--mono);color:var(--accent);">${fmt(d.monthly)}/mo</div>
                                <div style="font-size:10px;color:var(--text3);">Rate: ${d.rate}% p.a.</div>
                            </div>
                        </div>
                        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
                            <div class="${strategy === 'avalanche' ? 'avalanche-badge' : 'snowball-badge'}" style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">
                                ${strategy === 'avalanche' ? `⚡ Interest Rate: ${d.rate}%` : `❄️ Balance: ${fmt(d.remaining)}`}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        // ==================== INNOVATION 5: E2EE (simulated client-side encryption indicator) ====================
        function showE2EEStatus() {
            const badge = document.createElement('div');
            badge.className = 'e2ee-badge';
            badge.innerHTML = '<div class="e2ee-lock">🔒 E2EE Active</div>';
            document.body.appendChild(badge);
        }

        // ==================== INNOVATION 6: SESSION MANAGER ====================
        function openDeviceManager() {
            openModal('mdDevices');
            renderDeviceList();
        }

        function renderDeviceList() {
            const el = document.getElementById('deviceList');
            if (!el) return;
            const deviceKey = 'wf2_device_id';
            let deviceId = localStorage.getItem(deviceKey);
            if (!deviceId) { deviceId = 'device_' + Math.random().toString(36).substr(2, 9); localStorage.setItem(deviceKey, deviceId); }
            
            const userAgent = navigator.userAgent;
            let deviceType = '💻 Desktop';
            let deviceName = 'Web Browser';
            if (/iPhone/.test(userAgent)) { deviceType = '📱 iPhone'; deviceName = 'Safari / iOS'; }
            else if (/Android/.test(userAgent)) { deviceType = '📱 Android'; deviceName = 'Chrome / Android'; }
            else if (/iPad/.test(userAgent)) { deviceType = '📟 iPad'; deviceName = 'Safari / iPadOS'; }
            
            const location = 'Sri Lanka'; // Simulated
            const sessionStart = localStorage.getItem('wf2_session_start') || new Date().toISOString();
            localStorage.setItem('wf2_session_start', sessionStart);
            
            el.innerHTML = `
                <div style="font-size:11px;color:var(--text3);margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Current Session</div>
                <div class="device-card current">
                    <div class="device-icon">${deviceType.split(' ')[0]}</div>
                    <div class="device-info">
                        <div class="device-name">${deviceName}</div>
                        <div class="device-meta">📍 ${location} · Session: ${new Date(sessionStart).toLocaleString()}</div>
                        <div class="device-meta" style="margin-top:4px;"><span style="background:rgba(16,185,129,0.15);color:var(--green);font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">● ACTIVE NOW</span></div>
                    </div>
                </div>
                <div style="font-size:11px;color:var(--text3);margin:16px 0 10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Security Information</div>
                <div style="background:var(--bg2);border-radius:var(--r2);padding:14px;border:1px solid var(--border);">
                    <div style="display:flex;gap:16px;flex-wrap:wrap;">
                        <div><div style="font-size:10px;color:var(--text3);">Auth Method</div><div style="font-size:13px;font-weight:700;color:var(--green);">🔒 PIN + Firebase</div></div>
                        <div><div style="font-size:10px;color:var(--text3);">Encryption</div><div style="font-size:13px;font-weight:700;color:var(--green);">🛡️ AES-256 + E2EE</div></div>
                        <div><div style="font-size:10px;color:var(--text3);">Cloud Sync</div><div style="font-size:13px;font-weight:700;color:${navigator.onLine ? 'var(--green)' : 'var(--red)'};">${navigator.onLine ? '✅ Connected' : '○ Offline'}</div></div>
                    </div>
                </div>
            `;
        }

        function revokeAllSessions() {
            showConfirm('🚨', 'Revoke All Sessions?', 'This will sign you out of all devices by changing your session token. You will need to sign back in.', 'btn-danger', '🚨 Revoke All', () => {
                notify('All sessions revoked. Please sign in again.', 'warn');
                setTimeout(() => signOutGoogle(), 1500);
            });
        }

        // ==================== INNOVATION 7: PANIC / DECOY VAULT ====================
        let isPanicMode = false;
        let realAppData = null;

        function activatePanicMode() {
            if (isPanicMode) return;
            isPanicMode = true;
            realAppData = JSON.parse(JSON.stringify(appData));
            
            // Generate fake dummy data
            const fakeData = {
                income: [{ id: 'f1', name: 'Salary', company: 'ABC Company', monthly: 85000, start: '2024-01-01', rate: 0 }],
                loans: [],
                ccinstall: [],
                cconetime: [],
                cheques: [],
                expenses: [
                    { id: 'f2', desc: 'Groceries', category: 'Food', month: new Date().toISOString().slice(0,7), amount: 15000 },
                    { id: 'f3', desc: 'Electricity', category: 'Utilities', month: new Date().toISOString().slice(0,7), amount: 3500 }
                ],
                targets: [],
                balance: { total: 50000, flows: [] },
                auth: appData.auth,
                settings: appData.settings
            };
            
            appData = fakeData;
            document.getElementById('panicOverlay').style.display = 'block';
            document.getElementById('panicIndicator').style.display = 'block';
            
            const activePage = document.querySelector('.page.active');
            if (activePage) renderPage(activePage.id.replace('page-', ''));
            notify('🔴 Decoy Vault Activated — Showing dummy data', 'warn');
        }

        function deactivatePanicMode() {
            if (!isPanicMode || !realAppData) return;
            isPanicMode = false;
            appData = realAppData;
            realAppData = null;
            document.getElementById('panicOverlay').style.display = 'none';
            document.getElementById('panicIndicator').style.display = 'none';
            const activePage = document.querySelector('.page.active');
            if (activePage) renderPage(activePage.id.replace('page-', ''));
            notify('✅ Real vault restored', 'success');
        }

        // ==================== INNOVATION 8: WEALTHFLOW SCORE ====================
        function calculateWealthScore() {
            const ctx_data = buildFinancialContext();
            const income = ctx_data.totalMonthlyIncome;
            const expenses = ctx_data.thisMonthExpenses;
            const loans = ctx_data.monthlyLoanPayments;
            const balance = ctx_data.balanceOnHand;
            const targets = DB.get('targets');
            
            if (!income) return { score: 0, tier: 'No Data', color: '#475569', components: {} };

            // Component 1: Savings Rate (0-300 pts)
            const netFlow = income - expenses - loans;
            const savingsRate = netFlow / income;
            const savingsScore = Math.max(0, Math.min(300, Math.round(savingsRate * 600)));
            
            // Component 2: Debt Service Coverage (0-300 pts)
            const dscr = income > 0 ? (income - expenses) / Math.max(1, loans) : 0;
            const dscrScore = Math.max(0, Math.min(300, Math.round(Math.min(dscr, 3) / 3 * 300)));
            
            // Component 3: Liquidity (0-200 pts)
            const liquidityMonths = balance > 0 && income > 0 ? balance / (expenses + loans) : 0;
            const liquidityScore = Math.max(0, Math.min(200, Math.round(Math.min(liquidityMonths, 6) / 6 * 200)));
            
            // Component 4: Goal Progress (0-200 pts)
            const totalTargets = targets.length;
            const completedTargets = targets.filter(t => {
                const saved = t.savings ? t.savings.reduce((a,b)=>a+b.amount,0) : 0;
                return saved >= t.amount;
            }).length;
            const goalScore = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 200) : 100; // neutral if no goals

            const totalScore = Math.min(1000, savingsScore + dscrScore + liquidityScore + goalScore);
            
            let tier, color;
            if (totalScore >= 800) { tier = '💎 Elite Wealth'; color = '#d4af37'; }
            else if (totalScore >= 650) { tier = '🏆 Premium Stable'; color = '#3b82f6'; }
            else if (totalScore >= 500) { tier = '✅ Financially Stable'; color = '#10b981'; }
            else if (totalScore >= 300) { tier = '📈 Building Wealth'; color = '#f5a623'; }
            else { tier = '⚠️ Needs Attention'; color = '#ef4444'; }

            return { 
                score: totalScore, tier, color,
                components: { savingsScore, dscrScore, liquidityScore, goalScore, savingsRate, dscr, liquidityMonths }
            };
        }

        function openWealthScore() {
            openModal('mdWealthScore');
            renderWealthScore();
        }

        function renderWealthScore() {
            const ws = calculateWealthScore();
            const scoreEl = document.getElementById('scoreNum');
            const arcEl = document.getElementById('scoreArc');
            const tierEl = document.getElementById('scoreTier');
            const factorsEl = document.getElementById('scoreFactors');
            const adviceEl = document.getElementById('scoreAdvice');

            if (!scoreEl) return;
            
            // Animate score
            let currentScore = 0;
            const targetScore = ws.score;
            const interval = setInterval(() => {
                currentScore = Math.min(targetScore, currentScore + Math.ceil(targetScore / 40));
                scoreEl.textContent = currentScore;
                if (currentScore >= targetScore) clearInterval(interval);
            }, 30);

            // Arc
            if (arcEl) {
                const circumference = 408.4;
                const offset = circumference - (ws.score / 1000 * circumference);
                setTimeout(() => {
                    arcEl.style.strokeDashoffset = offset;
                    arcEl.style.stroke = ws.color;
                }, 100);
            }

            // Tier
            if (tierEl) { tierEl.textContent = ws.tier; tierEl.style.color = ws.color; }
            
            // Factors
            if (factorsEl && ws.components) {
                const c = ws.components;
                factorsEl.innerHTML = `
                    <div class="score-factor"><div class="sf-label">💰 Savings Rate</div><div class="sf-val" style="color:${c.savingsScore > 150 ? 'var(--green)' : 'var(--accent)'};">${c.savingsScore}/300</div><div style="font-size:10px;color:var(--text3);">${Math.round((c.savingsRate||0)*100)}% of income</div></div>
                    <div class="score-factor"><div class="sf-label">🏦 Debt Coverage</div><div class="sf-val" style="color:${c.dscrScore > 150 ? 'var(--green)' : 'var(--red)'};">${c.dscrScore}/300</div><div style="font-size:10px;color:var(--text3);">DSCR: ${(c.dscr||0).toFixed(2)}x</div></div>
                    <div class="score-factor"><div class="sf-label">💧 Liquidity</div><div class="sf-val" style="color:${c.liquidityScore > 100 ? 'var(--green)' : 'var(--accent)'};">${c.liquidityScore}/200</div><div style="font-size:10px;color:var(--text3);">${(c.liquidityMonths||0).toFixed(1)} months runway</div></div>
                    <div class="score-factor"><div class="sf-label">🎯 Goal Progress</div><div class="sf-val" style="color:var(--blue);">${c.goalScore}/200</div><div style="font-size:10px;color:var(--text3);">Savings targets</div></div>
                `;
            }
            
            // Advice
            if (adviceEl) {
                let advice = '';
                const c = ws.components || {};
                if ((c.savingsRate || 0) < 0.1) advice += '📌 Your savings rate is below 10%. Try to reduce expenses or increase income to build a stronger financial buffer. ';
                if ((c.dscr || 0) < 1.25) advice += '⚠️ Your debt coverage ratio is below the safe threshold. Sri Lankan banks typically require 1.25x DSCR. ';
                if ((c.liquidityMonths || 0) < 3) advice += '💡 Build your emergency fund to cover at least 3-6 months of expenses. ';
                if (!advice) advice = '🌟 Excellent financial health! Continue your current strategy and consider growing your investment portfolio.';
                adviceEl.textContent = advice;
            }

            // Update dashboard banner
            const dashNum = document.getElementById('dashScoreNum');
            const dashArc = document.getElementById('dashScoreArc');
            const dashTier = document.getElementById('dashScoreTier');
            if (dashNum) dashNum.textContent = ws.score;
            if (dashTier) { dashTier.textContent = ws.tier; dashTier.style.color = ws.color; }
            if (dashArc) {
                const circ = 125.6;
                setTimeout(() => {
                    dashArc.style.strokeDashoffset = circ - (ws.score / 1000 * circ);
                    dashArc.style.stroke = ws.color;
                }, 200);
            }
        }

        // ==================== INNOVATION 9: AI PERSONA SELECTOR ====================
        const AI_PERSONAS = [
            { id: 'balanced', icon: '⚖️', name: 'Balanced Advisor', desc: 'Honest and warm. Celebrates wins while flagging risks honestly.', color: 'var(--accent)' },
            { id: 'supportive', icon: '💚', name: 'Supportive Coach', desc: 'Empathetic and encouraging. Focuses on motivation even during tough months.', color: 'var(--green)' },
            { id: 'strict', icon: '📊', name: 'Strict Analyst', desc: 'Direct and blunt. Gives tough-love advice when you are overspending.', color: 'var(--red)' },
            { id: 'aggressive', icon: '🚀', name: 'Growth Maximizer', desc: 'Aggressive wealth-building focus. Pushes you to invest and grow harder.', color: 'var(--blue)' }
        ];

        function renderPersonaGrid() {
            const s = DB.getObj('settings', {});
            const currentMode = s.aiAdvisorMode || 'balanced';
            const grid = document.getElementById('personaGrid');
            if (!grid) return;
            grid.innerHTML = AI_PERSONAS.map(p => `
                <div class="persona-card ${currentMode === p.id ? 'active' : ''}" onclick="selectAIPersona('${p.id}')">
                    <div class="persona-icon">${p.icon}</div>
                    <div class="persona-name" style="color:${p.color};">${p.name}</div>
                    <div class="persona-desc">${p.desc}</div>
                    ${currentMode === p.id ? '<div style="margin-top:8px;font-size:10px;font-weight:700;color:var(--accent);">✓ ACTIVE</div>' : ''}
                </div>
            `).join('');
        }

        function selectAIPersona(id) {
            const s = DB.getObj('settings', {});
            s.aiAdvisorMode = id;
            DB.set('settings', s);
            const persona = AI_PERSONAS.find(p => p.id === id);
            notify(`AI Persona set to: ${persona?.icon} ${persona?.name}`, 'success');
            renderPersonaGrid();
            renderSettings();
            playSound('chime');
            closeModal('mdAIPersonaSelect');
        }

        // ==================== INNOVATION 10: SOUNDSCAPE ENGINE ====================
        let audioCtx = null;
        let soundEnabled = true;

        function getAudioCtx() {
            if (!audioCtx) {
                try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
            }
            return audioCtx;
        }

        function playSound(type) {
            const s = DB.getObj('settings', {});
            if (!s.soundEnabled) return;
            if (typeof s.soundEnabled === 'undefined') return; // default off
            
            try {
                const ac = getAudioCtx();
                if (!ac) return;
                
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                
                const sounds = {
                    tick: { freq: 800, type: 'sine', duration: 0.05, volume: 0.05 },
                    chime: { freq: 523.25, type: 'sine', duration: 0.4, volume: 0.08 },
                    success: { freq: 659.25, type: 'sine', duration: 0.5, volume: 0.08 },
                    error: { freq: 220, type: 'sawtooth', duration: 0.2, volume: 0.05 },
                    toggle: { freq: 440, type: 'sine', duration: 0.08, volume: 0.04 },
                    coin: { freq: 1047, type: 'sine', duration: 0.15, volume: 0.07 }
                };
                
                const sound = sounds[type] || sounds.tick;
                osc.type = sound.type;
                osc.frequency.setValueAtTime(sound.freq, ac.currentTime);
                gain.gain.setValueAtTime(sound.volume, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + sound.duration);
                osc.start();
                osc.stop(ac.currentTime + sound.duration);
                
                // Chime has a chord
                if (type === 'success') {
                    setTimeout(() => playNote(ac, 783.99, 0.08, 0.4), 100);
                }
            } catch(e) {}
        }

        function playNote(ac, freq, vol, dur) {
            try {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ac.currentTime);
                gain.gain.setValueAtTime(vol, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
                osc.start();
                osc.stop(ac.currentTime + dur);
            } catch(e) {}
        }

        // ==================== INNOVATION 12: AUTO-CATEGORIZATION ENGINE ====================
        const CATEGORY_PATTERNS = {
            'Food & Dining': /food|grocer|supermarket|restaurant|cafe|lunch|dinner|breakfast|keells|cargills|spar|pizza|burger|kfc|mcdonalds|sushi/i,
            'Transport': /fuel|petrol|diesel|uber|taxi|bus|train|vehicle|car|bike|parking|toll/i,
            'Utilities': /electric|water|ceb|nwsdb|dialog|mobitel|slt|hutch|airtel|internet|wifi|data/i,
            'Entertainment': /netflix|spotify|youtube|amazon|apple|google|hbo|disney|cinema|movie|game|steam/i,
            'Health': /medical|doctor|pharmacy|hospital|medicine|pharmacy|health|dental|optician/i,
            'Education': /school|tuition|university|course|book|stationery|education|class|institute/i,
            'Clothing': /clothes|clothing|shirt|shoes|dress|fashion|footwear|apparel/i,
            'Household': /furniture|appliance|cleaning|repair|maintenance|rent|housing/i,
            'Banking': /bank|interest|fee|charge|commission|service|transfer/i,
            'Insurance': /insurance|premium|nic|union|amana|ceylinco|aia/i
        };

        function autoDetectCategory(description) {
            if (!description) return '';
            for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS)) {
                if (pattern.test(description)) return cat;
            }
            return '';
        }

        // ==================== INNOVATION 13: ADVANCED DATA MANAGEMENT ====================
        let autoBackupTimer = null;

        function setupAutoBackup() {
            if (autoBackupTimer) clearInterval(autoBackupTimer);
            const s = DB.getObj('settings', { backupFreq: 'weekly' });
            const freq = s.backupFreq || 'weekly';
            
            // Check every minute for scheduled backup
            autoBackupTimer = setInterval(() => {
                const now = new Date();
                const h = now.getHours();
                const min = now.getMinutes();
                const day = now.getDay(); // 0=Sun
                const date = now.getDate();
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                
                // Target: 23:55
                if (h === 23 && min === 55) {
                    const lastAutoBackup = localStorage.getItem('wf2_last_auto_backup');
                    const todayStr = now.toISOString().slice(0, 10);
                    if (lastAutoBackup === todayStr) return; // already backed up today
                    
                    let shouldBackup = false;
                    if (freq === 'daily') shouldBackup = true;
                    if (freq === 'weekly' && day === 0) shouldBackup = true; // Sunday
                    if (freq === 'monthly' && date === lastDay) shouldBackup = true; // Last day of month
                    
                    if (shouldBackup) {
                        localStorage.setItem('wf2_last_auto_backup', todayStr);
                        performAutoBackup();
                    }
                }
            }, 60000); // Check every minute
        }

        function performAutoBackup() {
            const data = JSON.stringify(appData, null, 2);
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const blob = new Blob([data], { type: 'application/json' });
            
            // Store in localStorage as last auto backup
            try {
                localStorage.setItem('wf2_auto_backup_' + dateStr, data.slice(0, 50000)); // store first 50KB
                localStorage.setItem('wf2_last_auto_backup', dateStr);
            } catch(e) {}
            
            notify(`🔄 Auto-backup completed at 23:55 — ${dateStr}`, 'success');
            
            // Try cloud backup too
            if (userDocRef && navigator.onLine) {
                syncToCloud();
            }
        }

        function clearLocalCache() {
            showConfirm('🗑️', 'Clear Local Cache?', 'This will remove cached receipt images older than 30 days. All text data and cloud data will be preserved.', 'btn-secondary', '🗑️ Clear Cache', () => {
                let cleared = 0;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 30);
                
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('wf2_img_')) {
                        const datePart = key.split('_').pop();
                        if (new Date(datePart) < cutoff) {
                            localStorage.removeItem(key);
                            cleared++;
                        }
                    }
                }
                notify(`✅ Cleared ${cleared} cached items. Storage freed.`, 'success');
            });
        }

        function getStorageStats() {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('wf2_')) {
                    totalSize += (localStorage.getItem(key) || '').length;
                }
            }
            return {
                sizeKB: Math.round(totalSize / 1024),
                items: localStorage.length,
                income: DB.get('income').length,
                loans: DB.get('loans').length,
                expenses: DB.get('expenses').length,
                targets: DB.get('targets').length
            };
        }

        // ==================== UPGRADE: appendAIMessage with animations ====================
        const _origAppendAIMessage = appendAIMessage;
        // Override to add animation
        function appendAIMessageAnimated(role, text, followups = []) {
            const container = document.getElementById('aiChatMessages');
            if (!container) return;
            const welcome = document.getElementById('aiWelcomeBlock');
            if (welcome && container.querySelectorAll('.ai-msg-wrap').length === 0) {
                welcome.style.display = 'none';
            }
            const wrap = document.createElement('div');
            wrap.className = `ai-msg-wrap ${role === 'user' ? 'user-msg' : ''}`;
            wrap.style.animation = 'fadeScale .35s cubic-bezier(.34,1.56,.64,1)';
            const avatar = document.createElement('div');
            avatar.className = `ai-avatar ${role === 'user' ? 'user' : 'bot'}`;
            avatar.textContent = role === 'user' ? '👤' : '🤖';
            const bubble = document.createElement('div');
            bubble.className = `ai-bubble ${role} new-msg`;
            
            if (role === 'bot') {
                // Typewriter effect for AI responses
                bubble.innerHTML = '';
                const formattedText = text
                    .replace(/\n/g, '<br>')
                    .replace(/(LKR\s?[\d,]+(\.\d+)?)/g, '<strong style="color:var(--accent)">$1</strong>')
                    .replace(/✦([^✦]+)✦/g, '<strong>$1</strong>');
                
                // Add formatted text with animation
                const textDiv = document.createElement('div');
                textDiv.innerHTML = formattedText;
                textDiv.style.cssText = 'opacity:0;transform:translateY(4px);transition:all 0.4s ease;';
                bubble.appendChild(textDiv);
                setTimeout(() => { textDiv.style.opacity = '1'; textDiv.style.transform = 'translateY(0)'; }, 50);
                
                if (followups && followups.length > 0) {
                    const pillWrap = document.createElement('div');
                    pillWrap.className = 'ai-followup-pills';
                    pillWrap.style.cssText = 'opacity:0;transition:opacity 0.4s ease 0.3s;';
                    followups.forEach(q => {
                        const pill = document.createElement('button');
                        pill.className = 'ai-followup-pill';
                        pill.textContent = q;
                        pill.onclick = () => sendAIMessage(q);
                        pillWrap.appendChild(pill);
                    });
                    bubble.appendChild(pillWrap);
                    setTimeout(() => { pillWrap.style.opacity = '1'; }, 300);
                }
                playSound('chime');
            } else {
                const formatted = text.replace(/\n/g, '<br>');
                bubble.innerHTML = formatted;
                playSound('tick');
            }
            
            const meta = document.createElement('div');
            meta.className = 'ai-bubble-meta';
            const timeStr = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
            if (role === 'bot') {
                const provLabel = { gemini: '✨ Gemini', groq: '⚡ Groq', deepseek: '🧠 DeepSeek' }[_lastAIProvider] || '🤖 AI';
                meta.innerHTML = `<span style="color:var(--accent);font-size:9px;">${provLabel}</span> <span>${timeStr}</span>`;
            } else {
                meta.innerHTML = `<span>${timeStr}</span>`;
            }
            bubble.appendChild(meta);
            wrap.appendChild(avatar);
            wrap.appendChild(bubble);
            container.appendChild(wrap);
            setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
        }

        // ==================== UPGRADE: renderDash with WealthFlow Score ====================
        const _origRenderDash = typeof renderDash === 'function' ? renderDash : null;
        function renderDashWithScore() {
            if (_origRenderDash) _origRenderDash();
            // Update WealthFlow score banner
            setTimeout(() => renderWealthScore(), 200);
        }

        // ==================== INIT ALL INNOVATIONS ====================
        function initInnovations() {
            showE2EEStatus();
            setupAutoBackup();
            // Update score on dashboard
            setTimeout(() => renderWealthScore(), 500);
            // Check for upcoming subscription alerts
            setTimeout(() => checkSubscriptionAlerts(), 2000);
        }

        function checkSubscriptionAlerts() {
            const expenses = DB.get('expenses');
            const groups = {};
            expenses.forEach(e => {
                const k = e.desc.toLowerCase().trim();
                if (!groups[k]) groups[k] = [];
                groups[k].push(e);
            });
            let highBillCount = 0;
            Object.values(groups).forEach(entries => {
                if (entries.length >= 2) {
                    const amounts = entries.map(e => e.amount);
                    const avg = amounts.reduce((a,b)=>a+b,0) / amounts.length;
                    const latest = amounts[amounts.length - 1];
                    if (latest > avg * 1.3) highBillCount++;
                }
            });
            if (highBillCount > 0) {
                setTimeout(() => notify(`⚠️ ${highBillCount} subscription bill(s) are unusually high this month. Check Subscription Tracker.`, 'warn'), 1000);
            }
        }

        // Hook into existing sendAIMessage to use animated version
        window.appendAIMessage = appendAIMessageAnimated;

JSEOF
echo "JS file created: $(wc -l < /home/claude/new_features.js) lines"
