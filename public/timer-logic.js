/**
 * ESCAPE THE ROOM - DYNAMIC PAUSABLE TIMER LOGIC
 * Included in: crossword.html, scavenger-hunt.html, cipher-chase.html, vault.html
 */

let activityTimerInterval = null;
let currentStageTimeLeft = 0;
let currentStageId = 0;
let currentTeamId = localStorage.getItem('escape_team_id') || 'UNKNOWN';

// Time limit configurations (in seconds)
const STAGE_TIMES = {
    1: 8 * 60,  // Crossword (8 mins)
    2: 10 * 60, // Scavenger Hunt (10 mins)
    3: 8 * 60,  // Cipher Chase (8 mins)
    4: 12 * 60  // StreamWave Vault (12 mins)
};

function initStageTimer(stageId) {
    currentStageId = stageId;
    const saveKey = `escape_timer_${currentTeamId}_stage_${stageId}`;
    
    // Check if there is saved time left
    let savedTime = localStorage.getItem(saveKey);
    if (savedTime !== null) {
        currentStageTimeLeft = parseInt(savedTime);
    } else {
        // Initialize new time
        currentStageTimeLeft = STAGE_TIMES[stageId] || (10 * 60);
        localStorage.setItem(saveKey, currentStageTimeLeft);
    }

    // Attach overlay listener
    const startBtn = document.getElementById('startPlayingBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const overlay = document.getElementById('startOverlay');
            if (overlay) overlay.style.display = 'none';
            startTimer();
            // Start local logic if needed
            if (typeof onStageStart === 'function') onStageStart();
        });
    } else {
        // If no overlay, just start
        startTimer();
    }

    updateTimerDisplay();
}

function startTimer() {
    if (activityTimerInterval) clearInterval(activityTimerInterval);
    
    activityTimerInterval = setInterval(() => {
        if (currentStageTimeLeft > 0) {
            currentStageTimeLeft--;
            localStorage.setItem(`escape_timer_${currentTeamId}_stage_${currentStageId}`, currentStageTimeLeft);
            updateTimerDisplay();
        } else {
            clearInterval(activityTimerInterval);
            handleTimeExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer') || document.getElementById('timerDisplay') || document.getElementById('cipherCountdown');
    if (timerEl) {
        const m = Math.floor(currentStageTimeLeft / 60);
        const s = currentStageTimeLeft % 60;
        timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

function handleTimeExpired() {
    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) return;

    // Update DB status to timeout
    fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: teamId,
            status: 'timeout'
        })
    }).then(() => {
        if (typeof showLocalOverlay === 'function') showLocalOverlay('timeout');
    }).catch(() => {
        if (typeof showLocalOverlay === 'function') showLocalOverlay('timeout');
    });
}

// Stage Polling for Real-Time GM Commands
setInterval(async () => {
    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) return;
    
    try {
        const [teamRes, settingsRes] = await Promise.all([
            fetch(`/api/teams/${teamId}`),
            fetch('/api/settings')
        ]);
        
        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings.gameOver === 'true' && localStorage.getItem('escape_ignore_game_over') !== 'true') {
                window.location.href = 'home.html'; // home.html will handle GAME OVER display
            }
        }
        
        if (teamRes.ok) {
            const team = await teamRes.json();
            
            if (team.timeEvents && team.timeEvents.length > 0) {
                let processedEvents = JSON.parse(localStorage.getItem('escape_processed_time_events') || '[]');
                let newlyAdded = false;
                
                team.timeEvents.forEach(event => {
                    if (!processedEvents.includes(event.id)) {
                        const saveKey = `escape_timer_${team.id}_stage_${event.stage}`;
                        let savedTime = parseInt(localStorage.getItem(saveKey));
                        if (isNaN(savedTime)) savedTime = STAGE_TIMES[event.stage] || 600;
                        savedTime += (event.minutes * 60);
                        localStorage.setItem(saveKey, savedTime);
                        
                        if (currentStageId == event.stage && currentStageTimeLeft !== undefined) {
                            currentStageTimeLeft += (event.minutes * 60);
                            
                            // Start timer again if it was 0 and now it's > 0
                            if (currentStageTimeLeft > 0 && !activityTimerInterval) {
                                startTimer();
                            }
                        }
                        
                        processedEvents.push(event.id);
                        newlyAdded = true;
                    }
                });
                
                if (newlyAdded) {
                    localStorage.setItem('escape_processed_time_events', JSON.stringify(processedEvents));
                    if (typeof updateTimerDisplay === 'function') updateTimerDisplay();
                }
            }
            
            if (team.resetEvents && team.resetEvents.length > 0) {
                let processedResets = JSON.parse(localStorage.getItem('escape_processed_reset_events') || '[]');
                
                for (const event of team.resetEvents) {
                    if (!processedResets.includes(event.id)) {
                        processedResets.push(event.id);
                        localStorage.setItem('escape_processed_reset_events', JSON.stringify(processedResets));
                        
                        if (event.scope === 'all') {
                            const keysToRemove = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                const k = localStorage.key(i);
                                if (k !== 'escape_team_id' && k !== 'escape_processed_reset_events' && (k.startsWith('escape_') || k.startsWith('streamwave_') || k.startsWith('sh_'))) {
                                    keysToRemove.push(k);
                                }
                            }
                            keysToRemove.forEach(k => localStorage.removeItem(k));
                            window.location.href = 'home.html';
                            return;
                        } else if (event.scope === 'current') {
                            const stage = event.stage;
                            const keysToRemove = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                const k = localStorage.key(i);
                                if (k.startsWith(`escape_timer_${team.id}_stage_${stage}`)) keysToRemove.push(k);
                                if (stage === 1 && k.startsWith(`escape_crossword_${team.id}`)) keysToRemove.push(k);
                                if (stage === 2 && k.startsWith('sh_')) keysToRemove.push(k);
                                if (stage === 3 && k.startsWith('escape_cipher_')) keysToRemove.push(k);
                                if (stage === 4 && k.startsWith('streamwave_qr_')) keysToRemove.push(k);
                            }
                            keysToRemove.forEach(k => localStorage.removeItem(k));
                            window.location.reload();
                            return;
                        }
                    }
                }
            }

            if (team.status === 'frozen' || team.status === 'timeout') {
                if (typeof showLocalOverlay === 'function') showLocalOverlay(team.status);
            } else if (team.status === 'logged_out') {
                window.location.href = 'index.html';
            } else {
                if (typeof hideLocalOverlay === 'function') hideLocalOverlay();
            }
        }
    } catch(e) {}
}, 3000);

// Helper to notify backend of stage completion
window.completeStage = async function(nextStage, scoreGained, eventData = '') {
    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) return null;
    
    let timeTaken = 0;
    if (typeof window.getTimeTaken === 'function') {
        timeTaken = window.getTimeTaken();
    }
    
    try {
        const res = await fetch(`/api/teams/${teamId}`);
        const team = await res.json();
        const currentScore = team.score || 0;
        const newScore = currentScore + (scoreGained || 0);
        
        const updateRes = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: teamId, 
                stage: nextStage,
                score: newScore,
                timeTaken: timeTaken,
                currentStageId: currentStageId
            }) 
        });
        return await updateRes.json();
    } catch(err) {
        console.error("Error saving stage:", err);
        return null;
    }
};

// Global polling init for puzzle pages
if (!window.puzzlePollInterval) {
    window.puzzlePollInterval = setInterval(async () => {
        const teamId = localStorage.getItem('escape_team_id');
        if (!teamId) return;
        
        if (typeof window.getTimeTaken === 'function' && typeof currentStageId !== 'undefined') {
            const tTaken = window.getTimeTaken();
            fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: teamId, 
                    timeTaken: tTaken,
                    currentStageId: currentStageId
                }) 
            }).catch(e => {}); // ignore minor connection errors on heartbeat
        }

        try {
            const res = await fetch(`/api/teams/${teamId}`);
            if (res.ok) {
                const team = await res.json();
                
                if (team.timeEvents && team.timeEvents.length > 0) {
                    let processedEvents = JSON.parse(localStorage.getItem('escape_processed_time_events') || '[]');
                    let newlyAdded = false;
                    
                    team.timeEvents.forEach(event => {
                        if (!processedEvents.includes(event.id)) {
                            const saveKey = `escape_timer_${team.id}_stage_${event.stage}`;
                            let savedTime = parseInt(localStorage.getItem(saveKey));
                            if (isNaN(savedTime)) savedTime = STAGE_TIMES[event.stage] || 600;
                            savedTime += (event.minutes * 60);
                            localStorage.setItem(saveKey, savedTime);
                            
                            if (currentStageId == event.stage && currentStageTimeLeft !== undefined) {
                                currentStageTimeLeft += (event.minutes * 60);
                                
                                // Start timer again if it was 0 and now it's > 0
                                if (currentStageTimeLeft > 0 && !activityTimerInterval) {
                                    startTimer();
                                }
                            }
                            
                            processedEvents.push(event.id);
                            newlyAdded = true;
                        }
                    });
                    
                    if (newlyAdded) {
                        localStorage.setItem('escape_processed_time_events', JSON.stringify(processedEvents));
                        if (typeof updateTimerDisplay === 'function') updateTimerDisplay();
                    }
                }
                
                if (team.resetEvents && team.resetEvents.length > 0) {
                    let processedResets = JSON.parse(localStorage.getItem('escape_processed_reset_events') || '[]');
                    
                    for (const event of team.resetEvents) {
                        if (!processedResets.includes(event.id)) {
                            processedResets.push(event.id);
                            localStorage.setItem('escape_processed_reset_events', JSON.stringify(processedResets));
                            
                            if (event.scope === 'all') {
                                const keysToRemove = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    const k = localStorage.key(i);
                                    if (k !== 'escape_team_id' && k !== 'escape_processed_reset_events' && (k.startsWith('escape_') || k.startsWith('streamwave_') || k.startsWith('sh_'))) {
                                        keysToRemove.push(k);
                                    }
                                }
                                keysToRemove.forEach(k => localStorage.removeItem(k));
                                window.location.href = 'home.html';
                                return;
                            } else if (event.scope === 'current') {
                                const stage = event.stage;
                                const keysToRemove = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    const k = localStorage.key(i);
                                    if (k.startsWith(`escape_timer_${team.id}_stage_${stage}`)) keysToRemove.push(k);
                                    if (stage === 1 && k.startsWith(`escape_crossword_${team.id}`)) keysToRemove.push(k);
                                    if (stage === 2 && k.startsWith('sh_')) keysToRemove.push(k);
                                    if (stage === 3 && k.startsWith('escape_cipher_')) keysToRemove.push(k);
                                    if (stage === 4 && k.startsWith('streamwave_qr_')) keysToRemove.push(k);
                                }
                                keysToRemove.forEach(k => localStorage.removeItem(k));
                                window.location.reload();
                                return;
                            }
                        }
                    }
                }

                if (team.status === 'frozen' || team.status === 'timeout') {
                    if (typeof showLocalOverlay === 'function') showLocalOverlay(team.status);
                } else if (team.status === 'logged_out') {
                    window.location.href = 'index.html';
                } else {
                    if (typeof hideLocalOverlay === 'function') hideLocalOverlay();
                }
            }
        } catch(e) {}
    }, 3000);
}

function stopTimer() {
    if (activityTimerInterval) clearInterval(activityTimerInterval);
}

window.getTimeTaken = function() {
    if (!currentStageId || !STAGE_TIMES[currentStageId]) return 0;
    return STAGE_TIMES[currentStageId] - currentStageTimeLeft;
};

// Overlay logic for freeze / timeout on the activity page itself
window.showLocalOverlay = function(status) {
    let overlay = document.getElementById('localStatusOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'localStatusOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(10, 10, 15, 0.95)';
        overlay.style.backdropFilter = 'blur(10px)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#fff';
        overlay.style.fontFamily = 'monospace';
        overlay.style.textAlign = 'center';
        overlay.style.padding = '20px';
        
        const title = document.createElement('h1');
        title.id = 'localOverlayTitle';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '20px';
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '2px';
        
        const desc = document.createElement('p');
        desc.id = 'localOverlayDesc';
        desc.style.fontSize = '1.2rem';
        desc.style.maxWidth = '600px';
        desc.style.lineHeight = '1.6';
        desc.style.color = '#a5b0bb';
        
        overlay.appendChild(title);
        overlay.appendChild(desc);
        document.body.appendChild(overlay);
    }
    
    const title = document.getElementById('localOverlayTitle');
    const desc = document.getElementById('localOverlayDesc');
    
    if (status === 'timeout') {
        title.textContent = "OUT OF TIME";
        title.style.color = '#ff4f55';
        title.style.textShadow = '0 0 20px rgba(255, 79, 85, 0.5)';
        desc.textContent = "Your time for this activity has expired. The screen is now locked. If you believe this is an error or need extra time, please ask the Game Master.";
    } else if (status === 'frozen') {
        title.textContent = "SYSTEM LOCKED";
        title.style.color = '#50e3c2';
        title.style.textShadow = '0 0 20px rgba(80, 227, 194, 0.5)';
        desc.textContent = "Your session has been temporarily paused by the Game Master. Please wait for further instructions.";
    }
    
    overlay.style.display = 'flex';
};

window.hideLocalOverlay = function() {
    const overlay = document.getElementById('localStatusOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

// Pause timer when navigating away or closing tab
window.addEventListener('beforeunload', () => {
    stopTimer();
});
