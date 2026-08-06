// Crossword Client Logic

document.addEventListener('DOMContentLoaded', () => {
    const teamId = localStorage.getItem('escape_team_id');
    if (!teamId) {
        window.location.href = 'index.html';
        return;
    }
    
    const teamDisplay = document.getElementById('teamDisplay');
    if (teamDisplay) teamDisplay.textContent = teamId;
    
    // Check if team already generated a crossword
    let puzzleDataStr = localStorage.getItem(`escape_crossword_${teamId}`);
    let puzzleData;
    
    if (puzzleDataStr) {
        puzzleData = JSON.parse(puzzleDataStr);
    } else {
        // Generate new puzzle using global generateCrossword function (from crossword-logic.js)
        puzzleData = generateCrossword();
        if (!puzzleData || !puzzleData.grid) {
            alert("Failed to generate crossword. Please refresh the page to try again.");
            return;
        }
        localStorage.setItem(`escape_crossword_${teamId}`, JSON.stringify(puzzleData));
    }
    
    renderCrossword(puzzleData);
    
    // Timer Logic (dynamic pausable)
    if (typeof initStageTimer === 'function') {
        initStageTimer(1); // 1 = crossword
    }
    
    setupValidation(puzzleData, teamId);
});

function renderCrossword(puzzleData) {
    const gridEl = document.getElementById('crosswordGrid');
    if (!gridEl) return;
    
    // Reset grid
    gridEl.innerHTML = '';
    gridEl.style.display = 'grid';
    const gridSize = 25;
    // Calculate bounding box of placed words
    let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (puzzleData.grid[r][c]) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        }
    }
    // Add 1 cell padding around the puzzle
    minR = Math.max(0, minR - 1);
    maxR = Math.min(gridSize - 1, maxR + 1);
    minC = Math.max(0, minC - 1);
    maxC = Math.min(gridSize - 1, maxC + 1);
    
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    
    gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size, 52px))`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, var(--cell-size, 52px))`;
    
    let cellMap = {};
    window.crosswordCellMap = cellMap; // Expose for validation
    
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const char = puzzleData.grid[r][c];
            
            const cell = document.createElement('div');
            
            if (char) {
                cell.className = 'crossword-cell';
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = r;
                input.dataset.col = c;
                // Add transparent background and relative z-index to input to not hide number
                input.style.background = 'transparent';
                input.style.position = 'relative';
                input.style.zIndex = '2';
                
                // Allow navigating between inputs via arrows
                input.addEventListener('keyup', handleInputNavigation);
                
                // Look for numbering
                let labelNum = null;
                puzzleData.words.forEach(w => {
                    if (w.row === r && w.col === c) labelNum = w.number;
                });
                
                if (labelNum) {
                    const label = document.createElement('span');
                    label.className = 'cell-number';
                    label.textContent = labelNum;
                    label.style.position = 'absolute';
                    label.style.top = '3px';
                    label.style.left = '4px';
                    label.style.fontSize = '12px';
                    label.style.fontWeight = 'bold';
                    label.style.color = '#fff';
                    label.style.zIndex = '1';
                    label.style.pointerEvents = 'none';
                    cell.style.position = 'relative';
                    cell.appendChild(label);
                }
                
                cell.appendChild(input);
                cellMap[`${r}-${c}`] = input;
                
                // Add event listener to save state and clear error styles on type
                input.addEventListener('input', () => {
                    input.style.backgroundColor = '';
                    input.style.color = '#fff';
                    saveCrosswordState();
                });
            } else {
                cell.className = 'empty-cell';
                cell.style.background = 'transparent';
                cell.style.border = 'none';
            }
            gridEl.appendChild(cell);
        }
    }
    
    // Render Clues
    const acrossEl = document.getElementById('acrossClues');
    const downEl = document.getElementById('downClues');
    if (acrossEl) acrossEl.innerHTML = '';
    if (downEl) downEl.innerHTML = '';
    
    puzzleData.words.forEach(w => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${w.number}.</strong> ${w.clue}`;
        p.style.marginBottom = '8px';
        p.style.lineHeight = '1.4';
        
        if (w.direction === 'across' && acrossEl) {
            acrossEl.appendChild(p);
        } else if (downEl) {
            downEl.appendChild(p);
        }
    });
    
    // Restore saved inputs if they exist
    restoreCrosswordState();
}

function saveCrosswordState() {
    const teamId = localStorage.getItem('escape_team_id') || 'DEBUG';
    const cellMap = window.crosswordCellMap || {};
    const state = {};
    for (const key in cellMap) {
        if (cellMap[key].value.trim()) {
            state[key] = cellMap[key].value.toUpperCase();
        }
    }
    localStorage.setItem('escape_crossword_state_' + teamId, JSON.stringify(state));
}

function restoreCrosswordState() {
    const teamId = localStorage.getItem('escape_team_id') || 'DEBUG';
    const saved = localStorage.getItem('escape_crossword_state_' + teamId);
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        const cellMap = window.crosswordCellMap || {};
        for (const key in state) {
            if (cellMap[key]) {
                cellMap[key].value = state[key];
            }
        }
    } catch(e) { console.error("Could not restore crossword state", e); }
}

function handleInputNavigation(e) {
    const input = e.target;
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    const cellMap = window.crosswordCellMap;
    
    let target = null;
    if (!window.crosswordDirection) window.crosswordDirection = 'across';
    
    if (e.key === 'ArrowRight') { target = cellMap[`${r}-${c+1}`]; window.crosswordDirection = 'across'; }
    else if (e.key === 'ArrowLeft') { target = cellMap[`${r}-${c-1}`]; window.crosswordDirection = 'across'; }
    else if (e.key === 'ArrowDown') { target = cellMap[`${r+1}-${c}`]; window.crosswordDirection = 'down'; }
    else if (e.key === 'ArrowUp') { target = cellMap[`${r-1}-${c}`]; window.crosswordDirection = 'down'; }
    else if (e.key.length === 1 && input.value.length === 1) {
        // Auto advance based on current active direction
        if (window.crosswordDirection === 'down') {
            target = cellMap[`${r+1}-${c}`];
            if (!target) { target = cellMap[`${r}-${c+1}`]; window.crosswordDirection = 'across'; }
        } else {
            target = cellMap[`${r}-${c+1}`];
            if (!target) { target = cellMap[`${r+1}-${c}`]; window.crosswordDirection = 'down'; }
        }
    } else if (e.key === 'Backspace') {
        if (window.crosswordDirection === 'down') {
            target = cellMap[`${r-1}-${c}`];
        } else {
            target = cellMap[`${r}-${c-1}`];
        }
    }
    
    if (e.key.length === 1 || e.key === 'Backspace') {
        if (typeof playTypingSound === 'function') playTypingSound();
    }
    
    if (target) {
        target.focus();
        target.select();
    }
}

function setupValidation(puzzleData, teamId) {
    const checkBtn = document.getElementById('checkButton');
    const clearBtn = document.getElementById('clearButton');
    const gameMsg = document.getElementById('gameMessage');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const cellMap = window.crosswordCellMap;
            Object.values(cellMap).forEach(inp => {
                inp.value = '';
                inp.style.backgroundColor = '';
            });
            if (gameMsg) gameMsg.textContent = '';
            saveCrosswordState();
        });
    }
    
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            if (typeof playClickSound === 'function') playClickSound();
            const cellMap = window.crosswordCellMap;
            let allCorrect = true;
            let totalCells = 0;
            let filledCells = 0;
            
            const gridSize = 25;
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const char = puzzleData.grid[r][c];
                    if (char) {
                        totalCells++;
                        const input = cellMap[`${r}-${c}`];
                        if (input.value.trim().length > 0) filledCells++;
                        
                        if (input.value.toUpperCase() !== char.toUpperCase()) {
                            allCorrect = false;
                            if (input.value.trim().length > 0) {
                                // Highlight incorrect cells
                                input.style.backgroundColor = 'rgba(255, 42, 42, 0.4)';
                                input.style.color = '#ffb3b3';
                                // Shake animation
                                input.style.transform = 'translateX(3px)';
                                setTimeout(() => input.style.transform = 'translateX(-3px)', 50);
                                setTimeout(() => input.style.transform = 'translateX(3px)', 100);
                                setTimeout(() => input.style.transform = 'translateX(0)', 150);
                            }
                        } else {
                            input.style.backgroundColor = 'rgba(80, 227, 194, 0.2)';
                        }
                    }
                }
            }
            
            if (filledCells < totalCells) {
                if (gameMsg) {
                    gameMsg.textContent = "Please fill in all blocks before checking. Incorrect answers are highlighted in red.";
                    gameMsg.style.color = "#ff4f55";
                }
                return;
            }
            
            if (!allCorrect) {
                if (gameMsg) {
                    gameMsg.textContent = "Some answers are incorrect! Incorrect cells are highlighted in red.";
                    gameMsg.style.color = "#ff4f55";
                }
                if (typeof playErrorSound === 'function') playErrorSound();
                else if (typeof playSound === 'function') playSound('error');
                return;
            }
            
            if (allCorrect) {
                if (typeof playCompletionSound === 'function') playCompletionSound();
                if (gameMsg) {
                    gameMsg.textContent = "✓ CORRECT! CROSSWORD SOLVED!";
                    gameMsg.style.color = "#50e3c2";
                }
                
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    document.getElementById('completeTeam').textContent = teamId;
                    if (typeof stopTimer === 'function') stopTimer();
                    
                    let elapsed = 0;
                    if (typeof window.getTimeTaken === 'function') elapsed = window.getTimeTaken();
                    const m = Math.floor(elapsed / 60);
                    const s = elapsed % 60;
                    document.getElementById('completeTime').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    
                    // Unified Scoring Math
                    const hintsUsed = (typeof window.getHintsUsed === 'function') ? window.getHintsUsed() : 0;
                    const baseScore = 25;
                    const timeRemaining = (typeof currentStageTimeLeft !== 'undefined') ? currentStageTimeLeft : 0;
                    const hintsPenalty = (hintsUsed * 2);
                    const timeBonus = Math.floor(timeRemaining / 20);
                    
                    let finalScore = baseScore + timeBonus - hintsPenalty;
                    if (finalScore < 0) finalScore = 0;
                    
                    const cScoreEl = document.getElementById('completeScore');
                    const cMathEl = document.getElementById('completeScoreMath');
                    if (cScoreEl) cScoreEl.textContent = `${finalScore} PTS`;
                    if (cMathEl) cMathEl.innerHTML = `${baseScore} Base + ${timeBonus} Time Bonus`;
                    
                    successModal.style.display = 'flex';
                    
                    triggerStage2Completion(teamId, finalScore);
                }
            } else {
                if (typeof playErrorSound === 'function') playErrorSound();
                if (gameMsg) {
                    gameMsg.textContent = "Incorrect. Please review your answers.";
                    gameMsg.style.color = "#ff4d4d";
                }
            }
        });
    }
    
    const closeBtn = document.getElementById('closeSuccess');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }
}

function triggerStage2Completion(teamId, finalScore) {
    const currentLevel = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
    
    // Unlock stage 2 locally for instant UI update
    if (currentLevel < 2) {
        localStorage.setItem('escape_unlocked_level', '2');
        if (typeof window.completeStage === 'function') {
            window.completeStage(2, finalScore, 'Crossword Complete');
        }
    }
}

// --- Audio Effects System ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Background audio removed as per request
    }
}

// Initialize audio on first interaction
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

function playTypingSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + (Math.random() * 200), audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playClickSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playCompletionSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // C#5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.45); // A5
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

function playErrorSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}
