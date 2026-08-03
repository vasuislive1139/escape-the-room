/**
 * ESCAPE THE ROOM — GAME MASTER COMMAND NEXUS ENGINE
 * Handles team credential creation, live analytics charts, real-time player roster,
 * stage chamber matrix pills, countdown timers, and instant interventions across browser tabs.
 */

let socket = null;

let roundTimerInterval = null;
let roundSecondsRemaining = 1800; // Default 30 mins

document.addEventListener('DOMContentLoaded', async () => {
    initEmbersCanvas();
    initAdminClock();
    initAdminAudio();
    initAdminAuth();
    
    // Fetch initial backend state
    try {
        const [teamsRes, settingsRes, logsRes] = await Promise.all([
            fetch('/api/teams'),
            fetch('/api/settings'),
            fetch('/api/logs')
        ]);
        const teamsData = await teamsRes.json();
        if (teamsData.error) {
            showAdminToast("⚠️ Database Error", teamsData.error);
        } else {
            window.GLOBAL_TEAMS_DB = teamsData;
            window.GLOBAL_SETTINGS = await settingsRes.json();
            window.GLOBAL_LOGS = await logsRes.json();
        }
    } catch(e) { console.error('Failed to fetch initial state:', e); }

    // Polling for real-time updates
    setInterval(async () => {
        try {
            const [teamsRes, settingsRes, logsRes] = await Promise.all([
                fetch('/api/teams'),
                fetch('/api/settings'),
                fetch('/api/logs')
            ]);
            const teamsData = await teamsRes.json();
            const settingsData = await settingsRes.json();
            const logsData = await logsRes.json();

            if (teamsData.error) {
                if (!window.dbErrorShown) {
                    showAdminToast("⚠️ Database Error", teamsData.error);
                    window.dbErrorShown = true;
                }
                return;
            }

            window.GLOBAL_TEAMS_DB = teamsData;
            window.GLOBAL_SETTINGS = settingsData;
            window.GLOBAL_LOGS = logsData;
            
            if (typeof renderAnalyticsAndRoster === 'function') renderAnalyticsAndRoster();
            if (typeof renderLiveActivityFeed === 'function') renderLiveActivityFeed();
        } catch(e) {}
    }, 3000);

    initCommandCenter();
});

/* ==========================================================================
   1. EMBERS & PARTICLE BACKGROUND
   ========================================================================== */
function initEmbersCanvas() {
    const canvas = document.getElementById('embersCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() { this.reset(); this.y = Math.random() * height; }
        reset() {
            this.x = Math.random() * width;
            this.y = height + 10;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * 0.7 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.color = Math.random() > 0.5 ? 'rgba(80, 227, 194, ' : 'rgba(255, 232, 179, ';
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            if (this.y < -10 || this.x < -10 || this.x > width + 10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.fill();
        }
    }
    for (let i = 0; i < 40; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

/* ==========================================================================
   2. SYSTEM CLOCK & ROUND COUNTDOWN TIMER & STANDALONE AUDIO
   ========================================================================== */
function initAdminClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;
    setInterval(() => {
        clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
}

function initAdminAudio() {
    const audioBtn = document.getElementById('audioToggleBtn');
    if (!audioBtn) return;
    let audioCtx = null;
    let isMuted = true;
    audioBtn.addEventListener('click', () => {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            isMuted = false;
        } else {
            isMuted = !isMuted;
            if (isMuted) audioCtx.suspend();
            else audioCtx.resume();
        }
        audioBtn.style.borderColor = isMuted ? '#8c6f36' : '#e6c887';
        audioBtn.style.color = isMuted ? '#c5a059' : '#e6c887';
    });
}

function startRoundTimer(minutes) {
    if (roundTimerInterval) clearInterval(roundTimerInterval);
    roundSecondsRemaining = minutes * 60;
    updateTimerDisplay();

    roundTimerInterval = setInterval(() => {
        if (roundSecondsRemaining > 0) {
            roundSecondsRemaining--;
            updateTimerDisplay();
            if (roundSecondsRemaining === 60) {
                transmitGmCommand('ALL', 'WARNING', "🚨 1 MINUTE REMAINING IN THE ESCAPE ROOM ROUND! Finalize your cipher codes now!");
            }
        } else {
            clearInterval(roundTimerInterval);
            roundTimerInterval = null;
            transmitGmCommand('ALL', 'WARNING', "⏹️ TIME IS UP! The vault doors are locking down. Event judges are calculating final scores.");
            alert("⏰ Event Round Timer has ended!");
        }
    }, 1000);
    showAdminToast("⏱️ Timer Started", `${minutes} minute round clock initiated.`);
}

function stopRoundTimer() {
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
        showAdminToast("⏹️ Timer Paused", "Round clock paused by Game Master.");
    } else {
        roundSecondsRemaining = 1800;
        updateTimerDisplay();
        showAdminToast("🔄 Timer Reset", "Clock reset to 30:00.");
    }
}

function updateTimerDisplay() {
    const el = document.getElementById('roundTimerDisplay');
    if (!el) return;
    const m = Math.floor(roundSecondsRemaining / 60);
    const s = roundSecondsRemaining % 60;
    el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* ==========================================================================
   3. GAME MASTER AUTHENTICATION (ADMIN LOGIN MODAL)
   ========================================================================== */
function initAdminAuth() {
    const modal = document.getElementById('adminLoginModal');
    const dashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const loginBtn = document.getElementById('adminLoginBtn');
    const uInput = document.getElementById('adminUsername');
    const pInput = document.getElementById('adminPassword');

    if (localStorage.getItem('escape_gm_authenticated') === 'true') {
        if (modal) {
            modal.classList.add('hidden');
            modal.style.setProperty('display', 'none', 'important');
        }
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.setProperty('display', 'flex', 'important');
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', unlockGameMasterNexus);
    }

    [uInput, pInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                unlockGameMasterNexus();
            }
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('escape_gm_authenticated');
            window.location.reload();
        });
    }
}

function unlockGameMasterNexus(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
        localStorage.setItem('escape_gm_authenticated', 'true');
    } catch(err) {}

    const modal = document.getElementById('adminLoginModal');
    const dashboard = document.getElementById('adminDashboard');

    if (modal) {
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
    }
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.style.setProperty('display', 'flex', 'important');
    }

    if (typeof showAdminToast === 'function') {
        showAdminToast("⚡ NEXUS UNLOCKED", "Welcome to Game Master Command Center.");
    }
    return false;
}
window.unlockGameMasterNexus = unlockGameMasterNexus;
window.handleAdminLoginSubmit = unlockGameMasterNexus;

/* ==========================================================================
   4. CREDENTIAL GENERATOR & TEAM DATABASE MANAGEMENT
   ========================================================================== */
window.GLOBAL_TEAMS_DB = {};
window.GLOBAL_SETTINGS = {};
window.GLOBAL_LOGS = [];

function getTeamsDb() {
    return window.GLOBAL_TEAMS_DB;
}

function saveTeamsDb(db) {
    window.GLOBAL_TEAMS_DB = db;
    fetch('/api/teams/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
    }).catch(e => console.error(e));
    if (typeof renderAnalyticsAndRoster === 'function') renderAnalyticsAndRoster();
}

function getSlotsDb() {
    try { return JSON.parse(localStorage.getItem('escape_slots_db')) || []; } catch(e) { return []; }
}
function saveSlotsDb(db) {
    localStorage.setItem('escape_slots_db', JSON.stringify(db));
}

function getVolunteersDb() {
    try { return JSON.parse(localStorage.getItem('escape_volunteers_db')) || []; } catch(e) { return []; }
}
function saveVolunteersDb(db) {
    localStorage.setItem('escape_volunteers_db', JSON.stringify(db));
}

function getSettingsDb() {
    return window.GLOBAL_SETTINGS;
}
function saveSettingsDb(db) {
    window.GLOBAL_SETTINGS = db;
    fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
    }).catch(e => console.error(e));
}

function getLogsDb() {
    return window.GLOBAL_LOGS;
}
function saveLogsDb(db) {
    // Just for local mocking if needed, but we rely on addDetailedLog
}

function addDetailedLog(action, category = 'system', teamId = null, room = null) {
    fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, category, teamId, details: room ? `Room: ${room}` : '' })
    }).catch(e => console.error(e));
}

// Ensure the render is exported/called correctly where saveTeamsDb used to call it.
// I will wrap saveTeamsDb to still call it if it exists.
function saveTeamsDbAndRender(db) {
    saveTeamsDb(db);
    if (typeof renderAnalyticsAndRoster === 'function') renderAnalyticsAndRoster();
}

// --- SIDEBAR ARCHITECTURE ---
function switchAdminView(viewId) {
    // Hide all views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById('view-' + viewId);
    if (selectedView) {
        selectedView.classList.add('active');
    } else {
        // Fallback to placeholder if view doesn't exist yet
        const placeholder = document.getElementById('view-placeholder');
        if (placeholder) placeholder.classList.add('active');
    }
    
    // Highlight active nav button
    const activeBtn = document.querySelector(`.nav-btn[onclick="switchAdminView('${viewId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// --- TEAM MANAGEMENT MODAL ---
function openAddTeamModal() {
    const modal = document.getElementById('addTeamModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('modalTeamPassword').value = Math.random().toString(36).slice(-6).toUpperCase();
    }
}

function handleAddNewTeam(e) {
    e.preventDefault();
    const nameInput = document.getElementById('modalTeamName').value.trim().toUpperCase();
    const membersInput = document.getElementById('modalTeamMembers').value.trim();
    const passInput = document.getElementById('modalTeamPassword').value.trim();
    const stageInput = parseInt(document.getElementById('modalTeamStage').value);
    
    if (!nameInput || !passInput) return;
    
    const db = getTeamsDb();
    if (db[nameInput]) {
        showAdminToast("⚠️ Error", "A team with this ID already exists!");
        return;
    }
    
    db[nameInput] = {
        password: passInput,
        stage: stageInput,
        status: 'active', // can be registered, active, frozen
        warnings: 0,
        members: membersInput,
        slotId: null,
        score: 0,
        entryTime: Date.now()
    };
    
    saveTeamsDbAndRender(db);
    addDetailedLog(`Team registered: ${nameInput}`, 'team', nameInput, `Room ${stageInput}`);
    
    // Close modal and reset form
    document.getElementById('addTeamModal').classList.add('hidden');
    document.getElementById('newTeamForm').reset();
    showAdminToast("✅ Success", `Team ${nameInput} created successfully.`);
}

function openEditTeamModal(teamId) {
    const db = getTeamsDb();
    const t = db[teamId];
    if (!t) return;
    
    let modal = document.getElementById('editTeamModal');
    if (!modal) {
        // We will create the modal if it doesn't exist, or it should be added in admin.html.
        // For now, assuming we add it in admin.html, we just populate it.
    }
    
    if (modal) {
        document.getElementById('editTeamIdOriginal').value = teamId;
        document.getElementById('editTeamName').value = teamId;
        document.getElementById('editTeamPassword').value = t.password || '';
        document.getElementById('editTeamMembers').value = t.members || '';
        document.getElementById('editTeamStage').value = t.stage || 1;
        modal.classList.remove('hidden');
    }
}

function handleEditTeam(e) {
    e.preventDefault();
    const originalId = document.getElementById('editTeamIdOriginal').value;
    const newId = document.getElementById('editTeamName').value.trim().toUpperCase();
    const membersInput = document.getElementById('editTeamMembers').value.trim();
    const passInput = document.getElementById('editTeamPassword').value.trim();
    const stageInput = parseInt(document.getElementById('editTeamStage').value);
    
    if (!newId || !passInput) return;
    
    const db = getTeamsDb();
    const t = db[originalId];
    if (!t) return;
    
    if (newId !== originalId && db[newId]) {
        showAdminToast("⚠️ Error", "A team with this ID already exists!");
        return;
    }
    
    // Create new object with updated values
    const updatedTeam = { ...t, password: passInput, members: membersInput, stage: stageInput };
    
    if (newId !== originalId) {
        delete db[originalId];
    }
    db[newId] = updatedTeam;
    
    saveTeamsDbAndRender(db);
    addDetailedLog(`Team updated: ${newId}`, 'team', newId, `Stage ${stageInput}`);
    
    document.getElementById('editTeamModal').classList.add('hidden');
    showAdminToast("✅ Success", `Team ${newId} updated.`);
}

function openBulkCreateModal() {
    document.getElementById('bulkCreateModal').classList.remove('hidden');
}

function handleBulkCreateTeams(e) {
    e.preventDefault();
    const count = parseInt(document.getElementById('bulkCreateCount').value);
    const prefix = document.getElementById('bulkCreatePrefix').value.trim();
    const stageInput = parseInt(document.getElementById('bulkCreateStage').value);
    
    if (isNaN(count) || count < 1 || !prefix) return;
    
    const db = getTeamsDb();
    let created = 0;
    
    const words = ['CYBER', 'VAULT', 'TATVA', 'ENIGMA', 'SOLVE', 'HACK', 'QUEST', 'GOLD', 'NEXUS', 'ALPHA', 'DELTA', 'CODE'];
    
    // Find the next available number index for the prefix
    let maxIdx = 0;
    const existingKeys = Object.keys(db);
    existingKeys.forEach(k => {
        if (k.startsWith(prefix)) {
            const numPart = k.substring(prefix.length);
            const num = parseInt(numPart);
            if (!isNaN(num) && num > maxIdx) {
                maxIdx = num;
            }
        }
    });
    
    for (let i = 1; i <= count; i++) {
        const teamNum = (maxIdx + i).toString().padStart(2, '0');
        const teamName = `${prefix}${teamNum}`.toUpperCase();
        
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const password = `${randomWord}${randomNum}`;
        
        if (!db[teamName]) {
            db[teamName] = {
                password: password,
                stage: stageInput,
                status: 'active',
                warnings: 0,
                members: '',
                score: 0,
                entryTime: Date.now()
            };
            created++;
        }
    }
    
    saveTeamsDbAndRender(db);
    addDetailedLog(`Bulk generated ${created} credentials with prefix ${prefix}`, 'system', 'Admin', `Stage ${stageInput}`);
    
    document.getElementById('bulkCreateModal').classList.add('hidden');
    showAdminToast("✅ Success", `Bulk generated ${created} teams.`);
}

function openCreateSlotModal() {
    document.getElementById('slotStartTime').value = '';
    document.getElementById('slotEndTime').value = '';
    document.getElementById('slotCapacity').value = '4';
    document.getElementById('addSlotModal').classList.remove('hidden');
}

function handleCreateSlot(e) {
    e.preventDefault();
    const start = document.getElementById('slotStartTime').value;
    const end = document.getElementById('slotEndTime').value;
    const capacity = parseInt(document.getElementById('slotCapacity').value) || 4;
    
    if (!start || !end) return;
    
    const settings = getSettingsDb();
    const slotId = 'slot_' + Date.now();
    
    settings.slots = settings.slots || {};
    settings.slots[slotId] = {
        id: slotId,
        start,
        end,
        capacity,
        teams: []
    };
    
    saveSettingsDb(settings);
    addDetailedLog(`Created new time slot: ${start} - ${end}`, 'system', 'Admin', 'Dashboard');
    
    document.getElementById('addSlotModal').classList.add('hidden');
    document.getElementById('addSlotForm').reset();
    showAdminToast("✅ Slot Created", `Slot ${start}-${end} added.`);
    renderSlots();
}

function renderSlots() {
    const tbody = document.getElementById('slotsTableBody');
    if (!tbody) return;
    
    const settings = getSettingsDb();
    const slots = settings.slots || {};
    const slotKeys = Object.keys(slots).sort((a, b) => slots[a].start.localeCompare(slots[b].start));
    
    if (slotKeys.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No slots configured.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    slotKeys.forEach(key => {
        const slot = slots[key];
        const tr = document.createElement('tr');
        
        const teamsStr = slot.teams && slot.teams.length > 0 ? slot.teams.join(', ') : 'None';
        const isFull = slot.teams && slot.teams.length >= slot.capacity;
        const statusBadge = isFull ? '<span class="badge" style="background:#ff4f55;">FULL</span>' : '<span class="badge" style="background:#50e3c2; color:#000;">OPEN</span>';
        
        tr.innerHTML = `
            <td><strong>${slot.start} - ${slot.end}</strong></td>
            <td>${(slot.teams && slot.teams.length) || 0} / ${slot.capacity}</td>
            <td style="color:#a5b0bb;">${teamsStr}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="action-btn" onclick="deleteSlot('${key}')" title="Delete Slot">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteSlot(slotId) {
    if(!confirm("Are you sure you want to delete this slot?")) return;
    const settings = getSettingsDb();
    if(settings.slots && settings.slots[slotId]) {
        delete settings.slots[slotId];
        saveSettingsDb(settings);
        showAdminToast("🗑️ Slot Deleted", "Time slot removed.");
        renderSlots();
    }
}

function broadcastToRoom(roomNumber, action) {
    const db = getTeamsDb();
    const teamsInRoom = Object.keys(db).filter(t => (db[t].stage || 1) === roomNumber);
    
    if (teamsInRoom.length === 0) {
        showAdminToast("⚠️ Empty Room", `No teams currently in Room ${roomNumber}.`);
        return;
    }
    
    let message = "";
    if (action === 'PAUSE') message = "⏸️ Global Room Pause Triggered.";
    else if (action === 'HINT') message = "💡 A hint has been broadcasted to your room.";
    
    teamsInRoom.forEach(teamId => {
        transmitGmCommand(teamId, action, message, 'info');
    });
    
    showAdminToast("📢 Room Broadcast", `${action} sent to ${teamsInRoom.length} teams in Room ${roomNumber}.`);
    addDetailedLog(`Broadcasted ${action} to Room ${roomNumber}`, 'system', 'Admin', `Room ${roomNumber}`);
}
function initAdminListeners() {
    if (typeof socket !== 'undefined' && socket) {
        socket.on('player_update', (data) => {
            const { teamId, stage } = data;
            const db = getTeamsDb();
            if (db[teamId] && db[teamId].stage !== stage) {
                db[teamId].stage = stage;
                saveTeamsDbAndRender(db);
                addDetailedLog(`Team ${teamId} reached Room ${stage}`, 'system', teamId, `Room ${stage}`);

                // Live Finale Logic: 3-Winner Limit
                if (stage >= 5) {
                    const settings = getSettingsDb();
                    if (settings.gameMode === 'finale') {
                        let winnersCount = 0;
                        for (let key in db) {
                            if (db[key].stage >= 5) winnersCount++;
                        }
                        if (winnersCount >= 3) {
                            socket.emit('gm_command', { type: 'GAME_OVER', leaderboard: db });
                            showAdminToast("🏆 TOP 3 REACHED", "Live Finale has concluded. All other teams locked out.");
                            addDetailedLog(`Finale Concluded: Top 3 Teams have finished.`, 'system', 'Admin', 'Global');
                        }
                    }
                }
            }
        });
        
        socket.on('player_timeout', (data) => {
            const { teamId } = data;
            const db = getTeamsDb();
            if (db[teamId] && db[teamId].status !== 'timeout') {
                db[teamId].status = 'timeout';
                saveTeamsDbAndRender(db);
                addDetailedLog(`Team ${teamId} ran out of time!`, 'error', teamId, `Global`);
                showAdminToast("⏱️ TEAM TIMEOUT", `Team ${teamId} has been disqualified (Time Expired).`);
            }
        });
    }
    
    const slotForm = document.getElementById('addSlotForm');
    if (slotForm) {
        slotForm.addEventListener('submit', handleCreateSlot);
    }
}

const STAGE3_WORDS = [
    'CYBER', 'ENIGMA', 'MATRIX', 'KERNEL', 
    'BINARY', 'SECURE', 'NEXUS', 'BUFFER', 
    'SOCKET', 'ROUTER', 'SERVER', 'VAULT', 
    'SYSTEM', 'PORTAL', 'HEXAGON', 'DECODE', 
    'PYTHON', 'PIXELS', 'LOGGER', 'SENSORS', 
    'SCRIPTS', 'COMPASS', 'OVERLAY', 'LANTERN'
];

function getStage3CiphersForTeam(teamName) {
    const cleanName = (teamName || 'TEAM-ALPHA').trim().toUpperCase();
    let teamIndex = 0;
    const match = cleanName.match(/TEAM-0*(\d+)/);
    if (match) {
        const num = parseInt(match[1], 10);
        teamIndex = (num - 1) % 24;
    } else {
        let hash = 0;
        for (let i = 0; i < cleanName.length; i++) {
            hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
        }
        teamIndex = Math.abs(hash) % 24;
    }
    
    const w1Index = (teamIndex * 3 + 0) % STAGE3_WORDS.length;
    const w2Index = (teamIndex * 3 + 1) % STAGE3_WORDS.length;
    const w3Index = (teamIndex * 3 + 2) % STAGE3_WORDS.length;
    
    const word1 = STAGE3_WORDS[w1Index]; // Correct Solution Word
    
    // Find a decoy word of the exact same length
    const sameLengthWords = STAGE3_WORDS.filter(w => w.length === word1.length && w !== word1);
    let word1Decoy = STAGE3_WORDS[w2Index];
    if (sameLengthWords.length > 0) {
        word1Decoy = sameLengthWords[teamIndex % sameLengthWords.length];
    }
    
    const word2 = STAGE3_WORDS[w2Index]; // Atbash Word
    const word3 = STAGE3_WORDS[w3Index]; // ROT13 Word
    
    const caesarShift = ((teamIndex * 7 + 3) % 15) + 3;
    const caesarDecoyShift = ((teamIndex * 11 + 7) % 8) + 18;
    
    let caesarCiphertext = "";
    for (let i = 0; i < word1.length; i++) {
        let code = word1.charCodeAt(i) - 65;
        caesarCiphertext += String.fromCharCode(((code + caesarShift) % 26) + 65);
    }
    
    let atbashCiphertext = "";
    for (let i = 0; i < word2.length; i++) {
        let code = word2.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            atbashCiphertext += String.fromCharCode(90 - (code - 65));
        } else {
            atbashCiphertext += word2.charAt(i);
        }
    }
    
    let rot13Ciphertext = "";
    for (let i = 0; i < word3.length; i++) {
        let code = word3.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            rot13Ciphertext += String.fromCharCode(((code - 65 + 13) % 26) + 65);
        } else {
            rot13Ciphertext += word3.charAt(i);
        }
    }
    
    return {
        c1: { plaintext: word1, ciphertext: caesarCiphertext, shift: caesarShift, decoytext: word1Decoy, decoyshift: caesarDecoyShift },
        c2: { plaintext: word2, ciphertext: atbashCiphertext },
        c3: { plaintext: word3, ciphertext: rot13Ciphertext }
    };
}
window.getStage3CiphersForTeam = getStage3CiphersForTeam;



function downloadCredentialsCSV() {
    const db = getTeamsDb();
    const keys = Object.keys(db);
    if (keys.length === 0) {
        alert("Database is empty! Create or generate teams first.");
        return;
    }
    
    let csvContent = "TEAM NAME,PASSWORD,S3 CAESAR CIPHER,S3 CAESAR CORRECT ANSWER,S3 CAESAR DECOY ANSWER,S3 ATBASH CIPHER,S3 ATBASH ANSWER,S3 ROT13 CIPHER,S3 ROT13 ANSWER,INITIAL STAGE,STATUS\r\n";
    keys.forEach(name => {
        const t = db[name];
        const ciphers = getStage3CiphersForTeam(name);
        csvContent += `${name},${t.password},${ciphers.c1.ciphertext},${ciphers.c1.plaintext},${ciphers.c1.decoytext},${ciphers.c2.ciphertext},${ciphers.c2.plaintext},${ciphers.c3.ciphertext},${ciphers.c3.plaintext},Stage ${t.stage},${t.status}\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "escape_room_credentials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAdminToast("📥 CSV Downloaded", "Credentials checklist with Stage 3 answers generated.");
}
window.downloadCredentialsCSV = downloadCredentialsCSV;

function clearAllTeams() {
    if (confirm("Are you sure you want to delete all registered team credentials from the database?")) {
        saveTeamsDb({});
        showAdminToast("🗑️ Database Cleared", "All team records removed.");
        addLogItem("Cleared all team records from database.", 'alert');
    }
}

/* ==========================================================================
   5. LIVE ANALYTICS, MATRIX PILLS & ROSTER TABLE
   ========================================================================== */
function renderAnalyticsAndRoster() {
    // Keep this function name for backwards compatibility, but have it call the new functions
    updateDashboardMetrics();
    renderFullTeamsList();
    renderLeaderboard();
    if(typeof renderSlots === 'function') renderSlots();
    
    // Also re-render the old targets in case they still exist (for Announcements etc)
    const db = getTeamsDb();
    const teamNames = Object.keys(db);
    populateTargetSelector(teamNames);
}

function updateDashboardMetrics() {
    const db = getTeamsDb();
    const teamNames = Object.keys(db);
    
    let totalCount = teamNames.length;
    let presentCount = 0;
    let playingCount = 0;
    let completedCount = 0;
    let stage1Count = 0;
    let stage2Count = 0;
    let stage3Count = 0;
    let stage4Count = 0;
    
    teamNames.forEach(name => {
        const t = db[name];
        if (t.status === 'active' || t.status === 'frozen' || t.status === 'timeout') {
            presentCount++;
            const stage = t.stage || 1;
            if (stage === 1) stage1Count++;
            if (stage === 2) stage2Count++;
            if (stage === 3) stage3Count++;
            if (stage >= 4) stage4Count++;
            
            if (stage < 4) playingCount++;
            else completedCount++;
        }
    });
    
    // Update Dashboard View Cards
    const elDashTotal = document.getElementById('dashTotalTeams');
    const elDashPresent = document.getElementById('dashPresentTeams');
    const elDashPlaying = document.getElementById('dashPlayingTeams');
    const elDashCompleted = document.getElementById('dashCompletedTeams');
    
    if (elDashTotal) elDashTotal.textContent = totalCount;
    if (elDashPresent) elDashPresent.textContent = presentCount;
    if (elDashPlaying) elDashPlaying.textContent = playingCount;
    if (elDashCompleted) elDashCompleted.textContent = completedCount;
    
    // Update Header Global Stats
    const elTotalHeader = document.getElementById('totalTeamsCount');
    const elActiveHeader = document.getElementById('activePlayersCount');
    const elS1 = document.getElementById('stage1Count');
    const elS2 = document.getElementById('stage2Count');
    const elS3 = document.getElementById('stage3Count');
    const elS4 = document.getElementById('stage4Count');
    
    if (elTotalHeader) elTotalHeader.textContent = totalCount;
    // Assuming each team has an average of 4 players for the active player estimation
    if (elActiveHeader) elActiveHeader.textContent = presentCount * (getSettingsDb().teamSizeLimit || 4);
    if (elS1) elS1.textContent = stage1Count;
    if (elS2) elS2.textContent = stage2Count;
    if (elS3) elS3.textContent = stage3Count;
    if (elS4) elS4.textContent = stage4Count;
    
    renderLiveActivityFeed();
}

function renderLiveActivityFeed() {
    const logs = getLogsDb();
    const feed = document.getElementById('liveActivityFeed');
    if (!feed) return;
    
    feed.innerHTML = '';
    if (logs.length === 0) {
        feed.innerHTML = '<div class="log-item system">System initialized. Awaiting activity...</div>';
        return;
    }
    
    // Display top 15 logs
    logs.slice(0, 15).forEach(log => {
        const d = new Date(log.timestamp);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const div = document.createElement('div');
        div.className = `log-item ${log.category}`;
        div.innerHTML = `<span class="time" style="color: #68fedb; font-size: 0.8rem; margin-right: 8px;">[${timeStr}]</span> ${log.action}`;
        feed.appendChild(div);
    });
}

function toggleAllTeams() {
    const isChecked = document.getElementById('selectAllTeams').checked;
    const checkboxes = document.querySelectorAll('.team-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
}

function renderFullTeamsList() {
    const db = getTeamsDb();
    const teamNames = Object.keys(db);
    const tbody = document.getElementById('fullTeamsListBody');
    if (!tbody) return;

    if (teamNames.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No teams registered yet. Use form to create credentials!</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    teamNames.forEach(name => {
        const t = db[name];
        const stageNum = t.stage || 1;
        let statusStr = '';
        if (t.status === 'timeout') {
            statusStr = '<span class="status-badge" style="background:rgba(255,85,85,0.2);color:#ff5555;">⏱️ TIMEOUT</span>';
        } else if (t.status === 'frozen') {
            statusStr = '<span class="status-badge frozen">❄️ FROZEN</span>';
        } else {
            statusStr = '<span class="status-badge active">🟢 ACTIVE</span>';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;"><input type="checkbox" class="team-checkbox" value="${name}"></td>
            <td><strong style="color:#ffffff;">${name}</strong><br><small class="mono" style="color:#888;">${t.password}</small></td>
            <td>${t.members || 'Not assigned'}</td>
            <td>${t.slotId || 'None'}</td>
            <td>Stage ${stageNum}</td>
            <td class="text-gold">${t.score || 0}</td>
            <td>${statusStr}</td>
            <td style="text-align:right;">
                ${t.status === 'timeout' ? `<button type="button" class="row-btn" style="border-color:#50e3c2; color:#50e3c2;" onclick="quickAction('${name}', 'revive')" title="Revive Team">💚</button>` : ''}
                <button type="button" class="row-btn" onclick="openEditTeamModal('${name}')" title="Edit Team">✏️</button>
                <button type="button" class="row-btn" onclick="quickAction('${name}', 'promote')" title="Promote Stage">🔼</button>
                <button type="button" class="row-btn" onclick="quickAction('${name}', 'demote')" title="Demote Stage">🔽</button>
                <button type="button" class="row-btn" onclick="quickAction('${name}', 'freeze')" title="Toggle Freeze">❄️</button>
                <button type="button" class="row-btn danger" onclick="quickAction('${name}', 'delete')" title="Delete Credential">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLeaderboard() {
    const db = getTeamsDb();
    const teamNames = Object.keys(db);
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    if (teamNames.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No active teams.</td></tr>`;
        return;
    }

    // Sort by stage (descending), then score (descending)
    const sortedTeams = teamNames
        .map(name => ({ name, ...db[name] }))
        .sort((a, b) => {
            if ((b.stage || 1) !== (a.stage || 1)) return (b.stage || 1) - (a.stage || 1);
            return (b.score || 0) - (a.score || 0);
        });

    tbody.innerHTML = '';
    sortedTeams.forEach((team, index) => {
        const rank = index + 1;
        let rankHtml = `<strong>#${rank}</strong>`;
        if (rank === 1) rankHtml = `<span style="color: gold; font-size: 1.2rem;">🥇 1st</span>`;
        if (rank === 2) rankHtml = `<span style="color: silver; font-size: 1.2rem;">🥈 2nd</span>`;
        if (rank === 3) rankHtml = `<span style="color: #cd7f32; font-size: 1.2rem;">🥉 3rd</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rankHtml}</td>
            <td><strong style="color:#ffffff;">${team.name}</strong></td>
            <td>Stage ${team.stage || 1}</td>
            <td class="text-gold">${team.score || 0}</td>
            <td style="text-align: right; white-space: nowrap;">
                ${team.status === 'timeout' ? `<button type="button" class="row-btn" style="border-color:#50e3c2; color:#50e3c2; padding: 2px 6px;" onclick="quickAction('${team.name}', 'revive')" title="Revive">💚</button>` : ''}
                <button type="button" class="row-btn" style="padding: 2px 6px;" onclick="quickAction('${team.name}', 'warn')" title="Issue Warning">⚠️</button>
                <button type="button" class="row-btn" style="padding: 2px 6px;" onclick="quickAction('${team.name}', 'freeze')" title="Toggle Freeze">❄️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateTargetSelector(teamNames) {
    const select = document.getElementById('targetTeamSelect');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = `<option value="ALL">🌐 BROADCAST TO ALL ACTIVE TEAMS</option>`;
    teamNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `🎯 Team: ${name}`;
        select.appendChild(opt);
    });
    if (teamNames.includes(currentVal)) select.value = currentVal;
}

/* ==========================================================================
   6. REAL-TIME GAME MASTER INTERVENTIONS & BROADCAST TRANSMISSIONS
   ========================================================================== */
function transmitGmCommand(targetTeam, commandType, messageContent, extraType = 'info', targetStage = null) {
    if (targetTeam === 'ALL') {
        const payload = Date.now() + ":" + messageContent;
        fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ globalMessage: payload })
        });
    }
}

function initCommandCenter() {
    initAdminListeners();
    renderAnalyticsAndRoster();
    
    const settings = getSettingsDb();
    if (settings.gameMode) {
        setGameMode(settings.gameMode);
    }
}

function sendLiveBroadcast() {
    const targetEl = document.getElementById('targetTeamSelect');
    const msgEl = document.getElementById('liveBroadcastMsg');
    const typeEl = document.querySelector('input[name="msgType"]:checked');

    const target = targetEl ? targetEl.value : 'ALL';
    const msg = msgEl ? msgEl.value.trim() : '';
    const type = typeEl ? typeEl.value : 'info';

    if (!msg) {
        alert("Please type a message to broadcast!");
        return;
    }

    transmitGmCommand(target, 'BROADCAST', msg, type);
    showAdminToast("📡 Broadcast Sent", `Message transmitted to ${target}.`);
    addLogItem(`[BROADCAST to ${target}]: "${msg}" (${type})`, 'alert');
    if (msgEl) msgEl.value = '';
}

function issueWarningToTarget() {
    const target = document.getElementById('targetTeamSelect').value;
    const msg = prompt(`Enter rule violation warning message for ${target}:`, "⚠️ RULE VIOLATION DETECTED: Do not share challenge answers with other teams!");
    if (msg) {
        transmitGmCommand(target, 'WARNING', msg);
        showAdminToast("⚠️ Warning Sent", `Warning transmitted to ${target}.`);
        addLogItem(`[WARNING to ${target}]: "${msg}"`, 'warn');
        
        if (target !== 'ALL') {
            const db = getTeamsDb();
            if (db[target]) {
                db[target].warnings = (db[target].warnings || 0) + 1;
                saveTeamsDb(db);
            }
        }
    }
}

function toggleFreezeTarget(freezeState, overrideTarget = null) {
    const target = overrideTarget || document.getElementById('targetTeamSelect').value;
    const db = getTeamsDb();

    if (target === 'ALL') {
        Object.keys(db).forEach(name => {
            db[name].status = freezeState ? 'frozen' : 'active';
        });
        saveTeamsDb(db);
        transmitGmCommand('ALL', freezeState ? 'FREEZE' : 'UNFREEZE', freezeState ? "❄️ ALL TEAMS FROZEN BY GAME MASTER." : "🔥 ALL TEAMS UNFROZEN. RESUME GAMEPLAY.");
        showAdminToast(freezeState ? "❄️ ALL TEAMS FROZEN" : "🔥 ALL TEAMS UNFROZEN", "Global lockdown state updated.");
        addLogItem(freezeState ? "Global lockdown initiated for ALL teams." : "Global lockdown lifted for ALL teams.", 'freeze');
    } else {
        if (!db[target]) return;
        db[target].status = freezeState ? 'frozen' : 'active';
        saveTeamsDb(db);
        transmitGmCommand(target, freezeState ? 'FREEZE' : 'UNFREEZE', freezeState ? "❄️ Your team account progress has been frozen by event judges." : "🔥 Gameplay restored by Game Master.");
        showAdminToast(freezeState ? `❄️ Team ${target} Frozen` : `🔥 Team ${target} Unfrozen`, `Status updated in database.`);
        addLogItem(`Set freeze status of [${target}] to ${freezeState ? 'FROZEN' : 'ACTIVE'}`, 'freeze');
    }
}

function promoteTargetStage() {
    const target = document.getElementById('targetTeamSelect').value;
    if (target === 'ALL') {
        const db = getTeamsDb();
        Object.keys(db).forEach(name => {
            if (db[name].stage < 4) db[name].stage++;
        });
        saveTeamsDb(db);
        transmitGmCommand('ALL', 'PROMOTE', "⏩ GAME MASTER BONUS: All teams promoted +1 Stage!");
        showAdminToast("⏩ Global Promotion", "All teams advanced +1 Stage.");
        addLogItem("Promoted ALL teams by +1 Stage.", 'system');
    } else {
        quickAction(target, 'promote');
    }
}

function demoteTargetStage() {
    const target = document.getElementById('targetTeamSelect').value;
    if (target === 'ALL') {
        const db = getTeamsDb();
        Object.keys(db).forEach(name => {
            if (db[name].stage > 1) db[name].stage--;
        });
        saveTeamsDb(db);
        transmitGmCommand('ALL', 'DEMOTE', "⏪ GAME MASTER PENALTY: All teams demoted -1 Stage!");
        showAdminToast("⏪ Global Demotion", "All teams moved back -1 Stage.");
        addLogItem("Demoted ALL teams by -1 Stage.", 'warn');
    } else {
        quickAction(target, 'demote');
    }
}

function grantVipTargetStage() {
    const target = document.getElementById('targetTeamSelect').value;
    if (target === 'ALL') {
        const db = getTeamsDb();
        Object.keys(db).forEach(name => { db[name].stage = 4; });
        saveTeamsDb(db);
        transmitGmCommand('ALL', 'PROMOTE', "★ GAME MASTER VIP GRANT: All 4 chambers unlocked for all teams!");
        showAdminToast("★ Global VIP Grant", "All 4 stages unlocked for all teams.");
        addLogItem("Granted Stage 4 VIP All-Access to ALL teams.", 'system');
    } else {
        quickAction(target, 'vip');
    }
}

function quickAction(teamName, actionType) {
    const db = getTeamsDb();
    if (!db[teamName]) return;

    let endpoint = `/api/teams/${teamName}/action`;
    let actionMap = {
        'freeze': 'FREEZE',
        'warn': 'WARN',
        'revive': 'REVIVE',
        'delete': 'LOGOUT'
    };
    
    // For promote/demote/vip we use standard update
    if (['promote', 'demote', 'vip'].includes(actionType)) {
        let newStage = db[teamName].stage || 1;
        if (actionType === 'promote' && newStage < 4) newStage++;
        if (actionType === 'demote' && newStage > 1) newStage--;
        if (actionType === 'vip') newStage = 4;
        
        fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: teamName, stage: newStage })
        });
        showAdminToast("Action Processed", `Team ${teamName} stage updated.`);
        return;
    }

    if (actionType === 'warn_plus') {
        db[teamName].warnings = (db[teamName].warnings || 0) + 1;
        saveTeamsDb(db);
        return;
    }
    if (actionType === 'warn_minus') {
        db[teamName].warnings = Math.max(0, (db[teamName].warnings || 0) - 1);
        saveTeamsDb(db);
        return;
    }

    if (actionMap[actionType]) {
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionMap[actionType] })
        });
        showAdminToast("Action Processed", `Applied ${actionType} to team ${teamName}`);
    }
}

function executeBulkAction() {
    const actionSelect = document.getElementById('bulkActionSelect');
    if (!actionSelect) return;
    const action = actionSelect.value;
    if (!action) {
        showAdminToast("ℹ️ Info", "Please select a bulk action first.");
        return;
    }
    
    const checkboxes = document.querySelectorAll('.team-checkbox:checked');
    if (checkboxes.length === 0) {
        showAdminToast("ℹ️ Info", "No teams selected.");
        return;
    }
    
    const selectedTeams = Array.from(checkboxes).map(cb => cb.value);
    
    if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${selectedTeams.length} teams?`)) return;
    }
    
    selectedTeams.forEach(teamName => {
        // Skip confirm prompts for bulk delete since we already confirmed once
        if (action === 'delete') {
            const db = getTeamsDb();
            delete db[teamName];
            saveTeamsDb(db);
            transmitGmCommand(teamName, 'LOGOUT', 'Your credentials have been revoked.');
            addLogItem(`Deleted team [${teamName}] from database.`, 'alert');
        } else {
            // Unfreeze maps to freeze in quickAction since it's a toggle, but we should make sure it actually unfreezes.
            if (action === 'unfreeze') {
                const db = getTeamsDb();
                if (db[teamName].status === 'frozen') {
                    quickAction(teamName, 'freeze');
                }
            } else if (action === 'freeze') {
                const db = getTeamsDb();
                if (db[teamName].status !== 'frozen') {
                    quickAction(teamName, 'freeze');
                }
            } else {
                quickAction(teamName, action);
            }
        }
    });
    
    // Clear selection
    const masterCb = document.getElementById('selectAllTeams');
    if (masterCb) masterCb.checked = false;
    toggleAllTeams();
    
    // Force re-render to reflect changes
    renderFullTeamsList();
    
    showAdminToast("✅ Bulk Action Complete", `Applied ${action} to ${selectedTeams.length} teams.`);
    actionSelect.value = '';
}

function setStageDirectly(teamName, targetStage) {
    const db = getTeamsDb();
    if (!db[teamName]) return;
    const old = db[teamName].stage || 1;
    if (old === targetStage) {
        showAdminToast("ℹ️ Stage Unchanged", `${teamName} is already at Stage 0${targetStage}.`);
        return;
    }
    db[teamName].stage = targetStage;
    saveTeamsDb(db);
    transmitGmCommand(teamName, targetStage > old ? 'PROMOTE' : 'DEMOTE', `⚡ Game Master set your access directly to Stage 0${targetStage}!`, 'info', targetStage);
    showAdminToast(`⚡ Stage 0${targetStage} Set`, `${teamName} is now at Stage 0${targetStage}.`);
    addLogItem(`Directly set [${teamName}] to Stage 0${targetStage}`, 'system');
}
window.setStageDirectly = setStageDirectly;

function sendPresetMsg(msg) {
    const target = document.getElementById('targetTeamSelect').value || 'ALL';
    transmitGmCommand(target, 'BROADCAST', msg, 'info');
    showAdminToast("📡 Preset Broadcast Sent", `Sent to ${target}: "${msg}"`);
    addLogItem(`[PRESET BROADCAST to ${target}]: "${msg}"`, 'alert');
}
window.sendPresetMsg = sendPresetMsg;

/* ==========================================================================
   7. LIVE COMMAND LOG & TOASTS
   ========================================================================== */
function addLogItem(text, type = 'system') {
    const list = document.getElementById('commandLogList');
    if (!list) return;
    const timeStr = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-item ${type}`;
    div.innerHTML = `<strong>[${timeStr}]</strong> ${text}`;
    list.prepend(div);
    if (list.children.length > 25) list.removeChild(list.lastElementChild);
}

function clearCommandLog() {
    const list = document.getElementById('commandLogList');
    if (list) list.innerHTML = `<div class="log-item system">⚡ Command log cleared.</div>`;
}

let adminToastTimeout = null;
function showAdminToast(title, msg) {
    const toast = document.getElementById('adminToast');
    const titleEl = document.getElementById('adminToastTitle');
    const msgEl = document.getElementById('adminToastMsg');
    if (!toast) return;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    toast.classList.remove('hidden');
    if (adminToastTimeout) clearTimeout(adminToastTimeout);
    adminToastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}
