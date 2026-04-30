// =====================================================
// WEALTHFLOW v5.1 - Infinity Cloud Financial System
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyBpIRHoNQJTeMIVYime_oVjBXiQWNH18K4",
    authDomain: "wealthflow-6dffb.firebaseapp.com",
    projectId: "wealthflow-6dffb",
    storageBucket: "wealthflow-6dffb.firebasestorage.app",
    messagingSenderId: "1020193373377",
    appId: "1:1020193373377:web:52ae0662d35b02037f6840",
    measurementId: "G-FKEKQGG8MZ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

try { db.enablePersistence(); } catch (err) { console.warn("Offline persistence issue:", err.code); }
const userDocRef = db.collection('users').doc('master_profile');

// ==================== STATE MANAGEMENT ====================
let appData = { 
    auth: {}, income: [], loans: [], ccinstall: [], cconetime: [], 
    cheques: [], expenses: [], targets: [], balance: {total:0, flows:[]}, 
    settings: { backupFreq: 'weekly', lastBackup: null, theme: 'dark', autoLock: 15, haptics: true } 
};
let isInitialised = false;
let inactivityTimer = 0;

const DB = {
    get(k, def=[]) { return appData[k] !== undefined ? appData[k] : def; },
    getObj(k, def={}) { return appData[k] !== undefined ? appData[k] : def; },
    set(k, v) { 
        appData[k] = v;
        localStorage.setItem('wf2_'+k, JSON.stringify(v));
        syncToCloud();
    }
};

function syncToCloud() {
    if(!navigator.onLine) {
        setSyncStatus('offline');
        return;
    }
    setSyncStatus('syncing');
    userDocRef.set(appData, { merge: true }).then(() => {
        setTimeout(() => setSyncStatus('online'), 500);
    }).catch(err => {
        console.error("Cloud sync error:", err);
        setSyncStatus('offline');
    });
}

function setSyncStatus(state) {
    const badge = $('onlineBadge');
    const setBadge = $('settingsCloudStatus');
    const syncInd = $('syncIndicator');
    
    if(state === 'syncing') {
        if(badge) { badge.className = 'online-badge on'; $('onlineText').textContent = 'Online'; }
        if(syncInd) { syncInd.classList.add('active'); }
        if(setBadge) { setBadge.className = 'badge syncing'; setBadge.textContent = 'Syncing...'; }
    } else if (state === 'online') {
        if(badge) { badge.className = 'online-badge on'; $('onlineText').textContent = 'Online'; }
        if(syncInd) { syncInd.classList.remove('active'); }
        if(setBadge) { setBadge.className = 'badge bg-g'; setBadge.textContent = '● Securely Connected'; }
    } else {
        if(badge) { badge.className = 'online-badge off'; $('onlineText').textContent = 'Offline'; }
        if(syncInd) { syncInd.classList.remove('active'); }
        if(setBadge) { setBadge.className = 'badge bg-r'; setBadge.textContent = '○ Offline Mode'; }
    }
}

// ==================== UTILITIES ====================
const $ = id => document.getElementById(id);
const uid = () => '_' + Date.now().toString(36) + Math.random().toString(36).substr(2,5);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const today = () => { const d=new Date(); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); };
const p2 = n => String(n).padStart(2,'0');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtN = (n) => { n = parseFloat(n) || 0; return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); };
const fmt = (n) => 'LKR ' + fmtN(n);
const fmtS = (n) => {
    n = parseFloat(n) || 0; const abs = Math.abs(n);
    if(abs >= 1000000) return 'LKR ' + (n/1000000).toFixed(2) + 'M';
    if(abs >= 100000) return 'LKR ' + (n/100000).toFixed(2) + 'L';
    return 'LKR ' + fmtN(n);
};

const parseMoney = (s) => parseFloat(String(s).replace(/,/g,'')) || 0;
function emptyState(icon, title, sub) { return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`; }
function monthStrFmt(ymd) { const d = new Date(ymd); return MONTHS_S[d.getMonth()] + ' ' + d.getFullYear(); }
function getNextOccurenceDate(startDateStr) {
    const s = new Date(startDateStr);
    const n = new Date();
    const result = new Date(n.getFullYear(), n.getMonth(), s.getDate());
    if (result < n) result.setMonth(result.getMonth() + 1);
    return result;
}

const BANKS = ['AMEX','Bank of Ceylon (BOC)','Commercial Bank','DFCC Bank','Hatton National Bank (HNB)','Nations Trust Bank (NTB)','Pan Asia Bank','Peoples Bank','Sampath Bank','Seylan Bank','Union Bank','Other'];
function populateBankSelects() {
    ['l_bank','c_bank','ot_bank','chq_bank'].forEach(id => {
        const el = $(id); if(!el) return;
        el.innerHTML = '<option value="">Select Bank...</option>' + BANKS.map(b=>`<option>${b}</option>`).join('');
    });
}

function initMoneyInputs() {
    document.querySelectorAll('.money-input').forEach(inp => {
        inp.addEventListener('input', function() {
            let raw = this.value.replace(/[^0-9.]/g,'');
            let parts = raw.split('.');
            let int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
            let dec = parts.length > 1 ? '.' + parts[1].slice(0,2) : '';
            this.value = int + dec;
        });
        inp.addEventListener('blur', function() { let raw = parseMoney(this.value); if(raw > 0) this.value = fmtN(raw); });
        inp.addEventListener('focus', function() { let raw = parseMoney(this.value); if(raw > 0) this.value = String(raw); });
    });

    document.querySelectorAll('.auth-numpad-only').forEach(inp => {
        inp.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); });
    });
}

// ==================== AUTO LOCK ====================
function resetAutoLockTimer() { inactivityTimer = 0; }
document.onmousemove = resetAutoLockTimer;
document.onkeypress = resetAutoLockTimer;
document.ontouchstart = resetAutoLockTimer;

setInterval(() => {
    if (!$('app').classList.contains('show')) return; 
    const limit = DB.getObj('settings').autoLock || 15;
    if (limit === 0) return;
    inactivityTimer++;
    if (inactivityTimer >= limit) {
        lockApp();
    }
}, 60000);

function lockApp() {
    $('app').classList.remove('show');
    $('authScreen').classList.add('show');
    pinMode = 'login';
    showAuthView('authLogin');
    notify('Session locked due to inactivity.', 'info');
}

// ==================== AI INSIGHTS ====================
async function generateAIInsights() {
    const area = $('aiInsightsArea');
    area.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:var(--accent);"><div class="online-dot" style="animation: dotPulse 1.5s infinite;"></div><span style="font-weight:600;">Analysing your portfolio...</span></div>';
    
    try {
        const inc = DB.get('income').reduce((s, x) => s + x.monthly, 0);
        const exp = DB.get('expenses').reduce((s, x) => s + x.amount, 0);
        const balData = DB.getObj('balance', {total:0});
        
        const prompt = `Act as an expert Sri Lankan financial advisor for Sachintha Gaurawa. 
        Context: My current estimated monthly income from investments is LKR ${inc}. 
        My tracked monthly expenses are LKR ${exp}. 
        My base balance tracked is LKR ${balData.total}. 
        Provide a concise, professional, and insightful 2-to-3 sentence financial recommendation based on this data.`;
        
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        if (data.reply) {
            area.innerHTML = `<span style="color:#fff; font-weight:500;">${data.reply}</span>`;
        } else {
            area.innerHTML = '<span style="color:var(--red);">AI analysis currently unavailable.</span>';
        }
    } catch (e) {
        area.innerHTML = '<span style="color:var(--red);">Connection issue. Please verify your network to communicate with the AI Engine.</span>';
    }
}

// ==================== GOOGLE DRIVE BACKUP ENGINE ====================
let gapiToken = null;
let tokenClient;

function initDriveAuth() {
    if (typeof google === 'undefined') return;
    
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '1020193373377-paqvs1sgqr75l0lbcs9hju02fmouc0da.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                gapiToken = tokenResponse.access_token;
                // Cache the token securely for 1 hour
                const expiry = Date.now() + ((tokenResponse.expires_in - 10) * 1000);
                localStorage.setItem('wf_drive_token', JSON.stringify({ token: gapiToken, expiry }));
                
                if (window.pendingDriveAction === 'backup') executeDriveBackup();
                if (window.pendingDriveAction === 'restore') fetchDriveBackups();
            }
        }
    });

    const cached = localStorage.getItem('wf_drive_token');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Date.now() < parsed.expiry) {
                gapiToken = parsed.token;
            } else {
                localStorage.removeItem('wf_drive_token');
            }
        } catch(e) {}
    }
}

window.addEventListener('load', () => {
    setTimeout(initDriveAuth, 2000);
});

async function requestDrivePermission(action) {
    window.pendingDriveAction = action;
    if (gapiToken) {
        if (action === 'backup') executeDriveBackup();
        if (action === 'restore') fetchDriveBackups();
        return;
    }
    
    if (tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        notify('Google Services failing to load. Check connection.', 'error');
    }
}

async function executeDriveBackup() {
    if (!gapiToken) return;
    notify('Uploading backup to Google Drive...', 'info');
    
    const fileContent = JSON.stringify(appData);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
        name: `WealthFlow_Backup_${today()}_${Date.now()}.json`,
        mimeType: 'application/json',
        parents: ['1M8_zbBavMm_SeZiwjboYb3rvlczHyIVz']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + gapiToken },
            body: form
        });
        
        if (res.ok) {
            const s = DB.getObj('settings');
            s.lastBackup = new Date().toISOString();
            DB.set('settings', s);
            notify('Drive backup complete! ☁️', 'success');
        } else {
            notify('Drive upload failed. Token might be expired.', 'error');
            localStorage.removeItem('wf_drive_token');
            gapiToken = null;
        }
    } catch (e) {
        console.error(e);
        notify('Network error during backup.', 'error');
    }
}

async function fetchDriveBackups() {
    if (!gapiToken) return;
    const sel = $('restoreSelect');
    sel.innerHTML = '<option>Searching Drive...</option>';
    
    try {
        const q = encodeURIComponent(`'1M8_zbBavMm_SeZiwjboYb3rvlczHyIVz' in parents and name contains 'WealthFlow_Backup' and trashed = false`);
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=5&fields=files(id,name,createdTime)`, {
            headers: { 'Authorization': 'Bearer ' + gapiToken }
        });
        
        if(!res.ok) {
            localStorage.removeItem('wf_drive_token');
            gapiToken = null;
            throw new Error('Token Expired');
        }

        const data = await res.json();
        if (data.files && data.files.length > 0) {
            sel.innerHTML = data.files.map(f => `<option value="${f.id}">${new Date(f.createdTime).toLocaleString()}</option>`).join('');
            $('restoreBtn').disabled = false;
        } else {
            sel.innerHTML = '<option value="">No backups found in folder</option>';
        }
    } catch(e) {
        sel.innerHTML = '<option value="">Failed to fetch backups</option>';
        if(e.message === 'Token Expired') {
             notify('Session expired. Please click restore again to re-authenticate.', 'warn');
        }
    }
}

async function executeDriveRestore() {
    const fileId = $('restoreSelect').value;
    if (!fileId || !gapiToken) return;

    try {
        notify('Downloading backup...', 'info');
        $('restoreBtn').disabled = true;
        
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': 'Bearer ' + gapiToken }
        });
        
        if (!res.ok) throw new Error("Download failed");
        
        const restoredData = await res.json();
        
        appData = restoredData;
        syncToCloud();
        closeModal('mdRestoreCloud');
        notify('Data restored successfully! Rebooting...', 'success');
        setTimeout(() => location.reload(), 1500);

    } catch(e) {
        console.error(e);
        notify('Failed to restore backup.', 'error');
        $('restoreBtn').disabled = false;
    }
}

// ==================== AUTH / PIN SYSTEM ====================
async function sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

let pinBuffer = '', pinMode = 'login', pinTemp = '';

function buildNumpad(containerId) {
    const el = $(containerId); if(!el) return;
    const keys = [1,2,3,4,5,6,7,8,9,'','0','⌫'];
    const subs = {1:'',2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ',0:'+'};
    el.innerHTML = keys.map(k => {
        if(k==='') return '<div class="numpad-empty"></div>';
        if(k==='⌫') return `<button class="npb del" onclick="pinBackspace('${containerId}')">${k}</button>`;
        return `<button class="npb" onclick="pinDigit('${containerId}','${k}')"><span>${k}</span>${subs[k]?`<span class="npb-sub">${subs[k]}</span>`:''}</button>`;
    }).join('');
}

function buildDots(containerId, len=6, filled=0) {
    const el = $(containerId); if(!el) return;
    el.innerHTML = Array.from({length:len}, (_,i) => `<div class="pin-dot ${i<filled?'filled':''}"></div>`).join('');
}

function initAuthUI() {
    buildNumpad('loginPad'); buildNumpad('setupPad'); buildNumpad('newPinPad');
    buildDots('loginDots'); buildDots('setupDots'); buildDots('newPinDots');
}

function pinDigit(padId, digit) {
    if(pinBuffer.length >= 6) return;
    pinBuffer += digit;
    const dotMap = {loginPad:'loginDots', setupPad:'setupDots', newPinPad:'newPinDots'};
    buildDots(dotMap[padId], 6, pinBuffer.length);
    if(pinBuffer.length === 6) setTimeout(() => handlePinComplete(padId), 120);
}

function pinBackspace(padId) {
    if(pinBuffer.length === 0) return;
    pinBuffer = pinBuffer.slice(0,-1);
    const dotMap = {loginPad:'loginDots', setupPad:'setupDots', newPinPad:'newPinDots'};
    buildDots(dotMap[padId], 6, pinBuffer.length);
}

document.addEventListener('keydown', (e) => {
    if ($('authScreen').classList.contains('show')) {
        let activePadId = '';
        if ($('authLogin').style.display !== 'none') activePadId = 'loginPad';
        else if ($('authSetup').style.display !== 'none') activePadId = 'setupPad';
        else if ($('authNewPin').style.display !== 'none') activePadId = 'newPinPad';
        if (activePadId) {
            if (e.key >= '0' && e.key <= '9') { pinDigit(activePadId, e.key); } 
            else if (e.key === 'Backspace') { pinBackspace(activePadId); }
        }
    }
});

async function handlePinComplete(padId) {
    const pin = pinBuffer;
    pinBuffer = '';

    if(padId === 'loginPad') {
        const stored = DB.getObj('auth').pin;
        const hash = await sha256(pin + 'wf_salt_sg2026');
        if(hash === stored) {
            $('loginErr').textContent = '';
            resetAutoLockTimer();
            launchApp();
        } else {
            buildDots('loginDots', 6, 0);
            $('loginErr').textContent = '❌ Incorrect PIN. Please try again.';
            document.querySelectorAll('#loginDots .pin-dot').forEach(d=>d.classList.add('error'));
            setTimeout(() => { buildDots('loginDots', 6, 0); $('loginErr').textContent=''; }, 1200);
        }
    } else if(padId === 'setupPad') {
        if(pinMode === 'setup') {
            pinTemp = pin;
            pinMode = 'setup_confirm';
            $('setupSub').textContent = 'Re-enter your PIN to confirm';
            buildDots('setupDots', 6, 0);
        } else if(pinMode === 'setup_confirm') {
            if(pin === pinTemp) {
                const hash = await sha256(pin + 'wf_salt_sg2026');
                const auth = DB.getObj('auth');
                auth.pin = hash;
                DB.set('auth', auth);
                pinMode = 'login'; pinTemp = '';
                showAuthView('authSecQ');
            } else {
                $('setupErr').textContent = '❌ PINs do not match. Try again.';
                buildDots('setupDots', 6, 0);
                pinMode = 'setup'; pinTemp = '';
                $('setupSub').textContent = 'Set a secure 6-digit PIN to protect your data';
                setTimeout(() => $('setupErr').textContent='', 2000);
            }
        }
    } else if(padId === 'newPinPad') {
        if(pinMode === 'newpin') {
            pinTemp = pin;
            pinMode = 'newpin_confirm';
            $('newPinSub').textContent = 'Re-enter your new PIN to confirm';
            buildDots('newPinDots', 6, 0);
        } else if(pinMode === 'newpin_confirm') {
            if(pin === pinTemp) {
                const hash = await sha256(pin + 'wf_salt_sg2026');
                const auth = DB.getObj('auth');
                auth.pin = hash;
                DB.set('auth', auth);
                pinMode = 'login'; pinTemp = '';
                notify('PIN changed successfully! 🔐', 'success');
                showAuthView('authLogin');
            } else {
                $('newPinErr').textContent = '❌ PINs do not match. Try again.';
                buildDots('newPinDots', 6, 0);
                pinMode = 'newpin'; pinTemp = '';
                $('newPinSub').textContent = 'Enter your new 6-digit PIN';
                setTimeout(() => $('newPinErr').textContent='', 2000);
            }
        }
    }
}

function showAuthView(viewId) {
    ['authLogin','authSetup','authForgot','authNewPin','authRecovShow','authSecQ'].forEach(id => {
        const el = $(id); if(el) el.style.display='none';
    });
    const el = $(viewId); if(el) el.style.display='';
    pinBuffer = '';
    buildDots('loginDots', 6, 0);
    buildDots('setupDots', 6, 0);
    buildDots('newPinDots', 6, 0);
}

async function saveSecQ() {
    const sel = $('secQSelect').value;
    const cust = $('customQ')?.value?.trim();
    const ans = $('secAns').value.trim();
    let q = sel; if(sel === 'Custom question') q = cust;
    if(!q || !ans) { $('secQErr').textContent = 'Please fill in all fields.'; return; }

    const hash = await sha256(ans.toLowerCase() + 'wf_ans_sg');
    const code = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const codeHash = await sha256(code + 'wf_code_sg');

    const auth = DB.getObj('auth');
    auth.secQ = q; auth.secAHash = hash; auth.codeHash = codeHash;
    DB.set('auth', auth);

    $('recovCodeDisplay').textContent = code;
    showAuthView('authRecovShow');
}

function copyRecovCode() {
    const code = $('recovCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = $('copyRecovBtn');
        btn.textContent = 'Copied ✓';
        btn.style.background = 'var(--green)';
        btn.style.color = '#fff';
        setTimeout(() => {
            btn.textContent = '📋 Copy Code';
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }).catch(()=>{});
}

function confirmRecovSaved() {
    showAuthView('authLogin');
    notify('Setup complete! Welcome to WealthFlow 🎉', 'success');
}

async function verifyRecovery() {
    const ans = $('recovSecA').value.trim().toLowerCase();
    const code = $('recovCode').value.trim().toUpperCase();
    const auth = DB.getObj('auth');

    if(!auth.secQ) { $('recovErr').textContent = 'No security question set up.'; return; }

    const ansHash = await sha256(ans + 'wf_ans_sg');
    const codeHash = await sha256(code + 'wf_code_sg');

    if(ansHash !== auth.secAHash || codeHash !== auth.codeHash) {
        $('recovErr').textContent = '❌ Incorrect answer or recovery code. Please try again.';
        return;
    }
    $('recovErr').textContent = '';
    pinMode = 'newpin'; pinTemp = '';
    $('newPinSub').textContent = 'Enter your new 6-digit PIN';
    showAuthView('authNewPin');
}

async function changePin() {
    const curr = $('cp_current').value, nw = $('cp_new').value, conf = $('cp_confirm').value;
    if(nw.length !== 6) { $('cp_err').textContent='PIN must be 6 digits'; return; }
    if(nw !== conf) { $('cp_err').textContent='New PINs do not match'; return; }
    const auth = DB.getObj('auth');
    const currHash = await sha256(curr + 'wf_salt_sg2026');
    if(currHash !== auth.pin) { $('cp_err').textContent='Current PIN is incorrect'; return; }
    const newHash = await sha256(nw + 'wf_salt_sg2026');
    auth.pin = newHash;
    DB.set('auth', auth);
    closeModal('mdChangePin');
    $('cp_current').value=''; $('cp_new').value=''; $('cp_confirm').value=''; $('cp_err').textContent='';
    notify('PIN changed successfully! 🔐', 'success');
}

// ==================== BOOT SEQUENCE ====================
window.onload = async function() {
    const splashText = $('spStatus');
    const fillEl = $('spFill');
    let w = 0;
    
    const pInt = setInterval(() => {
        w += (Math.random() * 5);
        if(w > 90) w = 90;
        if(fillEl) fillEl.style.width = w + '%';
    }, 100);

    splashText.textContent = "Securing connection...";
    await sleep(300);

    populateBankSelects();
    initAuthUI();
    initMoneyInputs();
    
    const curY = new Date().getFullYear();
    ['dashYear','mpYear','expPdfYear'].forEach(id => {
        const el = $(id); if(!el) return;
        for(let y=curY-2; y<=curY+4; y++) {
            const o = document.createElement('option'); o.value=y; o.textContent=y;
            if(y===curY) o.selected=true; el.appendChild(o);
        }
    });
    if($('expPdfMonth')) $('expPdfMonth').value = new Date().getMonth();
    ['i_day','ot_date','sav_date','bf_date','bs_date','chq_issue','chq_release'].forEach(id => { const el=$(id); if(el) el.value=today(); });
    ['e_month'].forEach(id => { const el=$(id); if(el) el.value=today().substr(0,7); });

    splashText.textContent = "Fetching cloud state...";

    try {
        const doc = await userDocRef.get();
        if (doc.exists) {
            const cloudData = doc.data();
            Object.keys(cloudData).forEach(key => {
                appData[key] = cloudData[key];
                localStorage.setItem('wf2_'+key, JSON.stringify(cloudData[key]));
            });
        } else {
            await userDocRef.set(appData);
        }
        
        clearInterval(pInt);
        if(fillEl) fillEl.style.width = '100%';
        splashText.textContent = "Decrypting vault...";
        await sleep(300);

        isInitialised = true;
        finishBoot();

        userDocRef.onSnapshot({ includeMetadataChanges: true }, (snap) => {
            if(snap.metadata.hasPendingWrites) {
                setSyncStatus('syncing');
            } else {
                setSyncStatus(navigator.onLine ? 'online' : 'offline');
            }

            if(snap.exists && isInitialised) {
                const cloudData = snap.data();
                Object.keys(cloudData).forEach(key => {
                    appData[key] = cloudData[key];
                    localStorage.setItem('wf2_'+key, JSON.stringify(cloudData[key]));
                });
                if(!snap.metadata.hasPendingWrites && $('app').classList.contains('show')) {
                    const active = document.querySelector('.page.active');
                    if(active) renderPage(active.id.replace('page-',''));
                    updateCCOTBadge();
                    updateChequeBadge();
                }
            }
        });

    } catch(err) {
        console.error("Cloud Error. Using local cache:", err);
        clearInterval(pInt);
        if(fillEl) fillEl.style.width = '100%';
        splashText.textContent = "Working offline...";
        await sleep(600);
        Object.keys(appData).forEach(k => {
            try { const item = localStorage.getItem('wf2_'+k); if(item) appData[k] = JSON.parse(item); } catch(e){}
        });
        isInitialised = true;
        finishBoot();
    }

    setupOnlineStatus();
    updateDateTime();
    setInterval(updateDateTime, 60000);
};

function finishBoot() {
    const auth = DB.getObj('auth');
    $('spStatus').textContent = "Ready.";
    setTimeout(() => {
        $('splash').classList.add('hide');
        setTimeout(() => { if($('splash')) $('splash').style.display='none'; }, 600);
        
        initTheme();
        setupBackupReminder();

        $('authScreen').classList.add('show');
        if(!auth.pin) {
            pinMode = 'setup';
            showAuthView('authSetup');
        } else {
            pinMode = 'login';
            showAuthView('authLogin');
        }
    }, 400);
}

function launchApp() {
    $('authScreen').classList.remove('show');
    $('app').classList.add('show');
    renderPage('dashboard');
    updateCCOTBadge();
    updateChequeBadge();
}

function updateDateTime() {
    const now = new Date();
    if($('sbDate')) $('sbDate').textContent = now.toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric',year:'numeric'}) + ' · ' + now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    if($('curMonthBadge')) $('curMonthBadge').textContent = MONTHS[now.getMonth()] + ' ' + now.getFullYear();
}

function setupOnlineStatus() {
    function updateStatus() {
        if(navigator.onLine) {
            setSyncStatus('online');
            const banner = $('offlineBanner');
            if(banner) banner.classList.remove('show');
            syncToCloud();
        } else {
            setSyncStatus('offline');
            const banner = $('offlineBanner');
            if(banner) banner.classList.add('show');
        }
    }
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

function setupBackupReminder() {
    const settings = DB.getObj('settings', {backupFreq:'weekly',lastBackup:null});
    if(!settings.lastBackup) return;
    const last = new Date(settings.lastBackup);
    const now = new Date();
    const days = Math.floor((now-last)/(1000*86400));
    if(days >= 14) {
        setTimeout(() => notify(`⚠️ It has been ${days} days since your last manual export. Consider downloading a PDF or JSON.`, 'warn'), 3000);
    }
}

function refreshApp(btn) {
    if(btn) {
        btn.classList.remove('spin-once');
        void btn.offsetWidth;
        btn.classList.add('spin-once');
    }
    const active = document.querySelector('.page.active');
    if(active) renderPage(active.id.replace('page-',''));
    updateCCOTBadge();
    updateChequeBadge();
    if(navigator.onLine) {
        syncToCloud();
        notify('System Synchronised ✓', 'success');
    } else {
        notify('Offline: Sync will occur when connection is restored.', 'warn');
    }
}

function notify(msg, type='success') {
    const el = document.createElement('div');
    el.className = `notif ${type}`;
    const icons = {success:'✅',error:'❌',info:'ℹ️',warn:'⚠️'};
    el.innerHTML = `<span class="notif-ico">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    $('notifs').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(), 400); }, 3600);
}

// ==================== MODALS ====================
let editMode = null;
function openModal(id) { $(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { $(id).classList.remove('open'); document.body.style.overflow=''; editMode=null; }
document.addEventListener('keydown', e => {
    if(e.key==='Escape') document.querySelectorAll('.mo.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';});
});
function showConfirm(icon, msg, det, btnClass, btnText, cb) {
    $('confIcon').textContent = icon;
    $('confMsg').textContent = msg;
    $('confDet').textContent = det;
    $('confBtn').className = `btn ${btnClass}`;
    $('confBtn').textContent = btnText;
    $('confBtn').onclick = () => { closeModal('mdConfirm'); if(cb) cb(); };
    openModal('mdConfirm');
}

// ==================== SIDEBAR ====================
const pgTitles = {dashboard:'📊 Dashboard',monthly:'📅 Monthly Plan',income:'💰 Income & Investments',loans:'🏦 Bank Loans',ccinstall:'💳 CC Installments',cconetime:'⏱️ CC One-Time Payments',cheques:'📄 Cheque Tracker',expenses:'🧾 Monthly Expenses',targets:'🎯 Targets & Savings',balance:'⚖️ Balance Tracker',dscr:'📐 DSCR Calculator',settings:'⚙️ System Settings'};
const addBtnMap = {income:'+ Add Source',loans:'+ Add Loan',ccinstall:'+ Add',cconetime:'+ Add',cheques:'+ Add Cheque',expenses:'+ Add Expense',targets:'+ New Target',balance:'Set Balance'};
const addModalMap = {income:'mdIncome',loans:'mdLoan',ccinstall:'mdCCI',cconetime:'mdCCOT',cheques:'mdCheque',expenses:'mdExpense',targets:'mdTarget',balance:'mdBalSet'};

function showPage(name, navEl) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    $('page-'+name).classList.add('active');
    if(navEl) navEl.classList.add('active');
    $('pgTitle').innerHTML = pgTitles[name] || name;
    const tb = $('topAddBtn');
    if(addBtnMap[name]) { tb.style.display=''; tb.textContent=addBtnMap[name]; } else tb.style.display='none';
    closeSb();
    renderPage(name);
}

function handleTopAdd() {
    const active = document.querySelector('.page.active');
    if(!active) return;
    const name = active.id.replace('page-','');
    if(addModalMap[name]) openModal(addModalMap[name]);
}

function renderPage(name) {
    const fn = {dashboard:renderDash,monthly:renderMonthly,income:renderIncome,loans:renderLoans,ccinstall:renderCCI,cconetime:renderCCOT,cheques:renderCheques,expenses:renderExpenses,targets:renderTargets,balance:renderBalance,dscr:renderDSCR,settings:renderSettings};
    if(fn[name]) fn[name]();
}

function openSb() { $('sidebar').classList.add('open'); $('sbOverlay').classList.add('show'); }
function closeSb() { $('sidebar').classList.remove('open'); $('sbOverlay').classList.remove('show'); }

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    $('themeBtn').innerHTML = next === 'dark' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const settings = DB.getObj('settings', {});
    settings.theme = next;
    DB.set('settings', settings);
}

function initTheme() {
    const settings = DB.getObj('settings', {theme:'dark'});
    document.documentElement.setAttribute('data-theme', settings.theme);
    if($('themeBtn')) $('themeBtn').innerHTML = settings.theme === 'dark' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
}

const sortState = {};
function sortList(key, field, btn) {
    if(!sortState[key]) sortState[key] = {field:'',dir:1};
    if(sortState[key].field === field) sortState[key].dir *= -1;
    else { sortState[key].field = field; sortState[key].dir = 1; }
    if(btn) {
        const parent = btn.closest('.sort-bar');
        if(parent) parent.querySelectorAll('.sb-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderPage(key === 'cci' ? 'ccinstall' : key === 'ccot' ? 'cconetime' : key);
}

// ==================== MATH & LOGIC ====================
function calcEMI(principal, annualRate, months) {
    if(annualRate === 0) return principal / months;
    const r = annualRate / 100 / 12;
    return principal * r * Math.pow(1+r,months) / (Math.pow(1+r,months)-1);
}

function calcIncomeM() {
    const amt = parseMoney($('i_amount').value), rate = parseFloat($('i_rate').value)||0, freq = $('i_freq').value;
    let m = 0;
    if(freq==='monthly') m = amt * rate / 100 / 12;
    else if(freq==='annual') m = amt * rate / 100;
    else if(freq==='quarterly') m = amt * rate / 100 / 4;
    $('i_calc').textContent = m>0 ? `→ ${freq==='annual'?'Annual':'Monthly'} return: LKR ${fmtN(m)}` : '';
}

function calcLoanM() {
    const amt = parseMoney($('l_amount').value), rate = parseFloat($('l_rate').value)||0, dur = parseInt($('l_dur').value)||0;
    if(amt>0 && dur>0) {
        let m = rate===0 ? amt/dur : amt*(rate/100/12)*Math.pow(1+rate/100/12,dur)/(Math.pow(1+rate/100/12,dur)-1);
        $('l_calc').textContent = `→ Monthly: LKR ${fmtN(m)} | Total: LKR ${fmtN(m*dur)} | Interest: LKR ${fmtN(m*dur-amt)}`;
    } else $('l_calc').textContent='';
}

function calcCCIM() {
    const tot = parseMoney($('c_total').value), rate = parseFloat($('c_rate').value)||0, dur = parseInt($('c_dur').value)||0;
    if(tot>0 && dur>0) {
        let m = rate===0 ? tot/dur : tot*(rate/100/12)*Math.pow(1+rate/100/12,dur)/(Math.pow(1+rate/100/12,dur)-1);
        $('c_calc').textContent = `→ Monthly: LKR ${fmtN(m)} | Total payable: LKR ${fmtN(m*dur)}`;
    } else $('c_calc').textContent='';
}

// ==================== INCOME ====================
function saveIncome() {
    const name=$('i_name').value.trim(), company=$('i_company').value.trim(), amount=parseMoney($('i_amount').value), rate=parseFloat($('i_rate').value)||0;
    if(!name||!company||!amount||!rate) { notify('Please fill required fields','error'); return; }
    const freq=$('i_freq').value;
    let calc = freq==='monthly' ? amount*rate/100/12 : freq==='annual' ? amount*rate/100 : amount*rate/100/4;
    const override = parseMoney($('i_override').value);
    const rec = { id:editMode||uid(), name, company, amount, rate, start:$('i_start').value, end:$('i_end').value, freq, day:$('i_day').value, monthly:override||calc, notes:$('i_notes').value };
    const arr = DB.get('income');
    if(editMode) { const i=arr.findIndex(x=>x.id===editMode); if(i>-1) arr[i]=rec; } else arr.push(rec);
    DB.set('income',arr);
    closeModal('mdIncome'); clearIncomeForm(); renderIncome(); renderDash();
    notify(editMode?'Income source updated!':'Income source added!');
}
function clearIncomeForm() {
    ['i_name','i_company','i_amount','i_rate','i_start','i_end','i_override','i_notes'].forEach(id=>$(id).value='');
    $('i_freq').value='monthly'; $('i_day').value=today(); $('i_calc').textContent='';
    $('mdIncomeTitle').textContent='Add Income / Investment Source';
}
function editIncome(id) {
    const s=DB.get('income').find(x=>x.id===id); if(!s) return;
    editMode=id; $('mdIncomeTitle').textContent='Edit Income Source';
    $('i_name').value=s.name; $('i_company').value=s.company;
    $('i_amount').value=fmtN(s.amount); $('i_rate').value=s.rate;
    $('i_start').value=s.start; $('i_end').value=s.end||'';
    $('i_freq').value=s.freq; $('i_day').value=s.day;
    $('i_override').value=s.monthly||''; $('i_notes').value=s.notes||'';
    calcIncomeM(); openModal('mdIncome');
}
function deleteIncome(id) {
    showConfirm('🗑️','Delete Income Source?','This cannot be undone.','btn-danger','🗑️ Delete',()=>{
        DB.set('income',DB.get('income').filter(x=>x.id!==id)); renderIncome(); renderDash(); notify('Deleted','info');
    });
}
function renderIncome() {
    let arr = DB.get('income');
    const s = sortState['income'];
    if(s?.field) arr.sort((a,b)=>{
        if(s.field==='name') return s.dir*a.name.localeCompare(b.name);
        if(s.field==='amount') return s.dir*(b.amount-a.amount);
        if(s.field==='rate') return s.dir*(b.rate-a.rate);
        return 0;
    });
    const el=$('incomeList');
    if(!arr.length) { el.innerHTML=emptyState('💰','No income sources yet','Add your investments and income streams'); return; }
    const totM=arr.reduce((sum,x)=>sum+x.monthly,0), totI=arr.reduce((sum,x)=>sum+x.amount,0);
    el.innerHTML=`<div class="g3" style="margin-bottom:16px;">
        <div class="stat-card sc-green"><div class="stat-label">Total Monthly Income</div><div class="stat-val">${fmtS(totM)}</div><div class="stat-meta">${fmt(totM)}</div></div>
        <div class="stat-card sc-gold"><div class="stat-label">Total Invested Capital</div><div class="stat-val">${fmtS(totI)}</div><div class="stat-meta">${fmt(totI)}</div></div>
        <div class="stat-card sc-blue"><div class="stat-label">Active Sources</div><div class="stat-val">${arr.length}</div><div class="stat-meta">Investment streams</div></div>
    </div>`+arr.map(source=>{
        const now=new Date(), end=source.end?new Date(source.end+'T00:00:00'):null, active=!end||end>now;
        const dLeft=end?Math.ceil((end-now)/86400000):null;
        const freqL={monthly:'Monthly',annual:'Annual',quarterly:'Quarterly'}[source.freq]||source.freq;
        return`<div class="inc-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                <div><div style="font-size:15px;font-weight:700;">${source.name}</div><div style="font-size:12px;color:var(--text3);margin-top:2px;">🏛️ ${source.company} · Start: ${source.start}${source.end?' → '+source.end:''}</div></div>
                <div style="display:flex;gap:10px;align-items:flex-start;">
                    <div style="text-align:right;"><div style="font-size:21px;font-weight:800;font-family:var(--mono);color:var(--green);">${fmt(source.monthly)}</div><div style="font-size:11px;color:var(--text3);">${freqL}</div></div>
                    <div class="act-btns"><button class="ib e" onclick="editIncome('${source.id}')">✏️</button><button class="ib d" onclick="deleteIncome('${source.id}')">🗑️</button></div>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;">
                <div class="ld"><div class="ld-l">INVESTED</div><div class="ld-v" style="color:var(--accent);">${fmt(source.amount)}</div></div>
                <div class="ld"><div class="ld-l">ANNUAL RATE</div><div class="ld-v">${source.rate}%</div></div>
                <div class="ld"><div class="ld-l">STATUS</div><div class="ld-v">${active?'<span class="badge bg-g">● Active</span>':'<span class="badge bg-gr">Ended</span>'}</div></div>
                <div class="ld"><div class="ld-l">PAYMENT START</div><div class="ld-v"><span style="color:var(--accent);font-weight:700;background:rgba(212,175,55,0.1);padding:3px 8px;border-radius:4px;">📅 ${source.day}</span></div></div>
                ${dLeft!==null?`<div class="ld"><div class="ld-l">DAYS LEFT</div><div class="ld-v" style="${dLeft<60?'color:var(--red)':''}">${dLeft>0?dLeft+' days':'Ended'}</div></div>`:''}
            </div>
            ${source.notes?`<div style="margin-top:10px;font-size:12px;color:var(--text3);padding:7px 11px;background:var(--bg2);border-radius:6px;">${source.notes}</div>`:''}
        </div>`;
    }).join('');
}

// ==================== LOANS ====================
function saveLoan() {
    const name=$('l_name').value.trim(), bank=$('l_bank').value, amount=parseMoney($('l_amount').value), rate=parseFloat($('l_rate').value)||0, dur=parseInt($('l_dur').value)||0, start=$('l_start').value;
    if(!name||!bank||!amount||!dur||!start) { notify('Please fill required fields','error'); return; }
    const calc = calcEMI(amount,rate,dur);
    const monthly = parseMoney($('l_monthly').value) || Math.round(calc);
    const rec = { id:editMode||uid(), name, bank, amount, rate, duration:dur, monthly, start, purpose:$('l_purpose').value, notes:$('l_notes').value, skipped:[] };
    const arr=DB.get('loans');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1){rec.skipped=arr[i].skipped||[]; arr[i]=rec;}}else arr.push(rec);
    DB.set('loans',arr);
    closeModal('mdLoan'); clearLoanForm(); renderLoans(); renderDash();
    notify(editMode?'Loan updated!':'Loan added!');
}
function clearLoanForm() {
    ['l_name','l_amount','l_rate','l_dur','l_monthly','l_start','l_purpose','l_notes'].forEach(id=>$(id).value='');
    $('l_bank').value=''; $('l_calc').textContent=''; $('mdLoanTitle').textContent='Add Bank Loan';
}
function editLoan(id) {
    const l=DB.get('loans').find(x=>x.id===id); if(!l) return;
    editMode=id; $('mdLoanTitle').textContent='Edit Loan';
    $('l_name').value=l.name; $('l_bank').value=l.bank; $('l_amount').value=fmtN(l.amount);
    $('l_rate').value=l.rate; $('l_dur').value=l.duration; $('l_monthly').value=fmtN(l.monthly);
    $('l_start').value=l.start; $('l_purpose').value=l.purpose||''; $('l_notes').value=l.notes||'';
    openModal('mdLoan');
}
function deleteLoan(id) {
    showConfirm('🗑️','Delete Loan?','Monthly payments will no longer be tracked.','btn-danger','🗑️ Delete',()=>{
        DB.set('loans',DB.get('loans').filter(x=>x.id!==id)); renderLoans(); renderDash(); notify('Loan deleted','info');
    });
}
function skipLoanM() {
    const planId=$('skip_plan_loan').value, month=$('skip_month_loan').value;
    if(!planId||!month){notify('Please select a loan and month','error');return;}
    const arr=DB.get('loans');
    const i=arr.findIndex(x=>x.id===planId);
    if(i<0){notify('Loan not found','error');return;}
    if(!arr[i].skipped) arr[i].skipped=[];
    if(arr[i].skipped.includes(month)){notify('This month is already skipped','warn');return;}
    arr[i].skipped.push(month);
    DB.set('loans',arr);
    closeModal('mdSkipLoan');
    renderLoans(); renderDash();
    notify(`Month ${month} skipped for Loan. Next month will show double payment.`,'warn');
}
function getLoanMonthlyForDate(item, yearN, monthN) {
    const ym = `${yearN}-${p2(monthN+1)}`;
    const prevYm = monthN===0 ? `${yearN-1}-12` : `${yearN}-${p2(monthN)}`;
    let multiplier = 1;
    if(item.skipped && item.skipped.includes(prevYm)) multiplier = 2;
    if(item.skipped && item.skipped.includes(ym)) multiplier = 0;
    return item.monthly * multiplier;
}
function loanEndDate(l) {
    const d=new Date(l.start+'T00:00:00'); d.setMonth(d.getMonth()+l.duration); return d;
}
function loanProgress(l) {
    const s=new Date(l.start+'T00:00:00'), n=new Date(), e=loanEndDate(l);
    if(n<s) return {paid:0,total:l.duration,pct:0};
    const paid=Math.min(Math.floor((n-s)/2628000000),l.duration);
    return {paid,total:l.duration,pct:Math.round(paid/l.duration*100)};
}
function renderLoans() {
    let arr=DB.get('loans');
    const s=sortState['loans'];
    if(s?.field) arr.sort((a,b)=>{
        if(s.field==='name') return s.dir*a.name.localeCompare(b.name);
        if(s.field==='monthly') return s.dir*(b.monthly-a.monthly);
        if(s.field==='amount') return s.dir*(b.amount-a.amount);
        return 0;
    });
    
    const activeLoans = arr.filter(l => loanEndDate(l) > new Date());
    $('skip_plan_loan').innerHTML = '<option value="">Select loan...</option>' + activeLoans.map(x=>`<option value="${x.id}">${x.name} (${x.bank})</option>`).join('');

    const el=$('loansList');
    if(!arr.length){el.innerHTML=emptyState('🏦','No loans added','Add your bank loans to track monthly payments');return;}
    const totM=arr.reduce((sum,l)=>{const e=loanEndDate(l);return e>new Date()?sum+l.monthly:sum;},0);
    const totA=arr.reduce((sum,l)=>sum+l.amount,0);
    el.innerHTML=`<div class="g3" style="margin-bottom:16px;">
        <div class="stat-card sc-red"><div class="stat-label">Monthly Loan Payments</div><div class="stat-val">${fmtS(totM)}</div><div class="stat-meta">${fmt(totM)}</div></div>
        <div class="stat-card sc-blue"><div class="stat-label">Total Principal</div><div class="stat-val">${fmtS(totA)}</div></div>
        <div class="stat-card sc-purple"><div class="stat-label">Active Loans</div><div class="stat-val">${activeLoans.length}</div></div>
    </div>`+arr.map(l=>{
        const prog=loanProgress(l), end=loanEndDate(l), active=end>new Date();
        const paid=prog.paid*l.monthly, remain=Math.max(0,l.amount*((l.duration-prog.paid)/l.duration));
        const skipCount=l.skipped?.length||0;
        return`<div class="loan-card">
            <div class="loan-top">
                <div><div class="loan-name">${l.name}</div><div class="loan-bank">🏦 ${l.bank}${l.purpose?' · '+l.purpose:''}</div></div>
                <div style="display:flex;align-items:flex-start;gap:8px;">
                    <div style="text-align:right;"><div class="loan-monthly">${fmt(l.monthly)}<span style="font-size:11px;font-weight:400;color:var(--text3);">/mo</span></div><div>${active?'<span class="badge bg-g">Active</span>':'<span class="badge bg-gr">Completed</span>'}</div></div>
                    <div class="act-btns"><button class="ib e" onclick="editLoan('${l.id}')">✏️</button><button class="ib d" onclick="deleteLoan('${l.id}')">🗑️</button></div>
                </div>
            </div>
            <div class="pb" style="margin-bottom:6px;"><div class="pf ${prog.pct>80?'pf-r':prog.pct>50?'pf-a':'pf-g'}" style="width:${prog.pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:10px;"><span>${prog.paid}/${prog.total} installments (${prog.pct}%) ${skipCount>0?`· <span style="color:var(--accent);">${skipCount} skipped</span>`:''}</span><span>Ends ${end.toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span></div>
            <div style="display:flex;flex-wrap:wrap;">
                <div class="ld"><div class="ld-l">PRINCIPAL</div><div class="ld-v">${fmt(l.amount)}</div></div>
                <div class="ld"><div class="ld-l">RATE</div><div class="ld-v">${l.rate}% p.a.</div></div>
                <div class="ld"><div class="ld-l">DURATION</div><div class="ld-v">${l.duration}M</div></div>
                <div class="ld"><div class="ld-l">STARTED</div><div class="ld-v">${l.start}</div></div>
                <div class="ld"><div class="ld-l">PAID</div><div class="ld-v" style="color:var(--green);">${fmtS(paid)}</div></div>
                <div class="ld"><div class="ld-l">REMAINING</div><div class="ld-v" style="color:var(--red);">${fmtS(remain)}</div></div>
            </div>
            ${l.notes?`<div style="margin-top:8px;font-size:12px;color:var(--text3);padding:7px 11px;background:var(--bg2);border-radius:6px;">${l.notes}</div>`:''}
        </div>`;
    }).join('');
}

// ==================== CC INSTALLMENTS ====================
function saveCCI() {
    const product=$('c_product').value.trim(), bank=$('c_bank').value, total=parseMoney($('c_total').value), dur=parseInt($('c_dur').value)||0, date=$('c_date').value;
    if(!product||!bank||!total||!dur||!date){notify('Please fill required fields','error');return;}
    const rate=parseFloat($('c_rate').value)||0;
    const calc=calcEMI(total,rate,dur);
    const monthly=parseMoney($('c_monthly').value)||Math.round(calc);
    const rec={id:editMode||uid(),product,buyer:$('c_buyer').value||'Self',bank,total,rate,duration:dur,monthly,date,notes:$('c_notes').value,completed:false,skipped:[]};
    const arr=DB.get('ccinstall');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1){rec.skipped=arr[i].skipped||[];arr[i]=rec;}}else arr.push(rec);
    DB.set('ccinstall',arr);
    closeModal('mdCCI'); clearCCIForm(); renderCCI(); renderDash();
    notify(editMode?'Updated!':'Installment added!');
}
function clearCCIForm() {
    ['c_product','c_buyer','c_total','c_rate','c_dur','c_monthly','c_date','c_notes'].forEach(id=>$(id).value='');
    $('c_bank').value=''; $('c_calc').textContent=''; $('mdCCITitle').textContent='Add CC Installment Plan';
}
function editCCI(id) {
    const item=DB.get('ccinstall').find(x=>x.id===id);if(!item)return;
    editMode=id; $('mdCCITitle').textContent='Edit Installment';
    $('c_product').value=item.product; $('c_buyer').value=item.buyer; $('c_bank').value=item.bank;
    $('c_total').value=fmtN(item.total); $('c_rate').value=item.rate; $('c_dur').value=item.duration;
    $('c_monthly').value=fmtN(item.monthly); $('c_date').value=item.date; $('c_notes').value=item.notes||'';
    openModal('mdCCI');
}
function deleteCCI(id) {
    showConfirm('🗑️','Delete Installment?','','btn-danger','🗑️ Delete',()=>{
        DB.set('ccinstall',DB.get('ccinstall').filter(x=>x.id!==id)); renderCCI(); renderDash(); notify('Deleted','info');
    });
}
function markCCIDone(id) {
    showConfirm('✅','Mark Installment Complete?','Mark this plan as fully paid?','btn-success','✅ Complete',()=>{
        const arr=DB.get('ccinstall');const i=arr.findIndex(x=>x.id===id);
        if(i>-1){arr[i].completed=true;DB.set('ccinstall',arr);renderCCI();notify('Marked complete!');}
    });
}
function skipInstallmentM() {
    const planId=$('skip_plan').value, month=$('skip_month').value;
    if(!planId||!month){notify('Please select a plan and month','error');return;}
    const arr=DB.get('ccinstall');
    const i=arr.findIndex(x=>x.id===planId);
    if(i<0){notify('Plan not found','error');return;}
    if(!arr[i].skipped) arr[i].skipped=[];
    if(arr[i].skipped.includes(month)){notify('This month is already skipped','warn');return;}
    arr[i].skipped.push(month);
    DB.set('ccinstall',arr);
    closeModal('mdSkip');
    renderCCI(); renderDash();
    notify(`Month ${month} skipped. Next month will show double installment.`,'warn');
}
function getCCIMonthlyForDate(item, yearN, monthN) {
    const ym = `${yearN}-${p2(monthN+1)}`;
    const prevYm = monthN===0 ? `${yearN-1}-12` : `${yearN}-${p2(monthN)}`;
    let multiplier = 1;
    if(item.skipped && item.skipped.includes(prevYm)) multiplier = 2;
    if(item.skipped && item.skipped.includes(ym)) multiplier = 0;
    return item.monthly * multiplier;
}
function cciProgress(item) {
    const s=new Date(item.date+'T00:00:00'), n=new Date();
    if(n<s) return{paid:0,total:item.duration,pct:0};
    const paid=Math.min(Math.floor((n-s)/2628000000),item.duration);
    return{paid,total:item.duration,pct:Math.round(paid/item.duration*100)};
}
function renderCCI() {
    let arr=DB.get('ccinstall');
    const s=sortState['ccot'];
    if(s?.field) arr.sort((a,b)=>{
        if(s.field==='product') return s.dir*a.product.localeCompare(b.product);
        if(s.field==='monthly') return s.dir*(b.monthly-a.monthly);
        if(s.field==='date') return s.dir*(new Date(a.date)-new Date(b.date));
        return 0;
    });
    const active=arr.filter(x=>!x.completed);
    const totM=active.reduce((sum,x)=>sum+x.monthly,0), totV=active.reduce((sum,x)=>sum+x.total,0);
    $('cciStats').innerHTML=`
        <div class="stat-card sc-red"><div class="stat-label">Monthly CC Payments</div><div class="stat-val">${fmtS(totM)}</div><div class="stat-meta">${fmt(totM)}</div></div>
        <div class="stat-card sc-gold"><div class="stat-label">Total CC Financed</div><div class="stat-val">${fmtS(totV)}</div></div>
        <div class="stat-card sc-blue"><div class="stat-label">Active Plans</div><div class="stat-val">${active.length}</div></div>
        <div class="stat-card sc-purple" style="opacity:.7;"><div class="stat-label">Completed</div><div class="stat-val">${arr.length-active.length}</div></div>
    `;
    $('skip_plan').innerHTML='<option value="">Select plan...</option>'+active.map(x=>`<option value="${x.id}">${x.product} (${x.bank})</option>`).join('');
    const tbody=$('cciBody');
    if(!arr.length){tbody.innerHTML=`<tr><td colspan="11">${emptyState('💳','No installments','Add credit card installment plans to track payments')}</td></tr>`;return;}
    tbody.innerHTML=arr.map(item=>{
        const prog=cciProgress(item);
        const end=new Date(item.date+'T00:00:00'); end.setMonth(end.getMonth()+item.duration);
        const isActive=end>new Date()&&!item.completed;
        const skipCount=item.skipped?.length||0;
        return`<tr class="${item.completed?'done-row':''}">
            <td><div style="font-weight:600;">${item.product}</div>${item.notes?`<div class="td-m">${item.notes}</div>`:''}</td>
            <td>${item.buyer}</td>
            <td><span class="badge bg-b">${item.bank}</span></td>
            <td class="td-a">${fmt(item.total)}</td>
            <td class="td-mono">${item.rate>0?item.rate+'%':'0% Free'}</td>
            <td class="td-r">${fmt(item.monthly)}</td>
            <td class="td-mono">${item.duration}M${skipCount>0?`<br><span style="font-size:10px;color:var(--accent);">${skipCount} skipped</span>`:''}</td>
            <td class="td-m">${item.date}</td>
            <td style="min-width:110px;"><div class="pb" style="margin-bottom:3px;"><div class="pf ${prog.pct>80?'pf-r':prog.pct>50?'pf-a':'pf-g'}" style="width:${Math.min(100,prog.pct)}%"></div></div><div style="font-size:10px;color:var(--text3);">${prog.paid}/${prog.total} (${prog.pct}%)</div></td>
            <td>${item.completed?'<span class="badge bg-gr">Done</span>':isActive?'<span class="badge bg-g">Active</span>':'<span class="badge bg-r">Overdue</span>'}</td>
            <td><div class="act-btns">${!item.completed?`<button class="ib c" onclick="markCCIDone('${item.id}')" title="Mark Complete">✅</button>`:''}
                <button class="ib e" onclick="editCCI('${item.id}')">✏️</button>
                <button class="ib d" onclick="deleteCCI('${item.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');
}

// ==================== CC ONE-TIME ====================
function saveCCOT() {
    const desc=$('ot_desc').value.trim(), bank=$('ot_bank').value, amount=parseMoney($('ot_amount').value), date=$('ot_date').value;
    if(!desc||!bank||!amount||!date){notify('Please fill required fields','error');return;}
    const dl=new Date(date+'T00:00:00'); dl.setDate(dl.getDate()+50);
    const rec={id:editMode||uid(),desc,bank,type:$('ot_type').value,amount,date,deadline:dl.toISOString().split('T')[0],notes:$('ot_notes').value,paid:false};
    const arr=DB.get('cconetime');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1)arr[i]=rec;}else arr.push(rec);
    DB.set('cconetime',arr);
    closeModal('mdCCOT'); clearCCOTForm(); renderCCOT(); updateCCOTBadge();
    notify('Payment added!');
}
function clearCCOTForm(){
    ['ot_desc','ot_amount','ot_notes'].forEach(id=>$(id).value='');
    $('ot_bank').value=''; $('ot_date').value=today(); $('mdCCOTTitle').textContent='Add CC One-Time Payment';
}
function markCCOTPaid(id){
    showConfirm('💳','Mark as Paid?','Confirm this CC payment has been repaid.','btn-success','✅ Mark Paid',()=>{
        const arr=DB.get('cconetime');const i=arr.findIndex(x=>x.id===id);
        if(i>-1){arr[i].paid=true;DB.set('cconetime',arr);renderCCOT();updateCCOTBadge();notify('Marked as paid!');}
    });
}
function deleteCCOT(id){
    showConfirm('🗑️','Delete?','','btn-danger','🗑️ Delete',()=>{
        DB.set('cconetime',DB.get('cconetime').filter(x=>x.id!==id)); renderCCOT(); updateCCOTBadge(); notify('Deleted','info');
    });
}
function dLeft(deadline) {
    const d=new Date(deadline+'T00:00:00'), n=new Date(); n.setHours(0,0,0,0);
    return Math.ceil((d-n)/86400000);
}
function updateCCOTBadge() {
    const urgent=DB.get('cconetime').filter(x=>!x.paid&&dLeft(x.deadline)<=10&&dLeft(x.deadline)>=0).length;
    const nb=$('nb-ccot');
    if(nb){ nb.style.display=urgent>0?'':'none'; nb.textContent=urgent; }
}
function renderCCOT() {
    let arr=DB.get('cconetime');
    const s=sortState['ccot'];
    if(s?.field) arr.sort((a,b)=>{
        if(s.field==='days') return s.dir*(dLeft(a.deadline)-dLeft(b.deadline));
        if(s.field==='amount') return s.dir*(b.amount-a.amount);
        return 0;
    });
    const tbody=$('ccotBody');
    if(!arr.length){tbody.innerHTML=`<tr><td colspan="9">${emptyState('⏱️','No one-time payments','Track CC purchases with the 50-day repayment rule')}</td></tr>`;return;}
    tbody.innerHTML=arr.map(item=>{
        const dl=dLeft(item.deadline);
        let cdCls='cd-safe', cdTxt=dl+' days';
        if(item.paid){cdCls='cd-done';cdTxt='✅ Paid';}
        else if(dl<0){cdCls='cd-danger';cdTxt='⚠️ Overdue '+Math.abs(dl)+'d';}
        else if(dl<=10){cdCls='cd-danger';cdTxt='🔴 '+dl+' days';}
        else if(dl<=20){cdCls='cd-warn';cdTxt=dl+' days';}
        const typeL={purchase:'Purchase',cash_advance:'Cash Advance'}[item.type]||item.type;
        return`<tr class="${item.paid?'done-row':''}">
            <td><div style="font-weight:600;">${item.desc}</div>${item.notes?`<div class="td-m">${item.notes}</div>`:''}</td>
            <td><span class="badge bg-b">${item.bank}</span></td>
            <td><span class="badge bg-gr">${typeL}</span></td>
            <td class="td-a">${fmt(item.amount)}</td>
            <td class="td-m">${item.date}</td>
            <td class="td-m">${item.deadline}</td>
            <td><span class="cd ${cdCls}">${cdTxt}</span></td>
            <td>${item.paid?'<span class="badge bg-g">Paid</span>':dl<0?'<span class="badge bg-r">Overdue</span>':'<span class="badge bg-a">Pending</span>'}</td>
            <td><div class="act-btns">${!item.paid?`<button class="ib c" onclick="markCCOTPaid('${item.id}')">✅</button>`:''}
                <button class="ib d" onclick="deleteCCOT('${item.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');
}
// ==================== CHEQUES ====================
function saveCheque() {
    const no=$('chq_no').value.trim(), party=$('chq_party').value.trim(), bank=$('chq_bank').value, amount=parseMoney($('chq_amount').value), issue=$('chq_issue').value, release=$('chq_release').value;
    if(!no||!party||!bank||!amount||!issue||!release){notify('Please fill required fields','error');return;}
    const rec={id:editMode||uid(),no,party,bank,type:$('chq_type').value,amount,issue,release,notes:$('chq_notes').value,status:'pending'};
    const arr=DB.get('cheques');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1)arr[i]=rec;}else arr.push(rec);
    DB.set('cheques',arr);
    closeModal('mdCheque'); clearChequeForm(); renderCheques(); updateChequeBadge();
    notify('Cheque added!');
}
function clearChequeForm(){
    ['chq_no','chq_party','chq_amount','chq_notes'].forEach(id=>$(id).value='');
    $('chq_bank').value=''; $('chq_type').value='received';
    $('chq_issue').value=today(); $('chq_release').value=today();
    $('mdChequeTitle').textContent='Add Cheque';
}
function editCheque(id) {
    const item=DB.get('cheques').find(x=>x.id===id); if(!item) return;
    editMode=id; $('mdChequeTitle').textContent='Edit Cheque';
    $('chq_no').value=item.no; $('chq_party').value=item.party; $('chq_bank').value=item.bank;
    $('chq_type').value=item.type; $('chq_amount').value=fmtN(item.amount);
    $('chq_issue').value=item.issue; $('chq_release').value=item.release; $('chq_notes').value=item.notes||'';
    openModal('mdCheque');
}
function deleteCheque(id) {
    showConfirm('🗑️','Delete Cheque?','','btn-danger','🗑️ Delete',()=>{
        DB.set('cheques',DB.get('cheques').filter(x=>x.id!==id)); renderCheques(); updateChequeBadge(); notify('Deleted','info');
    });
}
function markChequeCleared(id) {
    showConfirm('✅','Mark Cheque Cleared?','Confirm this cheque has been cleared/honoured.','btn-success','✅ Mark Cleared',()=>{
        const arr=DB.get('cheques');const i=arr.findIndex(x=>x.id===id);
        if(i>-1){arr[i].status='cleared';DB.set('cheques',arr);renderCheques();updateChequeBadge();notify('Cheque marked cleared!');}
    });
}
function markChequeBounced(id) {
    showConfirm('⚠️','Mark as Bounced?','Mark this cheque as returned/bounced?','btn-danger','⚠️ Mark Bounced',()=>{
        const arr=DB.get('cheques');const i=arr.findIndex(x=>x.id===id);
        if(i>-1){arr[i].status='bounced';DB.set('cheques',arr);renderCheques();updateChequeBadge();notify('Cheque marked as bounced','warn');}
    });
}
function updateChequeBadge() {
    const today_str=today();
    const due=DB.get('cheques').filter(x=>x.status==='pending'&&x.release<=today_str).length;
    const nb=$('nb-chq');
    if(nb){nb.style.display=due>0?'':'none';nb.textContent=due;}
}
function renderCheques() {
    let arr=DB.get('cheques');
    const s=sortState['cheques'];
    if(s?.field) arr.sort((a,b)=>{
        if(s.field==='release') return s.dir*(new Date(a.release)-new Date(b.release));
        if(s.field==='amount') return s.dir*(b.amount-a.amount);
        return 0;
    });
    const pending=arr.filter(x=>x.status==='pending');
    const totPending=pending.reduce((sum,x)=>sum+x.amount,0);
    const received=arr.filter(x=>x.type==='received'), issued=arr.filter(x=>x.type==='issued');
    $('chequeStats').innerHTML=`
        <div class="stat-card sc-cyan"><div class="stat-label">Pending Cheques</div><div class="stat-val">${pending.length}</div><div class="stat-meta">${fmt(totPending)}</div></div>
        <div class="stat-card sc-green"><div class="stat-label">Received</div><div class="stat-val">${received.length}</div><div class="stat-meta">${fmt(received.reduce((sum,x)=>sum+x.amount,0))}</div></div>
        <div class="stat-card sc-red"><div class="stat-label">Issued</div><div class="stat-val">${issued.length}</div><div class="stat-meta">${fmt(issued.reduce((sum,x)=>sum+x.amount,0))}</div></div>
        <div class="stat-card sc-purple"><div class="stat-label">Total Cheques</div><div class="stat-val">${arr.length}</div></div>
    `;
    const tbody=$('chequeBody');
    if(!arr.length){tbody.innerHTML=`<tr><td colspan="10">${emptyState('📄','No cheques tracked','Add received or issued cheques to monitor them')}</td></tr>`;return;}
    const todayDate=today();
    tbody.innerHTML=arr.map(item=>{
        const daysToRelease=Math.ceil((new Date(item.release+'T00:00:00')-new Date())/86400000);
        let cdCls='cd-safe', cdTxt=daysToRelease>0?daysToRelease+' days':'Today';
        if(item.status==='cleared'){cdCls='cd-done';cdTxt='✅ Cleared';}
        else if(item.status==='bounced'){cdCls='cd-danger';cdTxt='⚠️ Bounced';}
        else if(daysToRelease<0){cdCls='cd-warn';cdTxt=Math.abs(daysToRelease)+'d overdue';}
        else if(daysToRelease<=3){cdCls='cd-warn';cdTxt=daysToRelease+' days';}
        const statusMap={pending:'<span class="badge bg-a">Pending</span>',cleared:'<span class="badge bg-g">Cleared</span>',bounced:'<span class="badge bg-r">Bounced</span>'};
        return`<tr class="${item.status!=='pending'?'done-row':''}">
            <td class="td-mono">${item.no}</td>
            <td style="font-weight:600;">${item.party}</td>
            <td><span class="badge bg-b">${item.bank}</span></td>
            <td class="td-a">${fmt(item.amount)}</td>
            <td class="td-m">${item.issue}</td>
            <td class="td-m">${item.release}</td>
            <td><span class="cd ${cdCls}">${cdTxt}</span></td>
            <td>${statusMap[item.status]||''}</td>
            <td class="td-m">${item.notes||''}</td>
            <td><div class="act-btns">
                ${item.status==='pending'?`<button class="ib c" onclick="markChequeCleared('${item.id}')" title="Clear">✅</button><button class="ib d" onclick="markChequeBounced('${item.id}')" title="Bounce" style="font-size:11px;">⚠️</button>`:''}
                <button class="ib e" onclick="editCheque('${item.id}')">✏️</button>
                <button class="ib d" onclick="deleteCheque('${item.id}')">🗑️</button>
            </div></td>
        </tr>`;
    }).join('');
}

// ==================== EXPENSES ====================
function saveExpense() {
    const desc=$('e_desc').value.trim(), cat=$('e_cat').value, amount=parseMoney($('e_amount').value), month=$('e_month').value;
    if(!desc||!amount||!month){notify('Please fill required fields','error');return;}
    const rec={id:editMode||uid(),desc,cat,amount,month,recurring:$('e_recurring').value==='1',notes:$('e_notes').value,completed:false};
    const arr=DB.get('expenses');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1)arr[i]=rec;}else arr.push(rec);
    DB.set('expenses',arr); closeModal('mdExpense'); renderExpenses(); renderDash();
    notify(editMode?'Updated!':'Expense added!'); editMode=null;
}
function deleteExpense(id) {
    showConfirm('🗑️','Delete Expense?','','btn-danger','🗑️ Delete',()=>{
        DB.set('expenses',DB.get('expenses').filter(x=>x.id!==id)); renderExpenses(); renderDash(); notify('Deleted','info');
    });
}
function markExpDone(id) {
    showConfirm('✅','Mark Expense Paid?','','btn-success','✅ Mark Paid',()=>{
        const arr=DB.get('expenses');const i=arr.findIndex(x=>x.id===id);
        if(i>-1){arr[i].completed=true;DB.set('expenses',arr);renderExpenses();notify('Marked as paid!');}
    });
}
function renderExpenses() {
    let arr=DB.get('expenses');
    const allMonths=[...new Set(arr.map(x=>x.month))].sort().reverse();
    const sel=$('expMonth'); const cur=sel.value;
    sel.innerHTML='<option value="">All Months</option>'+allMonths.map(m=>`<option value="${m}" ${m===cur?'selected':''}>${monthStrFmt(m+'-01')}</option>`).join('');
    let filtered=cur?arr.filter(x=>x.month===cur):arr;
    const s=sortState['expenses'];
    if(s?.field) filtered.sort((a,b)=>{
        if(s.field==='date') return s.dir*a.month.localeCompare(b.month);
        if(s.field==='amount') return s.dir*(b.amount-a.amount);
        return 0;
    });
    const totAmt=filtered.reduce((sum,x)=>sum+x.amount,0);
    const catMap={}; filtered.forEach(x=>{catMap[x.cat]=(catMap[x.cat]||0)+x.amount;});
    const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0]||['-',0];
    $('expStats').innerHTML=`
        <div class="stat-card sc-red"><div class="stat-label">Total Expenses</div><div class="stat-val">${fmtS(totAmt)}</div><div class="stat-meta">${fmt(totAmt)}</div></div>
        <div class="stat-card sc-blue"><div class="stat-label">Count</div><div class="stat-val">${filtered.length}</div></div>
        <div class="stat-card sc-gold"><div class="stat-label">Top Category</div><div class="stat-val" style="font-size:15px;">${topCat[0]}</div><div class="stat-meta">${fmtS(topCat[1])}</div></div>
        <div class="stat-card sc-green"><div class="stat-label">Paid</div><div class="stat-val">${filtered.filter(x=>x.completed).length}</div><div class="stat-meta">of ${filtered.length}</div></div>
    `;
    const catBadge={Food:'bg-g',Transport:'bg-b',Utilities:'bg-a',Medical:'bg-r',Education:'bg-p',Entertainment:'bg-c',Clothing:'bg-gr',Other:'bg-gr'};
    const tbody=$('expBody');
    if(!filtered.length){tbody.innerHTML=`<tr><td colspan="7">${emptyState('🧾','No expenses','Add daily and monthly expenses to track spending')}</td></tr>`;return;}
    tbody.innerHTML=filtered.map(x=>`<tr class="${x.completed?'done-row':''}">
        <td><div style="font-weight:600;">${x.desc}</div>${x.notes?`<div class="td-m">${x.notes}</div>`:''}</td>
        <td><span class="badge ${catBadge[x.cat]||'bg-gr'}">${x.cat}</span></td>
        <td class="td-m">${monthStrFmt(x.month+'-01')}</td>
        <td class="td-r">${fmt(x.amount)}</td>
        <td>${x.recurring?'<span class="badge bg-b">🔄 Monthly</span>':'<span class="badge bg-gr">Once</span>'}</td>
        <td>${x.completed?'<span class="badge bg-g">✅ Paid</span>':'<span class="badge bg-a">Pending</span>'}</td>
        <td><div class="act-btns">${!x.completed?`<button class="ib c" onclick="markExpDone('${x.id}')">✅</button>`:''}
            <button class="ib d" onclick="deleteExpense('${x.id}')">🗑️</button></div></td>
    </tr>`).join('');
}

// ==================== TARGETS ====================
function saveTarget() {
    const name=$('t_name').value.trim(), amount=parseMoney($('t_amount').value), start=$('t_start').value, end=$('t_end').value;
    if(!name||!amount||!start||!end){notify('Please fill required fields','error');return;}
    const rec={id:editMode||uid(),name,amount,start,end,notes:$('t_notes').value,savings:[]};
    const arr=DB.get('targets');
    if(editMode){const i=arr.findIndex(x=>x.id===editMode);if(i>-1){rec.savings=arr[i].savings;arr[i]=rec;}}else arr.push(rec);
    DB.set('targets',arr); closeModal('mdTarget');
    ['t_name','t_amount','t_start','t_end','t_notes'].forEach(id=>$(id).value='');
    renderTargets(); notify('Target created! 🎯');
}
function saveSaving() {
    const tid=$('sav_tgt').value, amount=parseMoney($('sav_amt').value), date=$('sav_date').value;
    if(!tid||!amount||!date){notify('Please fill required fields','error');return;}
    const arr=DB.get('targets'); const i=arr.findIndex(x=>x.id===tid);
    if(i<0){notify('Target not found','error');return;}
    arr[i].savings.push({id:uid(),amount,date,note:$('sav_note').value});
    DB.set('targets',arr); closeModal('mdSaving');
    ['sav_amt','sav_note'].forEach(id=>$(id).value=''); $('sav_date').value=today();
    const saved=arr[i].savings.reduce((sum,x)=>sum+x.amount,0);
    renderTargets();
    if(saved>=arr[i].amount) setTimeout(()=>showCelebration(arr[i]),200);
    else notify('Saving added! 💚');
}
function deleteTarget(id) {
    showConfirm('🗑️','Delete Target?','All saving entries will also be deleted.','btn-danger','🗑️ Delete',()=>{
        DB.set('targets',DB.get('targets').filter(x=>x.id!==id)); renderTargets(); notify('Deleted','info');
    });
}
function deleteSaving(tid, sid) {
    const arr=DB.get('targets'); const i=arr.findIndex(x=>x.id===tid);
    if(i<0) return;
    arr[i].savings=arr[i].savings.filter(x=>x.id!==sid);
    DB.set('targets',arr); renderTargets(); notify('Saving entry removed','info');
}
function showSavHistory(tid) {
    const t=DB.get('targets').find(x=>x.id===tid); if(!t) return;
    $('savHistTitle').textContent = t.name + ' - Full History';
    const content = t.savings.slice().reverse();
    $('savHistContent').innerHTML = content.length ? content.map(s=>`<div class="sav-entry">
        <span style="color:var(--text2);">${s.date}${s.note?' · '+s.note:''}</span>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:var(--green);font-family:var(--mono);font-weight:700;">+${fmt(s.amount)}</span>
            <button class="ib d" onclick="deleteSaving('${tid}','${s.id}')">✕</button>
        </div>
    </div>`).join('') : '<div class="empty" style="padding:20px;"><div class="empty-sub">No saving entries yet</div></div>';
    openModal('mdSavHistory');
}
function showCelebration(target) {
    $('celebSub').textContent = `You have achieved: "${target.name}"! 🏆`;
    $('celebAmt').textContent = fmt(target.amount);
    $('celeb').classList.add('show');
    const colors=['#d4af37','#f5a623','#ffd166','#10b981','#3b82f6'];
    for(let i=0;i<80;i++){
        const c=document.createElement('div');
        c.className='conf-piece';
        c.style.cssText=`left:${Math.random()*100}vw;top:-10px;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation:confFall ${2+Math.random()*3}s ${Math.random()*2}s linear forwards;border-radius:${Math.random()>.5?'50%':'2px'};`;
        $('celeb').appendChild(c);
    }
}
function closeCeleb() {
    $('celeb').classList.remove('show');
    $('celeb').querySelectorAll('.conf-piece').forEach(c=>c.remove());
}
function renderTargets() {
    const arr=DB.get('targets');
    $('sav_tgt').innerHTML=arr.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
    const el=$('targetsList');
    if(!arr.length){el.innerHTML=emptyState('🎯','No targets yet','Create savings targets to track your financial goals');return;}
    el.innerHTML=arr.map(t=>{
        const saved=t.savings.reduce((sum,x)=>sum+x.amount,0);
        const remain=Math.max(0,t.amount-saved);
        const pct=Math.min(100,Math.round(saved/t.amount*100));
        const now=new Date(); const end=new Date(t.end+'T00:00:00');
        const daysRem=Math.ceil((end-now)/86400000);
        const done=saved>=t.amount;
        const recent=t.savings.slice().reverse().slice(0,3);
        return`<div class="tgt-card">
            <div class="tgt-top">
                <div><div class="tgt-name">${done?'🏆 ':''} ${t.name}</div><div class="tgt-dates">📅 ${t.start} → ${t.end} ${daysRem>0?'· '+daysRem+' days left':'· Ended'}</div></div>
                <div style="display:flex;align-items:flex-start;gap:8px;">
                    <div style="text-align:right;"><div class="tgt-big">${fmtS(t.amount)}</div><div style="font-size:11px;color:var(--text3);">Target · ${fmt(t.amount)}</div><div class="tgt-rem">${fmtS(remain)}</div><div style="font-size:11px;color:var(--text3);">Remaining</div></div>
                    <div class="act-btns"><button class="ib d" onclick="deleteTarget('${t.id}')">🗑️</button></div>
                </div>
            </div>
            <div class="pb" style="margin-bottom:6px;height:9px;"><div class="pf ${done?'pf-g':pct>60?'pf-a':'pf-b'}" style="width:${pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:14px;"><span>${fmt(saved)} saved (${pct}%)</span><span>${done?'🎉 COMPLETED!':fmt(remain)+' to go'}</span></div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
                <div class="ld"><div class="ld-l">TARGET</div><div class="ld-v" style="color:var(--accent);">${fmt(t.amount)}</div></div>
                <div class="ld"><div class="ld-l">SAVED</div><div class="ld-v" style="color:var(--green);">${fmt(saved)}</div></div>
                <div class="ld"><div class="ld-l">ENTRIES</div><div class="ld-v">${t.savings.length}</div></div>
                <div class="ld"><div class="ld-l">PROGRESS</div><div class="ld-v">${pct}%</div></div>
            </div>
            ${recent.length?`<div><div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">Recent Savings</div>
            ${recent.map(s=>`<div class="sav-entry"><span style="color:var(--text2);">${s.date}${s.note?' · '+s.note:''}</span><span style="color:var(--green);font-family:var(--mono);font-weight:700;">+${fmt(s.amount)}</span></div>`).join('')}
            ${t.savings.length>3?`<button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:6px;" onclick="showSavHistory('${t.id}')">📋 See All ${t.savings.length} Entries</button>`:''}
            </div>`:''}
            ${t.notes?`<div style="margin-top:10px;font-size:12px;color:var(--text3);padding:7px 11px;background:var(--bg2);border-radius:6px;">${t.notes}</div>`:''}
        </div>`;
    }).join('');
}

// ==================== BALANCE ====================
function setBalance() {
    const total=parseMoney($('bs_total').value); if(!total){notify('Enter a valid amount','error');return;}
    const data=DB.getObj('balance',{total:0,flows:[]});
    data.total=total;
    data.flows.push({id:uid(),type:'set',company:'Balance Set',amount:total,date:$('bs_date').value||today(),notes:$('bs_notes').value||'Balance updated'});
    DB.set('balance',data); closeModal('mdBalSet');
    ['bs_total','bs_notes'].forEach(id=>$(id).value=''); renderBalance(); notify('Balance updated!');
}
function saveBalFlow() {
    const type=$('bf_type').value, company=$('bf_company').value.trim(), amount=parseMoney($('bf_amount').value), date=$('bf_date').value;
    if(!company||!amount||!date){notify('Please fill required fields','error');return;}
    const data=DB.getObj('balance',{total:0,flows:[]});
    data.flows.push({id:uid(),type,company,amount,date,notes:$('bf_notes').value});
    DB.set('balance',data); closeModal('mdBalFlow');
    ['bf_company','bf_amount','bf_notes'].forEach(id=>$(id).value=''); $('bf_date').value=today();
    renderBalance(); notify(type==='out'?'Investment logged!':'Income logged!');
}
function deleteBalFlow(id) {
    showConfirm('🗑️','Delete Flow?','','btn-danger','🗑️ Delete',()=>{
        const data=DB.getObj('balance',{total:0,flows:[]});
        data.flows=data.flows.filter(x=>x.id!==id); DB.set('balance',data); renderBalance(); notify('Deleted','info');
    });
}
function renderBalance() {
    const data=DB.getObj('balance',{total:0,flows:[]});
    const outTotal=data.flows.filter(x=>x.type==='out').reduce((sum,x)=>sum+x.amount,0);
    const inTotal=data.flows.filter(x=>x.type==='in').reduce((sum,x)=>sum+x.amount,0);
    const net=data.total-outTotal+inTotal;
    $('balTot').textContent=fmtS(data.total);
    $('balOut').textContent=fmtS(outTotal);
    $('balNet').textContent=fmtS(net);
    const bigEl=$('balBig');
    bigEl.style.color=net>=0?'var(--green)':'var(--red)';
    bigEl.textContent=fmt(net);
    const flows=data.flows.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!flows.length){$('balFlows').innerHTML=emptyState('⚖️','No balance flows','Set your balance and log investment flows');return;}
    $('balFlows').innerHTML=flows.map(f=>`<div class="flow-item">
        <div class="flow-dot ${f.type==='set'?'in':f.type}">${f.type==='set'?'💰':f.type==='out'?'📤':'📥'}</div>
        <div class="flow-info"><div class="flow-name">${f.company}</div><div class="flow-date">${f.date}${f.notes?' · '+f.notes:''}</div></div>
        <div class="flow-right"><div class="flow-amt ${f.type==='out'?'out':'in'}">${f.type==='out'?'-':'+'}${fmt(f.amount)}</div><div><span class="badge ${f.type==='set'?'bg-a':f.type==='out'?'bg-r':'bg-g'}">${f.type==='set'?'Set':f.type==='out'?'Out':'In'}</span></div></div>
        <button class="ib d" onclick="deleteBalFlow('${f.id}')">🗑️</button>
    </div>`).join('');
}

// ==================== MONTHLY DATA & PLAN ====================
function getMonthlyData(year, month) {
    const dt=new Date(year,month,1);
    let income=0;
    DB.get('income').forEach(s=>{
        const start=new Date(s.start+'T00:00:00');
        const end=s.end?new Date(s.end+'T00:00:00'):null;
        if(start<=dt&&(!end||end>=dt)) income+=s.monthly;
    });
    let loanTotal=0, loanItems=[];
    DB.get('loans').forEach(l=>{
        const start=new Date(l.start+'T00:00:00');
        const end=loanEndDate(l);
        if(start<=dt&&end>dt){
            const m=getLoanMonthlyForDate(l,year,month);
            loanTotal+=m; loanItems.push({name:l.name,bank:l.bank,amount:m});
        }
    });
    let ccTotal=0, ccItems2=[];
    DB.get('ccinstall').filter(x=>!x.completed).forEach(item=>{
        const start=new Date(item.date+'T00:00:00');
        const end=new Date(item.date+'T00:00:00'); end.setMonth(end.getMonth()+item.duration);
        if(start<=dt&&end>dt){
            const m=getCCIMonthlyForDate(item,year,month);
            ccTotal+=m; ccItems2.push({name:item.product,bank:item.bank,amount:m});
        }
    });
    const ym=`${year}-${p2(month+1)}`;
    let expTotal=0, expItems=[];
    DB.get('expenses').forEach(e=>{
        if(e.month===ym||(e.recurring&&e.month<=ym)){expTotal+=e.amount;expItems.push({name:e.desc,cat:e.cat,amount:e.amount});}
    });
    const totalExp=loanTotal+ccTotal+expTotal;
    return {income,loanTotal,ccTotal,expTotal,totalExp,balance:income-totalExp,loanItems,ccItems2,expItems};
}

function renderMonthly() {
    const year=parseInt($('mpYear').value)||new Date().getFullYear();
    const now=new Date();
    $('monthTabs').innerHTML=MONTHS_S.map((m,i)=>`<div class="mtab ${i===now.getMonth()&&year===now.getFullYear()?'active':''}" onclick="showMonthDetail(${year},${i},this)">${m}</div>`).join('');
    const curM=year===now.getFullYear()?now.getMonth():0;
    const activeTab=$('monthTabs').children[curM];
    showMonthDetail(year, curM, activeTab);
}
function showMonthDetail(year, month, tabEl) {
    document.querySelectorAll('.mtab').forEach(t=>t.classList.remove('active'));
    if(tabEl) tabEl.classList.add('active');
    const data=getMonthlyData(year, month);
    const mName=MONTHS[month]+' '+year;
    $('monthlyContent').innerHTML=`
        <div class="mhero">
            <div class="mh-lbl">${mName}</div>
            <div class="mh-bal ${data.balance>=0?'mh-pos':'mh-neg'}">${fmt(data.balance)}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:3px;">Monthly Balance</div>
            <div class="mh-row">
                <div class="mhi"><div class="mhi-lbl">Income</div><div class="mhi-val" style="color:var(--green);">${fmt(data.income)}</div></div>
                <div class="mhi"><div class="mhi-lbl">Loans</div><div class="mhi-val" style="color:var(--red);">${fmt(data.loanTotal)}</div></div>
                <div class="mhi"><div class="mhi-lbl">CC Install.</div><div class="mhi-val" style="color:var(--red);">${fmt(data.ccTotal)}</div></div>
                <div class="mhi"><div class="mhi-lbl">Other Exp.</div><div class="mhi-val" style="color:var(--red);">${fmt(data.expTotal)}</div></div>
                <div class="mhi"><div class="mhi-lbl">Total Expenses</div><div class="mhi-val" style="color:var(--red);">${fmt(data.totalExp)}</div></div>
            </div>
        </div>
        <div class="g2">
            <div class="card"><div class="card-header"><div class="card-title">🏦 Loan Payments</div><div class="card-sub">${fmt(data.loanTotal)}</div></div>
                ${data.loanItems.length?data.loanItems.map(x=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${x.name} <span class="td-m">(${x.bank})</span></span><span class="td-r">${fmt(x.amount)}</span></div>`).join(''):`<div class="empty" style="padding:16px;"><div class="empty-sub">No loan payments</div></div>`}
            </div>
            <div class="card"><div class="card-header"><div class="card-title">💳 CC Installments</div><div class="card-sub">${fmt(data.ccTotal)}</div></div>
                ${data.ccItems2.length?data.ccItems2.map(x=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${x.name} <span class="td-m">(${x.bank})</span></span><span class="td-r">${fmt(x.amount)}</span></div>`).join(''):`<div class="empty" style="padding:16px;"><div class="empty-sub">No CC installments</div></div>`}
            </div>
            <div class="card"><div class="card-header"><div class="card-title">🧾 Other Expenses</div><div class="card-sub">${fmt(data.expTotal)}</div></div>
                ${data.expItems.length?data.expItems.map(x=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${x.name} <span class="badge bg-gr">${x.cat}</span></span><span class="td-r">${fmt(x.amount)}</span></div>`).join(''):`<div class="empty" style="padding:16px;"><div class="empty-sub">No expenses</div></div>`}
            </div>
        </div>
    `;
}

// ==================== DASHBOARD AUTOMATION ====================
let dashChartInst=null, dashPieInst=null;
function renderDash() {
    const year = parseInt($('dashYear').value) || new Date().getFullYear();
    const months = MONTHS_S;
    const incData=[], expData=[], netData=[];
    let yrInc=0, yrExp=0;
    for(let i=0; i<12; i++){
        const md = getMonthlyData(year, i);
        incData.push(md.income);
        expData.push(md.totalExp);
        netData.push(md.balance);
        yrInc+=md.income; yrExp+=md.totalExp;
    }
    $('dashStats').innerHTML = `
        <div class="stat-card sc-green"><div class="stat-label">Year Income</div><div class="stat-val">${fmtS(yrInc)}</div></div>
        <div class="stat-card sc-red"><div class="stat-label">Year Expenses</div><div class="stat-val">${fmtS(yrExp)}</div></div>
        <div class="stat-card sc-gold"><div class="stat-label">Net Savings</div><div class="stat-val">${fmtS(yrInc-yrExp)}</div></div>
        <div class="stat-card sc-blue"><div class="stat-label">Avg Monthly Exp</div><div class="stat-val">${fmtS(yrExp/12)}</div></div>
        <div class="stat-card sc-cyan"><div class="stat-label">Savings Rate</div><div class="stat-val">${yrInc>0?Math.round((yrInc-yrExp)/yrInc*100):0}%</div></div>
    `;

    const ctxC = $('dashChart');
    if(dashChartInst) dashChartInst.destroy();
    if(ctxC) {
        dashChartInst = new Chart(ctxC, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {label:'Income', data:incData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', fill:true, tension:0.4},
                    {label:'Expenses', data:expData, borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.1)', fill:true, tension:0.4}
                ]
            },
            options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{callback:v=>fmtS(v)}}} }
        });
    }

    const catMap={};
    DB.get('expenses').filter(e=>e.month.startsWith(year)).forEach(e=>{ catMap[e.cat]=(catMap[e.cat]||0)+e.amount; });
    const pCtx = $('dashPie');
    if(dashPieInst) dashPieInst.destroy();
    if(pCtx) {
        dashPieInst = new Chart(pCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catMap),
                datasets: [{data: Object.values(catMap), backgroundColor:['#d4af37','#10b981','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#94a3b8','#f87171']}]
            },
            options: { maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:document.documentElement.getAttribute('data-theme')==='dark'?'#e2e8f0':'#1e293b',font:{size:10}}}} }
        });
    }

    renderUpcoming();
    renderRecentActivity();
}

function renderUpcoming() {
    const todayObj = new Date();
    const maxDate = new Date(); maxDate.setDate(todayObj.getDate() + 30);
    const upcoming = [];

    DB.get('cconetime').filter(x => !x.paid).forEach(x => {
        const d = new Date(x.deadline);
        if (d >= todayObj && d <= maxDate) upcoming.push({title: x.desc, sub: 'CC One-Time', date: d, amt: x.amount, color: 'var(--red)'});
    });

    DB.get('cheques').filter(x => x.status === 'pending').forEach(x => {
        const d = new Date(x.release);
        if (d >= todayObj && d <= maxDate) {
            upcoming.push({title: x.no, sub: x.type==='issued'?'Issued Cheque':'Received Cheque', date: d, amt: x.amount, color: x.type==='issued'?'var(--red)':'var(--green)'});
        }
    });

    DB.get('loans').forEach(l => {
        const nextD = getNextOccurenceDate(l.start);
        if(nextD >= todayObj && nextD <= maxDate && loanEndDate(l) > nextD) {
            upcoming.push({title: l.name, sub: 'Bank Loan', date: nextD, amt: l.monthly, color: 'var(--red)'});
        }
    });

    DB.get('ccinstall').filter(x => !x.completed).forEach(c => {
        const nextD = getNextOccurenceDate(c.date);
        const endD = new Date(c.date); endD.setMonth(endD.getMonth() + c.duration);
        if(nextD >= todayObj && nextD <= maxDate && endD > nextD) {
            upcoming.push({title: c.product, sub: 'CC Instalment', date: nextD, amt: getCCIMonthlyForDate(c, nextD.getFullYear(), nextD.getMonth()), color: 'var(--red)'});
        }
    });

    upcoming.sort((a,b) => a.date - b.date);

    const wrap = $('dashUpcoming');
    if(!upcoming.length) {
        wrap.innerHTML = emptyState('✅', 'No Upcoming Payments', 'Nothing due in the next 30 days');
        return;
    }
    wrap.innerHTML = upcoming.map(u => {
        const days = Math.ceil((u.date - todayObj)/86400000);
        return `<div class="li-item">
            <div><div class="li-title">${u.title}</div><div class="li-sub">${u.sub}</div></div>
            <div style="text-align:right;"><div class="li-amt" style="color:${u.color};">${fmt(u.amt)}</div><div class="li-date">${days===0?'Today':days+' days'}</div></div>
        </div>`;
    }).join('');
}

function renderRecentActivity() {
    const recent = [];
    
    DB.getObj('balance').flows.forEach(f => {
        recent.push({title: f.company, sub: f.type==='out'?'Investment Out':f.type==='in'?'Income In':'Balance Set', date: new Date(f.date), amt: f.amount, color: f.type==='out'?'var(--red)':f.type==='in'?'var(--green)':'var(--accent)'});
    });

    DB.get('targets').forEach(t => {
        t.savings.forEach(s => {
            recent.push({title: t.name, sub: 'Savings Added', date: new Date(s.date), amt: s.amount, color: 'var(--green)'});
        });
    });

    recent.sort((a,b) => b.date - a.date);
    const top5 = recent.slice(0, 5);

    const wrap = $('dashRecent');
    if(!top5.length) {
        wrap.innerHTML = emptyState('📭', 'No Recent Activity', 'Your latest financial logs will appear here.');
        return;
    }
    wrap.innerHTML = top5.map(u => `<div class="li-item">
        <div><div class="li-title">${u.title}</div><div class="li-sub">${u.sub}</div></div>
        <div style="text-align:right;"><div class="li-amt" style="color:${u.color};">${fmt(u.amt)}</div><div class="li-date">${u.date.toISOString().split('T')[0]}</div></div>
    </div>`).join('');
}

// ==================== DSCR CALCULATOR ====================

function get12MonthAverages() {
    let totalInc = 0, totalOpex = 0, monthsWithData = 0;
    const now = new Date();
    
    for(let i=0; i<12; i++) {
        let y = now.getFullYear();
        let m = now.getMonth() - i;
        if (m < 0) { m += 12; y -= 1; }
        let md = getMonthlyData(y, m);
        if (md.income > 0 || md.totalExp > 0) {
            totalInc += md.income;
            totalOpex += md.totalExp;
            monthsWithData++;
        }
    }
    if (monthsWithData === 0) monthsWithData = 1;
    return { avgInc: totalInc / monthsWithData, avgOpex: totalOpex / monthsWithData };
}

function loadSystemIncomeAvg() {
    const avgs = get12MonthAverages();
    const input = $('dscrSysIncome');
    input.value = fmtN(avgs.avgInc);
    input.dataset.val = avgs.avgInc;
    calcDSCR();
}

function loadSystemOpexAvg() {
    const avgs = get12MonthAverages();
    const input = $('dscrSysOpex');
    input.value = fmtN(avgs.avgOpex);
    input.dataset.val = avgs.avgOpex;
    calcDSCR();
}

function clearDSCR() {
    $('dscrSysIncome').value = '';
    $('dscrSysIncome').dataset.val = '0';
    $('dscrCustIncome').value = '';
    
    $('dscrSysOpex').value = '';
    $('dscrSysOpex').dataset.val = '0';
    $('dscrCustOpex').value = '';
    
    $('dscrNewAmt').value = '';
    $('dscrNewRate').value = '';
    $('dscrNewDur').value = '';
    $('dscrDown').value = '';
    $('dscrPurpose').value = '';
    $('dscrAddExistingLoan').value = '';
    $('dscrExistingLoans').innerHTML = '';
    $('dscrResult').innerHTML = '<div style="font-size:13px;color:var(--text3);">Fill in the form to calculate eligibility based on local banking parameters.</div>';
}

function renderDSCR() {
    const loans = DB.get('loans');
    const select = $('dscrAddExistingLoan');
    let html = '<option value="">+ Fetch active loan from system...</option>';
    loans.forEach(l => {
        const active = loanEndDate(l) > new Date();
        if(active) html += `<option value="${l.monthly}">${l.name} (${l.bank}) - ${fmt(l.monthly)}/mo</option>`;
    });
    select.innerHTML = html;
    setTimeout(calcDSCR, 100);
}

function autoAddDSCRLoan() {
    const select = $('dscrAddExistingLoan');
    const val = parseFloat(select.value);
    if(val > 0) {
        addDscrLoanDOM(val);
        select.value = '';
        calcDSCR();
    }
}

function addDscrLoanDOM(amount = null) {
    const wrap = $('dscrExistingLoans');
    const el = document.createElement('div');
    el.className = 'fr';
    el.style.marginBottom = '8px';
    const valStr = amount !== null ? fmtN(amount) : '';
    el.innerHTML = `
        <div class="fg" style="margin:0;"><input class="fi money-input dscr-emi-input" value="${valStr}" placeholder="Monthly EMI (LKR)" oninput="calcDSCR()"></div>
        <div class="fg" style="margin:0;"><button class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove(); calcDSCR();" style="height:100%;">✕ Remove</button></div>
    `;
    wrap.appendChild(el);
    initMoneyInputs();
}

function calcDSCR() {
    const sysInc = parseFloat($('dscrSysIncome').dataset.val) || 0;
    const custInc = parseMoney($('dscrCustIncome').value);
    const inc = sysInc + custInc;

    const sysOpex = parseFloat($('dscrSysOpex').dataset.val) || 0;
    const custOpex = parseMoney($('dscrCustOpex').value);
    const opex = sysOpex + custOpex;

    const newAmt = parseMoney($('dscrNewAmt').value);
    const newRate = parseFloat($('dscrNewRate').value)||0;
    const newDur = parseInt($('dscrNewDur').value)||0;
    const down = parseMoney($('dscrDown').value);

    let existingEMI = 0;
    document.querySelectorAll('.dscr-emi-input').forEach(inp => { existingEMI += parseMoney(inp.value); });

    const actualNewLoan = Math.max(0, newAmt - down);
    const newEMI = calcEMI(actualNewLoan, newRate, newDur);
    const totalDebtService = existingEMI + newEMI;
    const noi = inc - opex;

    const resEl = $('dscrResult');
    
    if(totalDebtService === 0) {
        resEl.innerHTML = '<div style="font-size:13px;color:var(--text3);">Enter loan details to calculate your eligibility based on Sri Lankan banking parameters.</div>';
        return;
    }

    let dscr = 0;
    if (noi > 0) {
        dscr = noi / totalDebtService;
    } else {
        dscr = 0; 
    }

    let status='', color='', advicePool=[];
    
    if(dscr >= 1.5) { 
        status='EXCELLENT'; color='var(--green)'; 
        advicePool = [
            "Outstanding cash flow! You are in a prime position to negotiate the best lending rates. Consider asking your bank for a floating rate pegged to the AWPR.",
            "Highly likely to be approved. You have a very comfortable buffer to cover this loan and daily operations without strain.",
            "Excellent metrics. If this is a business loan, this strong DSCR could help you secure an uncollateralized facility."
        ];
    } else if(dscr >= 1.25) { 
        status='GOOD'; color='var(--blue)'; 
        advicePool = [
            "Likely to be approved. This meets the standard 1.2x - 1.25x requirement for most Sri Lankan commercial banks.",
            "Solid numbers. To negotiate a better interest rate, showcase your consistent monthly savings and propose a slightly higher down payment if possible.",
            "Good standing. Ensure all your CRIB records are clear, as banks will rely heavily on your repayment history at this tier."
        ];
    } else if(dscr >= 1.0) { 
        status='RISKY'; color='var(--accent)'; 
        advicePool = [
            "You are on the edge. Banks might ask for strong guarantors. A smart move right now would be to eliminate high-interest CC debt first to free up your net operating income.",
            "Borderline. You cover the payments, but it leaves little room for emergencies. Consider extending the loan tenure by a few years to reduce the EMI burden.",
            "Caution: You will likely need solid collateral (like property) to secure this. Try increasing your down payment by 10-15%."
        ];
    } else { 
        status='REJECTED'; color='var(--red)'; 
        advicePool = [
            "Don't let this discourage you! Consider extending the loan tenure to reduce monthly EMI, or focus on building a larger down payment first.",
            "High risk of rejection. Your combined expenses and proposed EMI exceed your net operating income. Focus on eliminating existing smaller loans before applying.",
            "Cannot afford under current structure. A joint-applicant (like your spouse) could immediately push this into the 'Approved' zone by combining incomes."
        ];
    }

    const advice = advicePool[Math.floor(Math.random() * advicePool.length)];

    let rot = (dscr - 1.0) * 180;
    if(rot < -90) rot = -90;
    if(rot > 90) rot = 90;

    resEl.innerHTML = `
        <div class="dscr-gauge-container">
            <div class="dscr-gauge-bg"></div>
            <svg viewBox="0 0 200 100" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;">
               <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#ggrad)" stroke-width="24" stroke-linecap="butt"/>
               <defs>
                 <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stop-color="var(--red)" />
                   <stop offset="50%" stop-color="var(--accent)" />
                   <stop offset="100%" stop-color="var(--green)" />
                 </linearGradient>
               </defs>
            </svg>
            <div class="dscr-gauge-needle" style="transform: translateX(-50%) rotate(${rot}deg);"></div>
        </div>
        <div style="font-size:42px;font-weight:900;font-family:var(--mono);color:${color};margin-top:10px;">${dscr.toFixed(2)}x</div>
        <div class="dscr-status" style="background:${color}22;color:${color};">${status}</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:16px;">
           <div class="ld"><div class="ld-l">TOTAL INCOME</div><div class="ld-v" style="color:var(--green);">${fmtS(inc)}</div></div>
           <div class="ld"><div class="ld-l">NET OP INCOME</div><div class="ld-v">${fmtS(noi)}</div></div>
           <div class="ld"><div class="ld-l">TOTAL DEBT</div><div class="ld-v">${fmtS(totalDebtService)}</div></div>
           <div class="ld"><div class="ld-l">NEW EMI</div><div class="ld-v" style="color:var(--red);">${fmtS(newEMI)}</div></div>
        </div>
        <div class="dscr-advice" style="border-left-color:${color};text-align:left;">${advice}</div>
    `;
}

// ==================== SETTINGS (ULTRA-PREMIUM UPGRADE) ====================
function renderSettings() {
    const s = DB.getObj('settings', { backupFreq: 'weekly', lastBackup: null, theme: 'dark', autoLock: 15, haptics: true });
    
    $('settingsContent').innerHTML = `
        <div class="settings-section" style="background: linear-gradient(145deg, var(--card), var(--bg2)); border: 1px solid var(--border2);">
            <div class="settings-title" style="color:var(--accent);">🎨 Appearance & System Experience</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Dark Theme</div><div class="setting-desc">Switch between Light and Dark aesthetic modes.</div></div>
                <div class="toggle ${s.theme==='dark'?'on':''}" onclick="toggleTheme(); renderSettings();"></div>
            </div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Haptic Feedback</div><div class="setting-desc">Enable subtle device vibrations for physical interactions.</div></div>
                <div class="toggle ${s.haptics?'on':''}" onclick="toggleSetting('haptics', ${!s.haptics}); triggerHaptic();"></div>
            </div>
        </div>

        <div class="settings-section" style="background: linear-gradient(145deg, var(--card), var(--bg2)); border: 1px solid var(--border2);">
            <div class="settings-title" style="color:var(--green);">🛡️ Core Security & Access</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Auto-Lock Engine</div><div class="setting-desc">Secure the vault after inactivity to prevent unauthorized access.</div></div>
                <select class="fi" style="width:140px; border-color:var(--border2);" onchange="updateAutoLock(this.value)">
                    <option value="0" ${s.autoLock===0?'selected':''}>Disabled (Unsafe)</option>
                    <option value="5" ${s.autoLock===5?'selected':''}>5 Minutes</option>
                    <option value="15" ${s.autoLock===15?'selected':''}>15 Minutes</option>
                    <option value="30" ${s.autoLock===30?'selected':''}>30 Minutes</option>
                </select>
            </div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Master PIN Management</div><div class="setting-desc">Update your AES-256 encrypted master access key.</div></div>
                <button class="btn btn-secondary btn-sm" onclick="openModal('mdChangePin')">Change PIN</button>
            </div>
        </div>
        
        <div class="settings-section" style="background: linear-gradient(145deg, var(--card), var(--bg2)); border: 1px solid var(--border2);">
            <div class="settings-title" style="color:var(--blue);">☁️ Infinity Cloud Synchronisation</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Real-time Connection Status</div><div class="setting-desc">Engine is monitoring connection to Google Firebase.</div></div>
                <div><span id="settingsCloudStatus" class="badge ${navigator.onLine?'bg-g':'bg-r'}" style="padding: 6px 12px;">${navigator.onLine?'● Securely Connected':'○ Offline Mode'}</span></div>
            </div>
        </div>

        <div class="settings-section" style="background: linear-gradient(145deg, var(--card), var(--bg2)); border: 1px solid var(--border2);">
            <div class="settings-title" style="color:var(--accent);">📈 Data Management & Reports</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Generate Elite Report</div><div class="setting-desc">Export a luxury PDF statement, Raw JSON, or Analytics CSV.</div></div>
                <button class="btn btn-primary btn-sm" style="box-shadow: 0 4px 15px var(--ag);" onclick="openModal('mdExport')">✨ Export Data</button>
            </div>
            
            <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin:24px 0 8px;">Google Drive Backup Integration</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Instant Cloud Backup</div><div class="setting-desc">Push an encrypted snapshot straight to your secure Google Drive.</div></div>
                <button class="btn btn-secondary btn-sm" onclick="requestDrivePermission('backup')">Backup to Drive</button>
            </div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Restore Data Protocol</div><div class="setting-desc">Recover your portfolio from Google Drive or a local file.</div></div>
                <button class="btn btn-secondary btn-sm" onclick="requestDrivePermission('restore'); openModal('mdRestoreCloud');">Restore Vault</button>
            </div>

            <div style="font-size:12px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.5px;margin:24px 0 8px;">Danger Zone</div>
            <div class="setting-row">
                <div class="setting-info"><div class="setting-label">Wipe System Data</div><div class="setting-desc">Format all financial records. Your PIN and Settings will remain safe.</div></div>
                <button class="btn btn-danger btn-sm" onclick="openModal('mdFactoryReset')">Format Database</button>
            </div>
        </div>
   `;
}

function updateAutoLock(val) {
    const s = DB.getObj('settings', {});
    s.autoLock = parseInt(val);
    DB.set('settings', s);
    notify(val === '0' ? 'Auto-lock disabled (Not Recommended)' : `Vault secures after ${val} minutes`);
    resetAutoLockTimer();
}

function toggleSetting(key, val) {
    const s = DB.getObj('settings', {});
    s[key] = val;
    DB.set('settings', s);
    renderSettings();
}

function triggerHaptic() {
    const s = DB.getObj('settings', {haptics: true});
    if(s.haptics && navigator.vibrate) {
        // Safe haptic implementation that works across different browsers
        try {
            if (typeof window.navigator.vibrate === 'function') {
                window.navigator.vibrate(40);
            }
        } catch(e) {
            // Ignore errors on non-supporting devices
        }
    }
}

// Intercept button clicks for luxury haptics
document.addEventListener('click', (e) => {
    if(e.target.tagName === 'BUTTON' || e.target.closest('.btn') || e.target.closest('.ib') || e.target.closest('.mtab')) {
        triggerHaptic();
    }
});

// ==================== EXPORT & REPORTING ====================
function toggleExportOptions() {
    const format = $('expFormat').value;
    $('pdfOptionsWrap').style.display = (format === 'pdf' || format === 'csv') ? 'block' : 'none';
}

function executeExport() {
    const format = $('expFormat').value;
    if(format === 'json') {
        const str = JSON.stringify(appData, null, 2);
        const blob = new Blob([str], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WealthFlow_MasterVault_${today()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notify('Raw JSON Vault secured and downloaded!', 'success');
        closeModal('mdExport');
    } else if (format === 'csv') {
        exportCSVReport();
        closeModal('mdExport');
    } else {
        generateLuxuryPDFReport();
        closeModal('mdExport');
    }
}

function exportCSVReport() {
    const year = parseInt($('expPdfYear').value);
    const month = parseInt($('expPdfMonth').value);
    const md = getMonthlyData(year, month);
    
    let csv = `WEALTHFLOW ANALYTICS REPORT,${MONTHS[month].toUpperCase()} ${year}\n\n`;
    
    csv += "TYPE,CATEGORY/BANK,DESCRIPTION,AMOUNT (LKR)\n";
    md.loanItems.forEach(l => csv += `LOAN,${l.bank},${l.name},${l.amount}\n`);
    md.ccItems2.forEach(c => csv += `CC INSTALLMENT,${c.bank},${c.name},${c.amount}\n`);
    md.expItems.forEach(e => csv += `EXPENSE,${e.cat},${e.name},${e.amount}\n`);
    
    csv += `\nSUMMARY\nTotal Income,,${md.income}\nTotal Expenses,,${md.totalExp}\nNet Balance,,${md.balance}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WealthFlow_Analytics_${MONTHS_S[month]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Analytics CSV Report generated.', 'success');
}

// ----------------- LUXURY PDF ENGINE -----------------
function generateLuxuryPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // A4 size
    
    const year = parseInt($('expPdfYear').value);
    const month = parseInt($('expPdfMonth').value);
    const md = getMonthlyData(year, month);
    
    // Luxury Brand Colors (Pantone 2965 C Dark Navy and Premium Gold)
    const brandNavy = [10, 25, 47]; 
    const brandGold = [212, 175, 55];
    const lightGrey = [248, 249, 250];
    const textGrey = [100, 116, 139];
    const darkText = [30, 41, 59];

    // Background Pattern / Watermark simulation
    doc.setFillColor(252, 253, 255);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(240, 240, 240);
    for(let i=0; i<300; i+=15) { doc.line(0, i, 210, i); }

    // Luxury Header Block
    doc.setFillColor(...brandNavy);
    doc.rect(0, 0, 210, 55, 'F');

    // Branding (Elegant Serif feel)
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...brandGold);
    doc.text("WEALTHFLOW", 15, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("PRIVATE WEALTH MANAGEMENT STATEMENT", 16, 33);
    
    // Client Meta Info (Right aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`PREPARED EXCLUSIVELY FOR:`, 195, 22, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...brandGold);
    doc.text(`SACHINTHA GAURAWA`, 195, 28, { align: 'right' });
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.text(`STATEMENT PERIOD: ${MONTHS[month].toUpperCase()} ${year}`, 195, 38, { align: 'right' });
    doc.text(`GENERATED ON: ${today()}`, 195, 44, { align: 'right' });

    // Decorative Gold Accent Line
    doc.setFillColor(...brandGold);
    doc.rect(0, 55, 210, 2, 'F');

    // Executive Summary Box (Glassmorphism / Clean UI look)
    doc.setDrawColor(220, 226, 230);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 65, 180, 35, 4, 4, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...textGrey);
    doc.text("TOTAL INFLOW", 30, 78, { align: 'center' });
    doc.text("TOTAL OUTFLOW", 105, 78, { align: 'center' });
    doc.text("NET POSITION", 180, 78, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`${fmtN(md.income)}`, 30, 88, { align: 'center' });
    
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`${fmtN(md.totalExp)}`, 105, 88, { align: 'center' });
    
    doc.setTextColor(...brandNavy); 
    doc.text(`${fmtN(md.balance)}`, 180, 88, { align: 'center' });

    let startY = 115;

    // Advanced Table Config
    const tableOptions = {
        theme: 'grid',
        headStyles: { fillColor: lightGrey, textColor: brandNavy, fontStyle: 'bold', fontSize: 10, lineColor: 230, lineWidth: 0.1 },
        bodyStyles: { fontSize: 10, textColor: darkText, lineColor: 240, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: 15, right: 15 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } } // Right align money
    };

    // 1. Income
    doc.setFont("times", "bold");
    doc.setFontSize(16); doc.setTextColor(...brandNavy);
    doc.text("I. Asset Yields & Income", 15, startY);
    
    const activeIncome = DB.get('income').filter(s => {
        const dt = new Date(year,month,1);
        const start = new Date(s.start+'T00:00:00');
        const end = s.end ? new Date(s.end+'T00:00:00') : null;
        return start <= dt && (!end || end >= dt);
    });

    if(activeIncome.length > 0) {
        doc.autoTable({
            startY: startY + 6,
            head: [['Yield Source', 'Managing Institution', 'Realized Return (LKR)']],
            body: activeIncome.map(i => [i.name, i.company, fmtN(i.monthly)]),
            ...tableOptions
        });
        startY = doc.lastAutoTable.finalY + 18;
    } else {
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...textGrey);
        doc.text("No yields realized for this fiscal period.", 15, startY + 10); startY += 20;
    }

    // 2. Debt
    doc.setFont("times", "bold");
    doc.setFontSize(16); doc.setTextColor(...brandNavy);
    doc.text("II. Debt Servicing (Loans)", 15, startY);
    if(md.loanItems.length > 0) {
        doc.autoTable({
            startY: startY + 6,
            head: [['Facility / Product', 'Banking Institution', 'Monthly Payment (LKR)']],
            body: md.loanItems.map(l => [l.name, l.bank, fmtN(l.amount)]),
            ...tableOptions
        });
        startY = doc.lastAutoTable.finalY + 18;
    } else {
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...textGrey);
        doc.text("No active debt obligations recorded.", 15, startY + 10); startY += 20;
    }

    // 3. Opex & CC
    doc.setFont("times", "bold");
    doc.setFontSize(16); doc.setTextColor(...brandNavy);
    doc.text("III. Operations & Card Installments", 15, startY);
    const combinedExp = [];
    md.ccItems2.forEach(c => combinedExp.push([c.name + ' (Card Installment)', c.bank, fmtN(c.amount)]));
    md.expItems.forEach(e => combinedExp.push([e.name, e.cat, fmtN(e.amount)]));

    if(combinedExp.length > 0) {
        doc.autoTable({
            startY: startY + 6,
            head: [['Description', 'Category', 'Expense (LKR)']],
            body: combinedExp,
            ...tableOptions
        });
    } else {
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...textGrey);
        doc.text("No operating expenses registered.", 15, startY + 10);
    }

    // Page Footer (Every page)
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...brandNavy);
        doc.rect(0, 285, 210, 12, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...brandGold);
        doc.text("WEALTHFLOW ELITE ENGINE", 15, 292);
        
        doc.setFont("helvetica", "normalI seem to be encountering an error. Can I try something else for you?
