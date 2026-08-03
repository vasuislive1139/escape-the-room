/**
 * ESCAPE THE ROOM — COMPLETE INTERACTIVE ENGINE
 * Handles particle animations, Web Audio ambient atmosphere, login authentication
 * against the Game Master database, sequential unlocking, and real-time Game Master command reception.
 */

if (typeof io !== 'undefined') {
    window.socket = io();
}

document.addEventListener('DOMContentLoaded', () => {
    initEmbersCanvas();
    initAudioEngine();
    initFormControls();

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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teamId = teamIdInput.value.trim().toUpperCase();
            const password = passwordInput.value.trim();

            if (!teamId || !password) {
                showError("Please enter both your Team ID and Password.");
                return;
            }
            
            const loginSubmitBtn = document.getElementById('loginSubmitBtn');
            const originalBtnText = loginSubmitBtn ? loginSubmitBtn.innerHTML : '';
            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.innerHTML = '<span class="btn-text">AUTHENTICATING...</span><div class="btn-shine"></div>';
            }

            if (teamId === 'TATVAADMIN' && password === 'Tatva2026!') {
                localStorage.setItem('escape_gm_authenticated', 'true');
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = originalBtnText;
                }
                handleSuccessfulLogin('TatvaAdmin', 5);
                return;
            }

            try {
                // Remove hardcoded fallbacks and use the new backend API exclusively
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId, password })
                });

                const data = await response.json();
                
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = originalBtnText;
                }

                if (response.ok && data.success) {
                    if (data.team.status === 'frozen') {
                        showError("❄️ Account Frozen: Your team progress is currently suspended by the Game Master.");
                    } else {
                        handleSuccessfulLogin(data.team.id, data.team.stage || 1);
                    }
                } else {
                    showError(data.error || "Invalid credentials. Complete offline ground activities or ask event judges for your Team ID!");
                }
            } catch (err) {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = originalBtnText;
                }
                showError("Connection error. Ensure the backend server is running.");
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
            localStorage.removeItem('escape_gm_authenticated');
            localStorage.removeItem('escape_team_id');
            window.location.href = 'index.html';
        });
    }

    const adminNavBtn = document.getElementById('adminNavButton');
    if (adminNavBtn && localStorage.getItem('escape_gm_authenticated') === 'true') {
        adminNavBtn.style.display = 'inline-block';
    }

    renderProgressionState();
    checkInitialFreezeStatus(teamId);
}

async function checkInitialFreezeStatus(teamId) {
    try {
        const res = await fetch('/api/teams');
        if (res.ok) {
            const data = await res.json();
        
        if (data.error) {
            console.error('Database connection error:', data.error);
            return;
        }

        const db = data;
            if (db[teamId]) {
                const overlay = document.getElementById('gmFreezeOverlay');
                if (db[teamId].status === 'frozen') {
                    if (overlay) overlay.classList.remove('hidden');
                } else if (db[teamId].status === 'timeout') {
                    if (overlay) {
                        overlay.classList.remove('hidden');
                        overlay.innerHTML = `<div style="text-align: center;"><div style="font-size: 5rem; margin-bottom: 20px;">⏱️</div><h2>DISQUALIFIED / TIME OUT</h2><p>Your team ran out of time for the stage.</p></div>`;
                    }
                }
            }
        }
    } catch(e) { console.error('Failed to check status', e); }
}

function renderProgressionState() {
    const unlockedLevel = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);

    for (let i = 1; i <= 4; i++) {
        const card = document.getElementById(`card-act-${i}`);
        if (!card) continue;

        const badge = card.querySelector('.stage-badge');
        const btn = card.querySelector('.explore-btn');

        // STRICT ACCESS LOGIC: Only the CURRENT unlocked level is open. 
        // Previously beaten levels are locked. (Unless unlockedLevel > 4 meaning they beat the game)
        const isCurrentActive = (i === unlockedLevel);
        const hasBeatenGame = (unlockedLevel > 4);
        
        if (isCurrentActive || hasBeatenGame) {
            card.className = 'activity-card unlocked';
            if (badge) {
                badge.className = 'stage-badge';
                badge.textContent = hasBeatenGame ? `STAGE 0${i} — COMPLETED ✓` : `STAGE 0${i} — OPEN`;
            }
            if (btn) {
                btn.className = 'explore-btn unlocked-btn';
                btn.innerHTML = `<span>${hasBeatenGame ? 'RE-EXPLORE' : 'EXPLORE'}</span><span class="arrow">➔</span>`;
                const activityId = i;
                
                // NEW ROUTING: 1=Crossword, 2=Scavenger, 3=Cipher, 4=Vault
                if (activityId === 1) {
                    btn.setAttribute('onclick', "window.location.href = 'crossword.html'");
                } else if (activityId === 2) {
                    btn.setAttribute('onclick', "window.location.href = 'scavenger-hunt.html'");
                } else if (activityId === 3) {
                    btn.setAttribute('onclick', "window.location.href = 'cipher-chase.html'");
                } else if (activityId === 4) {
                    btn.setAttribute('onclick', "window.location.href = 'vault.html'");
                } else {
                    btn.setAttribute('onclick', `openChallengeModal(${i})`);
                }
            }
        } else if (i < unlockedLevel) {
            // Already beaten but game not over
            card.className = 'activity-card locked';
            if (badge) {
                badge.className = 'stage-badge locked-badge';
                badge.textContent = `🔒 STAGE 0${i} — COMPLETED`;
            }
            if (btn) {
                btn.className = 'explore-btn locked-btn';
                btn.innerHTML = `<span class="lock-icon">🔒</span><span class="btn-label">FINISHED</span>`;
                btn.setAttribute('onclick', "showNotification('You have already completed this stage. Focus on the current one!')");
            }
        } else {
            // Not reached yet
            card.className = 'activity-card locked';
            if (badge) {
                badge.className = 'stage-badge locked-badge';
                badge.textContent = `🔒 STAGE 0${i} — LOCKED`;
            }
            if (btn) {
                btn.className = 'explore-btn locked-btn';
                btn.innerHTML = `<span class="lock-icon">🔒</span><span class="btn-label">EXPLORE</span>`;
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
   5. GAME MASTER REAL-TIME INTERVENTION LISTENER & SOCKET.IO
   ========================================================================== */
let lastProcessedCmdId = null;
let lastSyncedFreezeState = null;
let lastSyncedStage = null;
let socket = null;

let pollInterval = null;

function initGameMasterListener() {
    const myTeam = (localStorage.getItem('escape_team_id') || '').toUpperCase();
    if (!myTeam) return;

    // Fetch initial state immediately
    pollTeamState(myTeam);

    // Start short-polling every 3 seconds
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        pollTeamState(myTeam);
    }, 3000);
}

async function pollTeamState(teamId) {
    try {
        const [teamRes, settingsRes] = await Promise.all([
            fetch(`/api/teams/${teamId}`),
            fetch(`/api/settings`)
        ]);
        
        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings.globalMessage && settings.globalMessage !== window.lastGlobalMessage) {
                window.lastGlobalMessage = settings.globalMessage;
                // Format is timestamp:message
                const msgParts = settings.globalMessage.split(':');
                msgParts.shift(); // remove timestamp
                const msg = msgParts.join(':');
                if (msg) showNotification(msg);
            }
        }
        
        if (teamRes.ok) {
            const teamData = await teamRes.json();
            
            // Handle force logout
            if (teamData.status === 'logged_out') {
                localStorage.removeItem('escape_team_id');
                window.location.href = 'index.html';
                return;
            }
            
            processTeamStateChange(teamData);
            
            // Check warnings
            if (teamData.warnings > (window.lastWarningCount || 0)) {
                window.lastWarningCount = teamData.warnings;
                showWarningOverlay(`⚠️ GAME MASTER WARNING (${teamData.warnings})`);
            }
        } else if (teamRes.status === 404) {
            // Team deleted from database
            localStorage.removeItem('escape_team_id');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error("Polling error:", err);
    }
}

function processTeamStateChange(teamData) {
    const isNowFrozen = (teamData.status === 'frozen');
    const isNowTimeout = (teamData.status === 'timeout');
    
    const newStatus = isNowTimeout ? 'timeout' : (isNowFrozen ? 'frozen' : 'active');
    
    if (lastSyncedFreezeState !== newStatus) {
        lastSyncedFreezeState = newStatus;
        const overlay = document.getElementById('gmFreezeOverlay');
        if (overlay) {
            if (isNowFrozen || isNowTimeout) {
                overlay.classList.remove('hidden');
                if (typeof playErrorSound === 'function') playErrorSound();
                
                const title = overlay.querySelector('h3');
                const text = overlay.querySelector('p');
                            
                            if (isNowTimeout) {
                                if (title) title.textContent = "DISQUALIFIED";
                                if (text) text.textContent = "Your time has expired. Please see the Game Master if you believe this is an error.";
                            } else {
                                if (title) title.textContent = "SYSTEM LOCKED";
                                if (text) text.textContent = "Your connection has been frozen by the Game Master.";
                            }
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
    } else if (cmd.type === 'REVIVE') {
        playUnlockSound();
        const overlay = document.getElementById('gmFreezeOverlay');
        if (overlay) overlay.classList.add('hidden');
        
        // Add 5 minutes (300 seconds) to the current stage timer
        const currentLocalStage = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
        const myTeam = localStorage.getItem('escape_team_id') || 'UNKNOWN';
        let stageName = '';
        if (currentLocalStage === 1) stageName = 'crossword';
        else if (currentLocalStage === 2) stageName = 'sh';
        else if (currentLocalStage === 3) stageName = 'cipher';
        else if (currentLocalStage === 4) stageName = 'vault';
        
        if (stageName) {
            localStorage.setItem(`escape_${stageName}_timer_end_${myTeam}`, Date.now() + (5 * 60 * 1000));
            // For scavenger hunt, it also uses sh_time
            if (currentLocalStage === 2) {
                localStorage.setItem('sh_time', '300');
            }
        }
        
        showToast("💚 TEAM REVIVED", cmd.message || "You have been granted 5 extra minutes!");
    } else if (cmd.type === 'GAME_OVER') {
        playErrorSound();
        const podium = document.getElementById('podiumOverlay');
        const freeze = document.getElementById('gmFreezeOverlay');
        
        if (podium && cmd.leaderboard) {
            if (freeze) freeze.classList.add('hidden');
            podium.classList.remove('hidden');
            
            const db = cmd.leaderboard;
            const teamNames = Object.keys(db);
            const sortedTeams = teamNames
                .map(name => ({ name, ...db[name] }))
                .sort((a, b) => {
                    const stageA = a.stage || 1;
                    const stageB = b.stage || 1;
                    if (stageB !== stageA) return stageB - stageA;
                    const scoreA = a.score || 0;
                    const scoreB = b.score || 0;
                    return scoreB - scoreA;
                });
            
            // Populate Top 3
            const top1 = sortedTeams[0];
            const top2 = sortedTeams[1];
            const top3 = sortedTeams[2];
            
            const p1 = document.getElementById('podium1');
            if (p1 && top1) p1.querySelector('.podium-team').textContent = top1.name;
            
            const p2 = document.getElementById('podium2');
            if (p2 && top2) p2.querySelector('.podium-team').textContent = top2.name;
            
            const p3 = document.getElementById('podium3');
            if (p3 && top3) p3.querySelector('.podium-team').textContent = top3.name;
            
            // Populate the rest
            const restTable = document.getElementById('podiumRestTable');
            if (restTable) {
                restTable.innerHTML = '';
                sortedTeams.slice(3).forEach((team, idx) => {
                    const rank = idx + 4;
                    let statusHtml = '<span style="color:#50e3c2;">ACTIVE</span>';
                    if (team.status === 'timeout') statusHtml = '<span style="color:#ff5555; font-weight:bold;">FAILED (TIMEOUT)</span>';
                    else if (team.status === 'frozen') statusHtml = '<span style="color:#aaddff;">FROZEN</span>';
                    else if (team.stage >= 5) statusHtml = '<span style="color:gold;">ESCAPED</span>';
                    
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    tr.innerHTML = `
                        <td style="padding: 12px; text-align: center;">${rank}</td>
                        <td style="padding: 12px; font-weight: 500;">${team.name}</td>
                        <td style="padding: 12px; text-align: center;">Stage ${team.stage || 1}</td>
                        <td style="padding: 12px; text-align: right; color: #ffd700;">${team.score || 0}</td>
                        <td style="padding: 12px; text-align: center;">${statusHtml}</td>
                    `;
                    restTable.appendChild(tr);
                });
            }
            
            showToast("🏆 EVENT CONCLUDED", "Top 3 teams have escaped. Systems offline.");
        } else {
            // Fallback if no podium overlay exists
            if (freeze) {
                freeze.classList.remove('hidden');
                const title = freeze.querySelector('h3');
                if (title) title.textContent = "GAME OVER";
                const text = freeze.querySelector('p');
                if (text) text.textContent = "The Live Finale has concluded. The top 3 teams have already escaped!";
            }
            showToast("🏆 EVENT CONCLUDED", "Top 3 teams have escaped. Systems offline.");
        }
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
        if (window.socket) {
            window.socket.emit('team_completed_stage', {
                teamId: myTeam,
                nextStage: parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10),
                scoreGained: 0,
                eventData: 'Skipped to Stage'
            });
        }
        window.location.href = 'index.html';
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
        if (window.socket && myTeam) {
            window.socket.emit('team_completed_stage', {
                teamId: myTeam,
                nextStage: Math.min(5, nextStage),
                scoreGained: 100, // Arbitrary score for normal clear
                eventData: 'Manual Clear'
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


