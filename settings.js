// In your settings component, modify to hide API keys from users
// Keep in backend only

// settings.js - Frontend (User-facing)
export function renderSettings() {
    return `
        <div class="settings-container">
            <h2>Settings</h2>
            
            <!-- User Settings (Visible) -->
            <div class="setting-section">
                <h3>🔔 Notifications</h3>
                <label>
                    <input type="checkbox" id="pushNotifications" checked>
                    Enable Push Notifications
                </label>
                <label>
                    <input type="checkbox" id="emailNotifications">
                    Email Notifications
                </label>
            </div>
            
            <div class="setting-section">
                <h3>🎭 AI Advisor</h3>
                <select id="aiPersona">
                    <option value="supportive">😊 Supportive & Gentle</option>
                    <option value="balanced" selected>⚖️ Balanced Professional</option>
                    <option value="strict">👨💼 Strict Financial Advisor</option>
                    <option value="aggressive">🔥 Aggressive Wealth Builder</option>
                </select>
            </div>
            
            <div class="setting-section">
                <h3>🔐 Security</h3>
                <button onclick="changePIN()">Change PIN</button>
                <button onclick="setupBiometrics()">Enable Biometrics</button>
                <button onclick="setupRecovery()">Setup Recovery</button>
            </div>
            
            <!-- ADMIN ONLY - Hidden from regular users -->
            <div class="setting-section admin-only" style="display:none;">
                <h3>⚙️ System Integration</h3>
                <label>Gemini AI API Key (Local Mode)</label>
                <input type="password" id="geminiKey" placeholder="••••••••••••">
            </div>
        </div>
    `;
}

// Check if admin - only show system integration for admins
function checkAdminStatus() {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const adminSections = document.querySelectorAll('.admin-only');
    adminSections.forEach(section => {
        section.style.display = isAdmin ? 'block' : 'none';
    });
}
