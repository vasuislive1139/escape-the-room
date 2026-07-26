/**
 * Tech Tatva 2026: Escape The Room
 * Progressive Zone Login & Password Gating System (zone-auth.js)
 * Implements the authentication flow: Zone Click ➔ Login & Password ➔ Solve Challenge ➔ Reveal Next Password
 */

const ZONE_PASSWORDS = {
  1: ["START", "TATVA2026", "HUNT2026"],       // Initial passwords for Zone 1
  2: ["REACT-GRID-02", "REACTGRID02"],         // Password obtained from solving Zone 1
  3: ["SHIFT-CYBER-03", "SHIFTCYBER03"],       // Password obtained from solving Zone 2
  4: ["MATRIX-QR-04", "MATRIXQR04"]            // Password obtained from solving Zone 3
};

const ZONE_NAMES = {
  1: "Zone 1: Digital Scavenger Hunt",
  2: "Zone 2: Component Crossword",
  3: "Zone 3: Cipher Chase",
  4: "Zone 4: QR Chain Challenge (Grand Finale)"
};

const ZONE_HINTS = {
  1: "💡 Welcome to Tech Tatva! Enter initial access password <strong>START</strong> or <strong>TATVA2026</strong> to begin.",
  2: "🔒 Access Restricted! You must solve <strong>Zone 1 (Scavenger Hunt)</strong> to obtain the secret password for Zone 2.",
  3: "🔒 Access Restricted! You must solve <strong>Zone 2 (Component Crossword)</strong> to obtain the secret password for Zone 3.",
  4: "🔒 Access Restricted! You must solve <strong>Zone 3 (Cipher Chase)</strong> to obtain the secret master password for Zone 4."
};

const ZoneAuth = {
  currentZone: 1,

  init(zoneNumber) {
    this.currentZone = zoneNumber;
    this.injectLoginModal(zoneNumber);
    this.checkAccess(zoneNumber);
    this.injectResetButton();
  },

  isUnlocked(zoneNum) {
    // Zone 1 is always unlocked or unlocked via START
    return localStorage.getItem(`techTatva_unlocked_zone_${zoneNum}`) === 'true';
  },

  unlock(zoneNum) {
    localStorage.setItem(`techTatva_unlocked_zone_${zoneNum}`, 'true');
    // Also unlock in main portal progress
    localStorage.setItem('techTatva_latest_unlocked', Math.max(zoneNum, parseInt(localStorage.getItem('techTatva_latest_unlocked') || 1, 10)));
  },

  checkAccess(zoneNum) {
    const modal = document.getElementById('zoneLoginOverlay');
    if (!modal) return;

    if (this.isUnlocked(zoneNum)) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    } else {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      // Focus password box
      setTimeout(() => {
        const passInput = document.getElementById('zonePasswordInput');
        if (passInput) passInput.focus();
      }, 300);
    }
  },

  verifyLogin() {
    const loginVal = document.getElementById('zoneLoginInput')?.value.trim() || 'Anonymous Team';
    const passVal = (document.getElementById('zonePasswordInput')?.value || '').trim().toUpperCase();
    const errorEl = document.getElementById('zoneAuthError');

    if (!passVal) {
      if (errorEl) {
        errorEl.style.color = '#ff3333';
        errorEl.innerHTML = "⚠️ Please enter a valid zone password!";
      }
      if (window.soundSystem) window.soundSystem.playError();
      return;
    }

    const validPasswords = ZONE_PASSWORDS[this.currentZone] || [];
    if (validPasswords.includes(passVal)) {
      if (errorEl) {
        errorEl.style.color = '#00ff66';
        errorEl.innerHTML = "✨ <strong>ACCESS GRANTED!</strong> Welcome, " + loginVal + ". Unlocking zone...";
      }
      if (window.soundSystem) window.soundSystem.playUnlock();

      this.unlock(this.currentZone);

      setTimeout(() => {
        const modal = document.getElementById('zoneLoginOverlay');
        if (modal) {
          modal.style.opacity = '0';
          modal.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
          }, 500);
        }
      }, 700);
    } else {
      if (errorEl) {
        errorEl.style.color = '#ff3333';
        errorEl.innerHTML = `❌ <strong>ACCESS DENIED!</strong> Incorrect password for Zone ${this.currentZone}. Solve the previous zone challenge!`;
      }
      if (window.soundSystem) window.soundSystem.playError();
      const inputEl = document.getElementById('zonePasswordInput');
      if (inputEl) {
        inputEl.style.borderColor = '#ff3333';
        setTimeout(() => inputEl.style.borderColor = '', 1000);
      }
    }
  },

  injectLoginModal(zoneNum) {
    if (document.getElementById('zoneLoginOverlay')) return;

    const modalHtml = `
      <div class="zone-login-overlay" id="zoneLoginOverlay">
        <div class="zone-login-card">
          <div class="zone-login-header">
            <span class="zone-lock-icon">🔒</span>
            <div>
              <div class="zone-login-subtitle">TECH TATVA 2026 SECURITY GATEWAY</div>
              <h2 class="zone-login-title">${ZONE_NAMES[zoneNum] || 'Restricted Zone'}</h2>
            </div>
          </div>
          
          <div class="zone-login-body">
            <div class="zone-login-hint">${ZONE_HINTS[zoneNum] || ''}</div>
            
            <div class="form-group" style="margin-bottom: 20px; text-align: left;">
              <label style="font-family: var(--font-code); color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 6px;">
                👤 Team Name / Login ID:
              </label>
              <input type="text" id="zoneLoginInput" class="zone-input-field" placeholder="e.g. Team CyberHounds or Participant ID" value="Team Alpha">
            </div>

            <div class="form-group" style="margin-bottom: 25px; text-align: left;">
              <label style="font-family: var(--font-code); color: var(--gold-bright); font-size: 0.9rem; display: block; margin-bottom: 6px;">
                🔑 Zone Access Password:
              </label>
              <input type="password" id="zonePasswordInput" class="zone-input-field" placeholder="Enter secret password..." onkeypress="if(event.key==='Enter') ZoneAuth.verifyLogin()">
            </div>

            <div id="zoneAuthError" style="font-family: var(--font-code); font-size: 0.95rem; min-height: 25px; margin-bottom: 20px; font-weight: 700;"></div>

            <button onclick="ZoneAuth.verifyLogin()" class="btn-primary" style="width: 100%; padding: 15px; font-size: 1.1rem; justify-content: center; display: flex; align-items: center; gap: 10px;">
              <span>🔓</span> UNLOCK & ENTER ZONE
            </button>
            
            <div style="margin-top: 25px; text-align: center;">
              <a href="index.html#activities" style="color: #888; font-family: var(--font-code); font-size: 0.85rem; text-decoration: underline;">
                ⬅ Return to Main Website Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  },

  injectResetButton() {
    if (document.getElementById('zoneResetBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'zoneResetBtn';
    btn.className = 'zone-reset-btn';
    btn.innerHTML = '🔒 Reset Zone Locks (Test Mode)';
    btn.onclick = () => {
      if (confirm("Reset all unlocked zones? This will re-lock Zone 1, 2, 3, and 4 for testing.")) {
        this.resetAll();
      }
    };
    document.body.appendChild(btn);
  },

  resetAll() {
    [1, 2, 3, 4].forEach(z => localStorage.removeItem(`techTatva_unlocked_zone_${z}`));
    localStorage.removeItem('techTatva_latest_unlocked');
    alert("All Zone locks reset! Reloading page...");
    window.location.reload();
  }
};

window.ZoneAuth = ZoneAuth;
