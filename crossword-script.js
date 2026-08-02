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
    
    // Timer Logic (Visual only, no server enforcement)
    let startTime = parseInt(localStorage.getItem(`escape_crossword_start_${teamId}`));
    if (!startTime) {
        startTime = Date.now();
        localStorage.setItem(`escape_crossword_start_${teamId}`, startTime);
    }
    
    const timerEl = document.getElementById('timer');
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        if (timerEl) timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
    
    setupValidation(puzzleData, teamId);
});

function renderCrossword(puzzleData) {
    const gridEl = document.getElementById('crosswordGrid');
    if (!gridEl) return;
    
    // Reset grid
    gridEl.innerHTML = '';
    gridEl.style.display = 'grid';
    const gridSize = 25; // CROSSWORD_GENERATOR_SETTINGS.gridSize
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;
    gridEl.style.gridTemplateRows = `repeat(${gridSize}, 40px)`;
    
    let cellMap = {};
    window.crosswordCellMap = cellMap; // Expose for validation
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const char = puzzleData.grid[r][c];
            
            const cell = document.createElement('div');
            
            if (char) {
                cell.className = 'crossword-cell';
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = r;
                input.dataset.col = c;
                
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
                    label.style.top = '2px';
                    label.style.left = '2px';
                    label.style.fontSize = '10px';
                    label.style.color = '#e6c887';
                    label.style.pointerEvents = 'none';
                    cell.style.position = 'relative';
                    cell.appendChild(label);
                }
                
                cell.appendChild(input);
                cellMap[`${r}-${c}`] = input;
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
            Object.values(cellMap).forEach(inp => inp.value = '');
            if (gameMsg) gameMsg.textContent = '';
        });
    }
    
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
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
                        }
                    }
                }
            }
            
            if (filledCells < totalCells) {
                if (gameMsg) {
                    gameMsg.textContent = "Please fill in all blocks before checking.";
                    gameMsg.style.color = "#ffe8b3";
                }
                return;
            }
            
            if (allCorrect) {
                if (gameMsg) {
                    gameMsg.textContent = "✓ CORRECT! CROSSWORD SOLVED!";
                    gameMsg.style.color = "#50e3c2";
                }
                
                triggerStage2Completion(teamId);
                
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    document.getElementById('completeTeam').textContent = teamId;
                    // Timer text
                    const elapsed = Math.floor((Date.now() - parseInt(localStorage.getItem(`escape_crossword_start_${teamId}`))) / 1000);
                    const m = Math.floor(elapsed / 60);
                    const s = elapsed % 60;
                    document.getElementById('completeTime').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    
                    successModal.style.display = 'flex';
                }
            } else {
                if (gameMsg) {
                    gameMsg.textContent = "✗ Some answers are incorrect. Keep trying!";
                    gameMsg.style.color = "#ff6b6b";
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

function triggerStage2Completion(teamId) {
    const currentLevel = parseInt(localStorage.getItem('escape_unlocked_level') || '1', 10);
    
    // Unlock stage 3
    if (currentLevel < 3) {
        localStorage.setItem('escape_unlocked_level', '3');
        
        // Update database
        const rawDb = localStorage.getItem('escape_teams_db');
        if (rawDb && teamId) {
            try {
                const db = JSON.parse(rawDb);
                if (db[teamId] && (db[teamId].stage || 1) < 3) {
                    db[teamId].stage = 3;
                    localStorage.setItem('escape_teams_db', JSON.stringify(db));
                }
            } catch(e) {}
        }
        
        // Broadcast to Game Master
        try {
            const playerBroadcastChannel = new BroadcastChannel('escape_gm_channel');
            playerBroadcastChannel.postMessage({
                type: 'PLAYER_UPDATE',
                teamId: teamId,
                stage: 3
            });
        } catch(e) {}
    }
}
