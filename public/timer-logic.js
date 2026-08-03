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
    // Broadcast Timeout to Game Master
    const teamId = localStorage.getItem('escape_team_id') || 'UNKNOWN';
    if (window.socket) {
        window.socket.emit('gm_command', {
            id: 'gm_cmd_' + Date.now(),
            target: teamId,
            type: 'WARNING',
            message: `Team ${teamId} ran out of time!`,
            category: 'alert'
        });
    }
    
    // Redirect to home where the disqualification overlay will take over
    window.location.href = 'home.html';
}

// Helper to notify backend of stage completion
window.completeStage = function(nextStage, scoreGained, eventData = '') {
    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) return;
    
    let timeTaken = 0;
    if (typeof window.getTimeTaken === 'function') {
        timeTaken = window.getTimeTaken();
    }
    
    // Fetch current stage from localStorage to increment score if needed
    // or just pass stage to POST
    return fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: teamId, 
            stage: nextStage,
            timeTaken: timeTaken,
            currentStageId: currentStageId
        }) 
    }).then(res => res.json()).catch(err => {
        console.error("Error saving stage:", err);
        return null;
    });
};

// Global polling init for puzzle pages
if (!window.puzzlePollInterval) {
    window.puzzlePollInterval = setInterval(async () => {
        const teamId = localStorage.getItem('escape_team_id');
        if (!teamId) return;
        try {
            const res = await fetch(`/api/teams/${teamId}`);
            if (res.ok) {
                const team = await res.json();
                if (team.status === 'frozen' || team.status === 'timeout' || team.status === 'logged_out') {
                    window.location.href = 'home.html'; // Kick to home to see freeze overlay
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

// Pause timer when navigating away or closing tab
window.addEventListener('beforeunload', () => {
    stopTimer();
});
