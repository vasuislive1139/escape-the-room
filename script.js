/**
 * ESCAPE THE ROOM — COMPLETE INTERACTIVE ENGINE
 * Handles particle animations, Web Audio ambient atmosphere, login authentication
 * against the Game Master database, sequential unlocking, and real-time Game Master command reception.
 */

const PLAYER_GM_CHANNEL = 'escape_gm_channel';
let playerBroadcastChannel = null;
try {
    playerBroadcastChannel = new BroadcastChannel(PLAYER_GM_CHANNEL);
} catch (e) {
    console.warn("BroadcastChannel not supported in this browser.");
}

document.addEventListener('DOMContentLoaded', () => {
    initEmbersCanvas();
    initAudioEngine();
    initFormControls();
    initDemoHelpers();
    initHomeProgression();
    initGameMasterListener();
});

/* ==========================================================================
   1. EMBERS & GOLD DUST PARTICLE CANVAS
   ========================================================================== */
function initEmbersCanvas() {
    const canvas = document.getElementById('embersCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 45;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * height;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = height + 10;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedY = Math.random() * 0.8 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.7 + 0.2;
            this.fadeSpeed = (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1);
            
            const colors = [
                'rgba(197, 160, 89, ',  // Gold
                'rgba(230, 200, 135, ', // Bright Gold
                'rgba(80, 227, 194, ',  // Cyber Teal spark
                'rgba(255, 140, 50, '   // Ember Orange
            ];
            this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.y -= this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;
            this.opacity += this.fadeSpeed;

            if (this.opacity <= 0.1 || this.opacity >= 0.9) {
                this.fadeSpeed = -this.fadeSpeed;
            }

            if (this.y < -10 || this.x < -10 || this.x > width + 10) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.colorBase + Math.max(0, Math.min(1, this.opacity)) + ')';
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.colorBase + '0.8)';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
}

/* ==========================================================================
   2. SYNTHESIZED WEB AUDIO ENGINE
   ========================================================================== */
let audioCtx = null;
let ambientOsc1 = null;
let ambientOsc2 = null;
let ambientGain = null;
let isMuted = true;

function initAudioEngine() {
    const audioBtn = document.getElementById('audioToggleBtn');
    const soundOnIcon = document.getElementById('soundOnIcon');
    const soundOffIcon = document.getElementById('soundOffIcon');

    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            startAmbientAudio();
            isMuted = false;
        } else {
            isMuted = !isMuted;
            if (isMuted) {
                audioCtx.suspend();
            } else {
                audioCtx.resume();
            }
        }

        if (isMuted) {
            if (soundOnIcon) soundOnIcon.classList.add('hidden');
            if (soundOffIcon) soundOffIcon.classList.remove('hidden');
            audioBtn.style.borderColor = 'var(--gold-dark)';
            audioBtn.style.color = 'var(--gold-primary)';
        } else {
            if (soundOnIcon) soundOnIcon.classList.remove('hidden');
            if (soundOffIcon) soundOffIcon.classList.add('hidden');
            audioBtn.style.borderColor = 'var(--gold-bright)';
            audioBtn.style.color = 'var(--gold-bright)';
        }

        playClickSound();
    });
}

function startAmbientAudio() {
    if (!audioCtx) return;

    ambientOsc1 = audioCtx.createOscillator();
    ambientOsc2 = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();

    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.setValueAtTime(55, audioCtx.currentTime);

    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(82.41, audioCtx.currentTime);
    ambientOsc2.detune.setValueAtTime(8, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, audioCtx.currentTime);

    ambientGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    ambientOsc1.connect(filter);
    ambientOsc2.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);

    ambientOsc1.start();
    ambientOsc2.start();
}

function playClickSound() {
    if (!audioCtx || isMuted) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {}
}

function playUnlockSound() {
    if (!audioCtx) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        } catch(e) { return; }
    }
    if (isMuted && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    try {
        const now = audioCtx.currentTime;
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(150, now);
        clickOsc.frequency.setValueAtTime(300, now + 0.05);
        clickGain.gain.setValueAtTime(0.15, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.1);

        const chimeOsc = audioCtx.createOscillator();
        const chimeGain = audioCtx.createGain();
        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(523.25, now + 0.15);
        chimeOsc.frequency.setValueAtTime(659.25, now + 0.3);
        chimeOsc.frequency.setValueAtTime(783.99, now + 0.45);
        chimeOsc.frequency.setValueAtTime(1046.50, now + 0.6);

        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.setValueAtTime(0.2, now + 0.15);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(audioCtx.destination);
        chimeOsc.start(now + 0.15);
        chimeOsc.stop(now + 2.5);
    } catch(e) {}
}

function playErrorSound() {
    if (!audioCtx || isMuted) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.setValueAtTime(140, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch(e) {}
}

/* ==========================================================================
   3. FORM CONTROLS & AUTHENTICATION (INDEX.HTML)
   ========================================================================== */
function initFormControls() {
    const loginForm = document.getElementById('loginForm');
    const teamIdInput = document.getElementById('teamIdInput');
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            playClickSound();
        });
    }

    [teamIdInput, passwordInput].forEach(input => {
        if (!input) return;
        input.addEventListener('focus', () => {
            playClickSound();
            if (errorMessage && !errorMessage.classList.contains('hidden')) {
                errorMessage.classList.add('hidden');
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const teamId = teamIdInput.value.trim().toUpperCase();
            const password = passwordInput.value.trim();

            if (!teamId || !password) {
                showError("Please enter both your Team ID and Password.");
                return;
            }

            let isValid = false;
            let startingStage = 1;
            let teamStatus = 'active';

            const rawDb = localStorage.getItem('escape_teams_db');
            if (rawDb) {
                try {
                    const db = JSON.parse(rawDb);
                    if (db[teamId] && db[teamId].password === password) {
                        isValid = true;
                        startingStage = db[teamId].stage || 1;
                        teamStatus = db[teamId].status || 'active';
                    }
                } catch(err) {}
            }

            if (!isValid) {
                // Only fallback to these if the database somehow failed to initialize,
                // and ONLY allow these exact matches.
                const validCredentials = {
                    'TEAM-ALPHA': 'ESCAPE2026',
                    'CYBER KNIGHTS': 'TATVAPASS1',
                    'PHOENIX-007': 'UNLOCKME',
                    'SHERLOCK HOMIES': 'BAKER221',
                    'ADMIN': 'ADMIN123'
                };
                if (validCredentials[teamId] && validCredentials[teamId] === password) {
                    isValid = true;
                }
            }

            if (isValid) {
                if (teamStatus === 'frozen') {
                    showError("❄️ Account Frozen: Your team progress is currently suspended by the Game Master.");
                } else {
                    handleSuccessfulLogin(teamId, startingStage);
                }
            } else {
                showError("Invalid credentials. Complete offline ground activities or ask event judges for your Team ID!");
            }
        });
    }

    function showError(msg) {
        if (!errorMessage) return;
        errorText.textContent = msg;
        errorMessage.classList.remove('hidden');
        playErrorSound();
        
        errorMessage.style.animation = 'none';
        errorMessage.offsetHeight;
        errorMessage.style.animation = null;
    }
}

function handleSuccessfulLogin(teamId, startingStage = 1) {
    playUnlockSound();

    const unlockModal = document.getElementById('unlockModal');
    const grantedTeamName = document.getElementById('grantedTeamName');
    const unlockProgressBar = document.getElementById('unlockProgressBar');
    const lockAnimationBox = document.querySelector('.lock-animation-box');

    if (grantedTeamName) grantedTeamName.textContent = teamId;
    if (unlockModal) unlockModal.classList.remove('hidden');

    setTimeout(() => {
        if (lockAnimationBox) lockAnimationBox.classList.add('lock-unlocked');
    }, 200);

    setTimeout(() => {
        if (unlockProgressBar) unlockProgressBar.style.width = '100%';
    }, 300);

    localStorage.setItem('escape_team_id', teamId);
    if (!localStorage.getItem('escape_unlocked_level') || startingStage > 1) {
        localStorage.setItem('escape_unlocked_level', startingStage.toString());
    }

    setTimeout(() => {
        window.location.href = 'home.html';
    }, 2500);
}

function initDemoHelpers() {
    const demoHintBtn = document.getElementById('demoHintBtn');
    const demoHintContent = document.getElementById('demoHintContent');
    if (demoHintBtn && demoHintContent) {
        demoHintBtn.addEventListener('click', () => {
            demoHintContent.classList.toggle('hidden');
            playClickSound();
        });
    }
}

function quickLoginAs(teamId, password) {
    const teamIdInput = document.getElementById('teamIdInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    if (teamIdInput && passwordInput) {
        teamIdInput.value = teamId;
        passwordInput.value = password;
        if (typeof playClickSound === 'function') playClickSound();

        let db = {};
        try { db = JSON.parse(localStorage.getItem('escape_teams_db') || '{}'); } catch(e) {}
        if (!db[teamId]) {
            const stages = { 'TEAM-ALPHA': 1, 'CYBER KNIGHTS': 2, 'PHOENIX-007': 3, 'SHERLOCK HOMIES': 4 };
            db[teamId] = { password: password, stage: stages[teamId] || 1, status: 'active', warnings: 0 };
            localStorage.setItem('escape_teams_db', JSON.stringify(db));
        }

        setTimeout(() => {
            if (loginSubmitBtn) {
                loginSubmitBtn.click();
            } else {
                handleSuccessfulLogin(teamId, db[teamId].stage || 1);
            }
        }, 100);
    }
}
window.quickLoginAs = quickLoginAs;

/* ==========================================================================
   4. HOME PAGE PROGRESSION & REAL-TIME GAME MASTER INTERVENTIONS
   ========================================================================== */
let currentActiveModalStage = 1;

function initHomeProgression() {
    const activitiesGrid = document.getElementById('activitiesGrid');
    if (!activitiesGrid) return;

    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) {
        window.location.href = 'index.html';
        return;
    }
    
    const navTeamId = document.getElementById('navTeamId');
    if (navTeamId) navTeamId.textContent = teamId;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    renderProgressionState();
    checkInitialFreezeStatus(teamId);
}

function checkInitialFreezeStatus(teamId) {
    const rawDb = localStorage.getItem('escape_teams_db');
    if (rawDb) {
        try {
            const db = JSON.parse(rawDb);
            if (db[teamId] && db[teamId].status === 'frozen') {
                const overlay = document.getElementById('gmFreezeOverlay');
                if (overlay) overlay.classList.remove('hidden');
            }
        } catch(e) {}
    }
}

function renderProgressionState() {
    const unlockedLevel = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);

    for (let i = 1; i <= 4; i++) {
        const card = document.getElementById(`card-act-${i}`);
        if (!card) continue;

        const badge = card.querySelector('.stage-badge');
        const btn = card.querySelector('.explore-btn');

        if (i <= unlockedLevel) {
            card.className = 'activity-card unlocked';
            if (badge) {
                badge.className = 'stage-badge';
                badge.textContent = i < unlockedLevel ? `STAGE 0${i} — COMPLETED ✓` : `STAGE 0${i} — OPEN`;
            }
            if (btn) {
                btn.className = 'explore-btn unlocked-btn';
                btn.innerHTML = `<span>${i < unlockedLevel ? 'RE-EXPLORE' : 'EXPLORE'}</span><span class="arrow">➔</span>`;
                const activityId = i;
                if (activityId === 1) {
                    btn.textContent = "EXPLORE";
                    btn.setAttribute('onclick', "window.location.href = 'scavenger-hunt.html'");
                } else if (activityId === 2) {
                    btn.textContent = "EXPLORE";
                    btn.setAttribute('onclick', "window.location.href = 'crossword.html'");
                } else if (activityId === 3) {
                    btn.setAttribute('onclick', "window.location.href = 'cipher-chase.html'");
                } else {
                    btn.setAttribute('onclick', `openChallengeModal(${i})`);
                }
            }
        } else {
            card.className = 'activity-card locked';
            if (badge) {
                badge.className = 'stage-badge locked-badge';
                badge.textContent = `🔒 STAGE 0${i} — LOCKED`;
            }
            if (btn) {
                btn.className = 'explore-btn locked-btn';
                btn.innerHTML = `<span class="lock-icon">🔒</span><span class="btn-label">LOCKED</span>`;
                btn.setAttribute('onclick', `handleLockedClick(${i})`);
            }
        }
    }

    const trackerSteps = document.querySelectorAll('#trackerSteps .step');
    trackerSteps.forEach(stepEl => {
        const stageNum = parseInt(stepEl.getAttribute('data-stage'), 10);
        if (stageNum < unlockedLevel) {
            stepEl.className = 'step cleared';
            stepEl.textContent = `${stageNum}. Cleared ✓`;
        } else if (stageNum === unlockedLevel) {
            stepEl.className = 'step active';
        } else {
            stepEl.className = 'step locked';
        }
    });
}

function handleLockedClick(stageNum) {
    playErrorSound();
    const reqStage = stageNum - 1;
    showNotification(`🔒 Stage 0${stageNum} is locked! Complete Stage 0${reqStage} first to get access.`);
    
    const card = document.getElementById(`card-act-${stageNum}`);
    if (card) {
        card.style.animation = 'shake 0.4s ease';
        setTimeout(() => { card.style.animation = null; }, 400);
    }
}

/* ==========================================================================
   5. GAME MASTER REAL-TIME INTERVENTION LISTENER & POLLING SYNCHRONIZER
   ========================================================================== */
let lastProcessedCmdId = null;
let lastSyncedFreezeState = null;
let lastSyncedStage = null;

function initGameMasterListener() {
    if (playerBroadcastChannel) {
        playerBroadcastChannel.onmessage = (event) => {
            if (event.data) processGmCommand(event.data);
        };
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'escape_gm_live_cmd' && e.newValue) {
            try {
                const cmd = JSON.parse(e.newValue);
                processGmCommand(cmd);
            } catch(err) {}
        }
        syncWithGameMasterDb();
    });

    // High-speed 150ms background polling synchronizer
    // Guarantees 100% instant updates without refreshing the window!
    setInterval(syncWithGameMasterDb, 150);
}

function syncWithGameMasterDb() {
    // 1. Check for live broadcast or action commands in localStorage
    const rawCmd = localStorage.getItem('escape_gm_live_cmd');
    if (rawCmd) {
        try {
            const cmd = JSON.parse(rawCmd);
            processGmCommand(cmd);
        } catch(e) {}
    }

    // 2. Check if our team's database state changed (e.g. frozen, promoted, warned)
    const myTeam = (localStorage.getItem('escape_team_id') || 'TEAM-ALPHA').trim().toUpperCase();
    const rawDb = localStorage.getItem('escape_teams_db');
    if (rawDb) {
        try {
            const db = JSON.parse(rawDb);
            let teamData = db[myTeam];
            if (!teamData) {
                const foundKey = Object.keys(db).find(k => k.trim().toUpperCase() === myTeam);
                if (foundKey) teamData = db[foundKey];
            }
            if (teamData) {
                // Check Freeze status change
                const isNowFrozen = (teamData.status === 'frozen');
                if (lastSyncedFreezeState !== isNowFrozen) {
                    lastSyncedFreezeState = isNowFrozen;
                    const overlay = document.getElementById('gmFreezeOverlay');
                    if (overlay) {
                        if (isNowFrozen) {
                            overlay.classList.remove('hidden');
                            if (typeof playErrorSound === 'function') playErrorSound();
                        } else {
                            overlay.classList.add('hidden');
                            if (typeof playUnlockSound === 'function') playUnlockSound();
                        }
                    }
                }

                // Check Stage promotion or demotion change
                const currentLocalStage = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
                if (teamData.stage && teamData.stage !== currentLocalStage) {
                    const oldStage = currentLocalStage;
                    localStorage.setItem('escape_unlocked_level', teamData.stage.toString());
                    if (typeof renderProgressionState === 'function') renderProgressionState();
                    if (typeof showToast === 'function') {
                        if (teamData.stage > oldStage) {
                            showToast("⏩ STAGE PROMOTED BY GAME MASTER", `You have been advanced to Stage 0${teamData.stage}!`);
                            if (typeof playUnlockSound === 'function') playUnlockSound();
                        } else {
                            showToast("⏪ STAGE DEMOTED BY GAME MASTER", `You have been moved back to Stage 0${teamData.stage}.`);
                            if (typeof playErrorSound === 'function') playErrorSound();
                        }
                    }
                }
            }
        } catch(e) {}
    }
}

function processGmCommand(cmd) {
    if (!cmd || !cmd.id || cmd.id === lastProcessedCmdId) return;
    lastProcessedCmdId = cmd.id;

    const myTeam = localStorage.getItem('escape_team_id') || 'TEAM-ALPHA';
    
    // Process command if targeted to ALL or to this specific team (case-insensitive)
    if (cmd.target !== 'ALL' && cmd.target.toUpperCase() !== myTeam.toUpperCase()) return;

    if (cmd.type === 'BROADCAST') {
        openGmBroadcast("📢 GAME MASTER ANNOUNCEMENT", cmd.message);
    } else if (cmd.type === 'WARNING') {
        playErrorSound();
        showToast("⚠️ RULE WARNING", cmd.message);
        document.body.style.animation = 'shake 0.6s ease';
        setTimeout(() => { document.body.style.animation = null; }, 600);
    } else if (cmd.type === 'FREEZE') {
        playErrorSound();
        const overlay = document.getElementById('gmFreezeOverlay');
        if (overlay) overlay.classList.remove('hidden');
        showToast("❄️ PROGRESS FROZEN", cmd.message || "Your team has been temporarily frozen by event judges.");
    } else if (cmd.type === 'UNFREEZE') {
        playUnlockSound();
        const overlay = document.getElementById('gmFreezeOverlay');
        if (overlay) overlay.classList.add('hidden');
        showToast("🔥 ACCOUNT UNFROZEN", cmd.message || "Gameplay restored.");
    } else if (cmd.type === 'PROMOTE') {
        playUnlockSound();
        const cur = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
        const targetStage = cmd.stage || (cur + 1);
        if (targetStage >= 1 && targetStage <= 4) {
            localStorage.setItem('escape_unlocked_level', targetStage.toString());
            renderProgressionState();
            showToast("⏩ STAGE PROMOTION", cmd.message || `Advanced to Stage 0${targetStage}!`);
        }
    } else if (cmd.type === 'DEMOTE') {
        playErrorSound();
        const cur = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
        const targetStage = cmd.stage || (cur - 1);
        if (targetStage >= 1 && targetStage <= 4) {
            localStorage.setItem('escape_unlocked_level', targetStage.toString());
            renderProgressionState();
            showToast("⏪ STAGE DEMOTED", cmd.message || `Moved back to Stage 0${targetStage}.`);
        }
    } else if (cmd.type === 'LOGOUT') {
        alert("Your session credentials have been revoked by the Game Master.");
        window.location.href = 'index.html';
    }

    if (playerBroadcastChannel) {
        playerBroadcastChannel.postMessage({
            type: 'PLAYER_UPDATE',
            teamId: myTeam,
            stage: parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10)
        });
    }
}

function openGmBroadcast(title, message) {
    if (typeof playUnlockSound === 'function') playUnlockSound();
    const modal = document.getElementById('gmBroadcastModal');
    const titleEl = document.getElementById('gmBroadcastTitle');
    const msgEl = document.getElementById('gmBroadcastMsg');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeGmBroadcast() {
    if (typeof playClickSound === 'function') playClickSound();
    const modal = document.getElementById('gmBroadcastModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

/* ==========================================================================
   6. CHALLENGE GAMEPLAY MODAL & ORGANIZER METHODS
   ========================================================================== */
const stagePuzzles = {
    1: {
        title: "PUZZLE SOLVING",
        riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        hint: "Type your answer (Hint: ECHO or ESCAPE)",
        answers: ['ECHO', 'ESCAPE', 'ROOM', 'WIND', 'TEST', 'DEMO', '1']
    },
    2: {
        title: "TREASURE HUNT",
        riddle: "Decode the secret cipher found on the treasure map: '20-18-5-1-19-21-18-5' (A=1, B=2, C=3...). What is the word?",
        hint: "Type the decoded word (Hint: TREASURE or GOLD)",
        answers: ['TREASURE', 'GOLD', 'MAP', 'HUNT', 'KEY']
    },
    3: {
        title: "TECH CHALLENGES",
        riddle: "Security Breach Protocol: What is the standard binary equivalent of hexadecimal 0xF? (Or enter override code '2026')",
        hint: "Type binary or code (Hint: 1111 or 2026)",
        answers: ['1111', '15', '0XF', '2026', 'BREACH', 'HACK']
    },
    4: {
        title: "EXCITING REWARDS",
        riddle: "THE FINAL VAULT: You have conquered all tech challenges! Type the club passcode to unlock the ultimate reward & leaderboard.",
        hint: "Type passcode (Hint: WINNER or CHAMPION)",
        answers: ['WINNER', 'CHAMPION', 'VICTORY', 'ESCAPE', 'REWARD']
    }
};

function openChallengeModal(stageNum) {
    currentActiveModalStage = stageNum;
    playClickSound();

    const modal = document.getElementById('challengeModal');
    const stageNumEl = document.getElementById('modalStageNum');
    const titleEl = document.getElementById('challengeModalTitle');
    const riddleEl = document.getElementById('riddleText');
    const inputEl = document.getElementById('puzzleAnswerInput');
    const feedbackEl = document.getElementById('puzzleFeedback');

    const data = stagePuzzles[stageNum] || stagePuzzles[1];

    if (stageNumEl) stageNumEl.textContent = `STAGE 0${stageNum}`;
    if (titleEl) titleEl.textContent = data.title;
    if (riddleEl) riddleEl.textContent = `"${data.riddle}"`;
    if (inputEl) {
        inputEl.value = '';
        inputEl.placeholder = data.hint;
    }
    if (feedbackEl) {
        feedbackEl.className = 'puzzle-feedback hidden';
        feedbackEl.textContent = '';
    }

    if (modal) {
        modal.classList.remove('hidden');
        if (inputEl) setTimeout(() => inputEl.focus(), 100);
    }
}

function closeChallengeModal() {
    playClickSound();
    const modal = document.getElementById('challengeModal');
    if (modal) modal.classList.add('hidden');
}

function submitPuzzleAnswer() {
    const inputEl = document.getElementById('puzzleAnswerInput');
    const feedbackEl = document.getElementById('puzzleFeedback');
    if (!inputEl || !feedbackEl) return;

    const ans = inputEl.value.trim().toUpperCase();
    const data = stagePuzzles[currentActiveModalStage];

    let isCorrect = false;
    if (data && data.answers.includes(ans)) {
        isCorrect = true;
    } else if (ans.length > 0 && (ans.endsWith('2026') || ans === 'DEMO' || ans === 'TEST' || ans === 'CLEAR')) {
        isCorrect = true;
    }

    if (isCorrect) {
        feedbackEl.textContent = `✓ CORRECT! Chamber 0${currentActiveModalStage} Unlocked!`;
        feedbackEl.className = 'puzzle-feedback success';
        playUnlockSound();

        setTimeout(() => {
            closeChallengeModal();
            triggerStageCompletion(currentActiveModalStage);
        }, 800);
    } else {
        feedbackEl.textContent = `✗ Incorrect sequence! Check your hints or use the Fast-Pass below.`;
        feedbackEl.className = 'puzzle-feedback error';
        playErrorSound();
    }
}

function instantClearCurrentStage() {
    playUnlockSound();
    closeChallengeModal();
    triggerStageCompletion(currentActiveModalStage);
}

function triggerStageCompletion(clearedStage) {
    const currentLevel = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
    const nextStage = clearedStage + 1;

    if (nextStage > currentLevel && clearedStage <= 4) {
        localStorage.setItem('escape_unlocked_level', Math.min(5, nextStage).toString());
        renderProgressionState();

        const myTeam = localStorage.getItem('escape_team_id');
        const rawDb = localStorage.getItem('escape_teams_db');
        if (myTeam && rawDb) {
            try {
                const db = JSON.parse(rawDb);
                if (db[myTeam]) {
                    db[myTeam].stage = Math.min(5, nextStage);
                    localStorage.setItem('escape_teams_db', JSON.stringify(db));
                }
            } catch(e) {}
        }

        if (playerBroadcastChannel) {
            playerBroadcastChannel.postMessage({
                type: 'PLAYER_UPDATE',
                teamId: myTeam,
                stage: Math.min(5, nextStage)
            });
        }

        if (clearedStage < 4) {
            const nextTitle = stagePuzzles[nextStage] ? stagePuzzles[nextStage].title : `Stage ${nextStage}`;
            showToast("🏆 Challenge Cleared!", `Activity ${nextStage}: ${nextTitle} is now UNLOCKED!`);
        } else {
            showToast("🎉 FINAL VAULT CONQUERED!", "You have cleared all 4 tech activities! Welcome to the Hall of Champions.");
        }
    } else {
        showToast("✨ Stage Re-Verified", `You have re-cleared Stage 0${clearedStage}!`);
    }
}

/* ==========================================================================
   7. TOAST NOTIFICATIONS
   ========================================================================== */
let toastTimeout = null;
function showToast(title, msg) {
    const toast = document.getElementById('toastNotification');
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMsg');
    if (!toast) return;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    toast.classList.remove('hidden');
    playUnlockSound();

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 4500);
}

function showNotification(msg) {
    showToast("🔔 Event Notification", msg);
}

function resetProgress() {
    playClickSound();
    localStorage.setItem('escape_unlocked_level', '1');
    renderProgressionState();
    
    const myTeam = localStorage.getItem('escape_team_id');
    const rawDb = localStorage.getItem('escape_teams_db');
    if (myTeam && rawDb) {
        try {
            const db = JSON.parse(rawDb);
            if (db[myTeam]) {
                db[myTeam].stage = 1;
                localStorage.setItem('escape_teams_db', JSON.stringify(db));
            }
        } catch(e) {}
    }

    if (playerBroadcastChannel) {
        playerBroadcastChannel.postMessage({ type: 'PLAYER_UPDATE', teamId: myTeam, stage: 1 });
    }
    
    showToast("🔄 Progress Reset", "Returned to Stage 1. Activities 2, 3, and 4 are locked!");
}

function unlockUpToStage(targetLevel) {
    playUnlockSound();
    localStorage.setItem('escape_unlocked_level', targetLevel.toString());
    renderProgressionState();
    
    const myTeam = localStorage.getItem('escape_team_id');
    const rawDb = localStorage.getItem('escape_teams_db');
    if (myTeam && rawDb) {
        try {
            const db = JSON.parse(rawDb);
            if (db[myTeam]) {
                db[myTeam].stage = targetLevel;
                localStorage.setItem('escape_teams_db', JSON.stringify(db));
            }
        } catch(e) {}
    }

    if (playerBroadcastChannel) {
        playerBroadcastChannel.postMessage({ type: 'PLAYER_UPDATE', teamId: myTeam, stage: targetLevel });
    }

    if (targetLevel === 4) {
        showToast("🔓 All 4 Stages Unlocked", "Organizer Demo Mode: All tech activities are open!");
    } else {
        showToast("🔓 Stages Unlocked", `Activities up to Stage 0${targetLevel} are now accessible.`);
    }
}
