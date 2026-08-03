/**
 * ESCAPE THE ROOM — 3-SUBSTAGE CAESAR, ATBASH, & ROT13 VAULT ENGINE
 * Handles sequential mini-challenges, dynamic team-specific cipher combinations,
 * state persistence across reloads, live GM monitoring, and auto-refresh updates.
 */

const PLAYER_GM_CHANNEL = 'escape_gm_channel';
let playerBroadcastChannel = null;
try {
    playerBroadcastChannel = new BroadcastChannel(PLAYER_GM_CHANNEL);
} catch (e) {
    console.warn("BroadcastChannel not supported in this browser.");
}

let activeTeamName = "TEAM-ALPHA";
let currentTeamCiphers = null;
let currentSubStage = 1; // 1: Caesar, 2: Atbash, 3: ROT13
let countdownIntervalId = null;

const STAGE3_WORDS = [
    'CYBER', 'ENIGMA', 'MATRIX', 'KERNEL', 
    'BINARY', 'SECURE', 'NEXUS', 'BUFFER', 
    'SOCKET', 'ROUTER', 'SERVER', 'VAULT', 
    'SYSTEM', 'PORTAL', 'HEXAGON', 'DECODE', 
    'PYTHON', 'PIXELS', 'LOGGER', 'SENSORS', 
    'SCRIPTS', 'COMPASS', 'OVERLAY', 'LANTERN'
];

document.addEventListener('DOMContentLoaded', () => {
    initAuthAndCipher();
    initEmbersCanvas();
    initAudioEngine();
    initCipherForm();
    initCountdownTimer();
});

/* ==========================================================================
   1. AUTHENTICATION & UNIQUE TRIPLET CIPHER GENERATION
   ========================================================================== */
function initAuthAndCipher() {
    activeTeamName = localStorage.getItem('escape_team_id');
    if (!activeTeamName) {
        alert("Session expired! Please login first.");
        window.location.href = 'index.html';
        return;
    }

    const teamIndicator = document.getElementById('teamIndicator');
    if (teamIndicator) teamIndicator.textContent = `ACTIVE TEAM: ${activeTeamName}`;

    // Load active sub-stage from localStorage (prevents resetting on refresh)
    currentSubStage = parseInt(localStorage.getItem('escape_cipher_substage') || '1', 10);
    if (currentSubStage < 1 || currentSubStage > 3) currentSubStage = 1;

    // Generate unique cipher combinations ( Caesar / Atbash / ROT13 ) for the team
    currentTeamCiphers = getStage3CiphersForTeam(activeTeamName);

    // Initial render
    renderSubStageUI();
}

function getStage3CiphersForTeam(teamName) {
    const cleanName = (teamName || 'TEAM-ALPHA').trim().toUpperCase();
    let teamIndex = 0;
    
    // Extract team number if TEAM-XX pattern
    const match = cleanName.match(/TEAM-0*(\d+)/);
    if (match) {
        const num = parseInt(match[1], 10);
        teamIndex = (num - 1) % 24;
    } else {
        // Fallback hash
        let hash = 0;
        for (let i = 0; i < cleanName.length; i++) {
            hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
        }
        teamIndex = Math.abs(hash) % 24;
    }
    
    // Index mapping (guarantees disjoint combinations for 24 teams)
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
    
    // Caesar Shift Key (unique to team index, 3 to 17)
    const caesarShift = ((teamIndex * 7 + 3) % 15) + 3;
    // Caesar Decoy Shift Key (unique to team index, 18 to 25)
    const caesarDecoyShift = ((teamIndex * 11 + 7) % 8) + 18;
    
    // Encrypt Caesar (Word 1)
    let caesarCiphertext = "";
    for (let i = 0; i < word1.length; i++) {
        let code = word1.charCodeAt(i) - 65;
        caesarCiphertext += String.fromCharCode(((code + caesarShift) % 26) + 65);
    }
    
    // Encrypt Atbash (Word 2)
    let atbashCiphertext = "";
    for (let i = 0; i < word2.length; i++) {
        let code = word2.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            atbashCiphertext += String.fromCharCode(90 - (code - 65));
        } else {
            atbashCiphertext += word2.charAt(i);
        }
    }
    
    // Encrypt ROT13 (Word 3)
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

/* ==========================================================================
   2. INTERACTIVE SUB-STAGE UI RENDERING
   ========================================================================== */
function renderSubStageUI() {
    if (!currentTeamCiphers) return;

    // Reset input fields
    const answerInput = document.getElementById('caesarAnswerInput');
    if (answerInput) {
        answerInput.value = '';
        answerInput.placeholder = `Enter Sub-Stage 0${currentSubStage} decrypted word`;
    }

    const feedbackBanner = document.getElementById('caesarFeedback');
    if (feedbackBanner) feedbackBanner.classList.add('hidden');

    // 1. Update progress tracker dots
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot-sub-${i}`);
        if (dot) {
            if (i < currentSubStage) {
                dot.style.background = '#ffe8b3';
                dot.style.boxShadow = '0 0 6px #ffe8b3';
            } else if (i === currentSubStage) {
                dot.style.background = '#50e3c2';
                dot.style.boxShadow = '0 0 8px #50e3c2';
            } else {
                dot.style.background = 'rgba(255,255,255,0.2)';
                dot.style.boxShadow = 'none';
            }
        }
    }

    // 2. Set sub-stage header tagline
    const stepTag = document.getElementById('stageStepTag');
    if (stepTag) stepTag.textContent = `SUB-STAGE 0${currentSubStage} OF 03`;

    // 3. Load active challenge data
    const sliderContainer = document.getElementById('sliderContainer');
    const ciphertextDisplay = document.getElementById('caesarCiphertextDisplay');
    const decryptedOutput = document.getElementById('caesarDecryptedOutput');
    const instTitle = document.getElementById('substageInstructionTitle');
    const instDesc = document.getElementById('substageInstructionDesc');
    const cipherLabel = document.getElementById('cipherTypeLabel');
    const resultLabel = document.getElementById('resultTypeLabel');

    if (currentSubStage === 1) {
        // Caesar Sub-stage
        if (sliderContainer) sliderContainer.style.display = 'block';
        
        if (instTitle) instTitle.textContent = "SUB-STAGE 01: CAESAR CIPHER VAULT";
        if (instDesc) instDesc.textContent = "Slide the decryption key dial below to shift the characters in real-time. Find the key shift value that reveals a meaningful English word, then submit it below.";
        if (cipherLabel) cipherLabel.textContent = "🔒 ENCRYPTED KEY (CAESAR):";
        if (resultLabel) resultLabel.textContent = "🟢 DECRYPTED STRING (SLIDE DIAL):";
        
        if (ciphertextDisplay) ciphertextDisplay.textContent = currentTeamCiphers.c1.ciphertext;
        
        // Reset shift elements to 0
        const shiftDial = document.getElementById('caesarShiftDial');
        if (shiftDial) shiftDial.value = 0;
        const shiftVal = document.getElementById('caesarShiftVal');
        if (shiftVal) shiftVal.textContent = "0";
        
        if (decryptedOutput) {
            decryptedOutput.textContent = currentTeamCiphers.c1.ciphertext;
            decryptedOutput.style.color = '#50e3c2';
            decryptedOutput.style.textShadow = '0 0 12px rgba(80, 227, 194, 0.8), 0 0 25px rgba(80, 227, 194, 0.4)';
        }

    } else if (currentSubStage === 2) {
        // Atbash Sub-stage
        if (sliderContainer) sliderContainer.style.display = 'none';
        
        if (instTitle) instTitle.textContent = "SUB-STAGE 02: ATBASH VAULT (MIRROR)";
        if (instDesc) instDesc.textContent = "This vault is locked with the Atbash alphabet mirror. Look at the encrypted key and decipher it manually (A ↔ Z, B ↔ Y, C ↔ X, ...).";
        if (cipherLabel) cipherLabel.textContent = "🔒 ENCRYPTED KEY (ATBASH):";
        if (resultLabel) resultLabel.textContent = "🟢 DECRYPTED STRING STATUS:";
        
        if (ciphertextDisplay) ciphertextDisplay.textContent = currentTeamCiphers.c2.ciphertext;
        if (decryptedOutput) {
            decryptedOutput.textContent = "• ".repeat(currentTeamCiphers.c2.ciphertext.length).trim();
            decryptedOutput.style.color = 'var(--text-secondary)';
            decryptedOutput.style.textShadow = 'none';
        }

    } else if (currentSubStage === 3) {
        // ROT13 Sub-stage
        if (sliderContainer) sliderContainer.style.display = 'none';
        
        if (instTitle) instTitle.textContent = "SUB-STAGE 03: ROT13 VAULT (ROTATION)";
        if (instDesc) instDesc.textContent = "The final lock utilizes ROT13 symmetric shift. Decipher the key by rotating each character by 13 positions forward or backward.";
        if (cipherLabel) cipherLabel.textContent = "🔒 ENCRYPTED KEY (ROT13):";
        if (resultLabel) resultLabel.textContent = "🟢 DECRYPTED STRING STATUS:";
        
        if (ciphertextDisplay) ciphertextDisplay.textContent = currentTeamCiphers.c3.ciphertext;
        if (decryptedOutput) {
            decryptedOutput.textContent = "• ".repeat(currentTeamCiphers.c3.ciphertext.length).trim();
            decryptedOutput.style.color = 'var(--text-secondary)';
            decryptedOutput.style.textShadow = 'none';
        }
    }

    if (answerInput) setTimeout(() => answerInput.focus(), 100);
}

/* ==========================================================================
   3. REAL-TIME WORKSPACE TRANSLATORS
   ========================================================================== */
function updateCaesarDecryption() {
    if (!currentTeamCiphers || currentSubStage !== 1) return;
    const ciphertext = currentTeamCiphers.c1.ciphertext;
    
    const shiftDial = document.getElementById('caesarShiftDial');
    const shiftValEl = document.getElementById('caesarShiftVal');
    const outputEl = document.getElementById('caesarDecryptedOutput');
    
    if (!shiftDial || !outputEl) return;
    
    const currentShift = parseInt(shiftDial.value, 10);
    if (shiftValEl) shiftValEl.textContent = currentShift;
    
    // Decoy word override (render secondary meaningful decoy if shift matches)
    if (currentShift === currentTeamCiphers.c1.decoyshift) {
        outputEl.textContent = currentTeamCiphers.c1.decoytext.toUpperCase();
        return;
    }
    
    let decrypted = "";
    for (let i = 0; i < ciphertext.length; i++) {
        let code = ciphertext.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            decrypted += String.fromCharCode(((code - 65 - currentShift + 26) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
            decrypted += String.fromCharCode(((code - 97 - currentShift + 26) % 26) + 97);
        } else {
            decrypted += ciphertext.charAt(i);
        }
    }
    
    outputEl.textContent = decrypted.toUpperCase();
}
window.updateCaesarDecryption = updateCaesarDecryption;



/* ==========================================================================
   4. FORM ACTIONS & SEQUENTIAL SUBSTAGE PROGRESSION
   ========================================================================== */
function initCipherForm() {
    const form = document.getElementById('cipherChaseForm');
    const answerInput = document.getElementById('caesarAnswerInput');
    const feedbackBanner = document.getElementById('caesarFeedback');
    const feedbackText = document.getElementById('feedbackText');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentTeamCiphers) return;

            const userAns = answerInput.value.trim().toUpperCase();
            
            // Get correct answer for active sub-stage
            let correctAns = "";
            if (currentSubStage === 1) correctAns = currentTeamCiphers.c1.plaintext;
            else if (currentSubStage === 2) correctAns = currentTeamCiphers.c2.plaintext;
            else if (currentSubStage === 3) correctAns = currentTeamCiphers.c3.plaintext;

            let isCorrect = (userAns === correctAns.toUpperCase());

            if (isCorrect) {
                if (feedbackBanner) feedbackBanner.classList.add('hidden');
                
                // Advanced progression flow
                if (currentSubStage < 3) {
                    playUnlockSound();
                    
                    // Reveal the answer word in the green output box briefly
                    const decryptedOutput = document.getElementById('caesarDecryptedOutput');
                    if (decryptedOutput) {
                        let word = (currentSubStage === 1) ? currentTeamCiphers.c1.plaintext : currentTeamCiphers.c2.plaintext;
                        decryptedOutput.textContent = word.toUpperCase();
                        decryptedOutput.style.color = '#50e3c2';
                        decryptedOutput.style.textShadow = '0 0 12px rgba(80, 227, 194, 0.8), 0 0 25px rgba(80, 227, 194, 0.4)';
                    }

                    // Flash terminal green for visual feedback
                    const terminal = document.querySelector('.terminal-workspace');
                    if (terminal) {
                        terminal.style.borderColor = '#ffe8b3';
                        setTimeout(() => { terminal.style.borderColor = 'rgba(80, 227, 194, 0.25)'; }, 600);
                    }

                    // Increment and save sub-stage state
                    currentSubStage++;
                    localStorage.setItem('escape_cipher_substage', currentSubStage.toString());
                    
                    // Wait a bit to show the decrypted word, then load next sub-stage UI
                    setTimeout(renderSubStageUI, 800);
                } else {
                    // Reveal Sub-Stage 3 answer
                    const decryptedOutput = document.getElementById('caesarDecryptedOutput');
                    if (decryptedOutput) {
                        decryptedOutput.textContent = currentTeamCiphers.c3.plaintext.toUpperCase();
                        decryptedOutput.style.color = '#50e3c2';
                        decryptedOutput.style.textShadow = '0 0 12px rgba(80, 227, 194, 0.8), 0 0 25px rgba(80, 227, 194, 0.4)';
                    }
                    // All 3 sub-stages completed successfully!
                    triggerGlobalSuccessFlow();
                }
            } else {
                if (feedbackBanner && feedbackText) {
                    feedbackText.textContent = "✗ Invalid override word! Cross-examine your decoded string.";
                    feedbackBanner.classList.remove('hidden');
                }
                playErrorSound();
                form.style.animation = 'none';
                form.offsetHeight;
                form.style.animation = 'shake 0.4s ease';
                setTimeout(() => { form.style.animation = null; }, 400);
            }
        });
    }

    if (answerInput) {
        answerInput.addEventListener('focus', () => {
            playClickSound();
            if (feedbackBanner) feedbackBanner.classList.add('hidden');
        });
    }
}

function triggerGlobalSuccessFlow() {
    playUnlockSound();

    // Show unlocked Modal
    const modal = document.getElementById('successModal');
    const progressBar = document.getElementById('successProgressBar');
    if (modal) modal.classList.remove('hidden');
    setTimeout(() => {
        if (progressBar) progressBar.style.width = "100%";
    }, 100);

    // Clear countdown timer state
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    localStorage.removeItem('escape_cipher_timer_end');

    // Save progression stage 4 to database
    localStorage.setItem('escape_unlocked_level', '4');
    localStorage.removeItem('escape_cipher_substage'); // Reset sub-stages

    if (typeof window.completeStage === 'function') {
        window.completeStage(4, 500, 'Cipher Chase Complete');
    }

    // Redirect to home.html after 2.5s
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 2500);
}


/* ==========================================================================
   6. EMBERS canvas particle animations
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
   7. SYNTHESIZED WEB AUDIO ENGINE
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
window.playClickSound = playClickSound;

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
   8. PERSISTENT COUNTDOWN TIMER & FAILURE RED-OUTS
   ========================================================================== */
function initCountdownTimer() {
    if (typeof initStageTimer === 'function') {
        initStageTimer(3);
        
        // Add low-time effect by overriding updateTimerDisplay or using an interval
        setInterval(() => {
            const timerBox = document.getElementById('cipherTimerBox');
            if (typeof currentStageTimeLeft !== 'undefined' && currentStageTimeLeft <= 120 && currentStageTimeLeft > 0) {
                if (timerBox) timerBox.classList.add('low-time');
            } else {
                if (timerBox) timerBox.classList.remove('low-time');
            }
        }, 1000);
    }
}

function triggerLockdownFailure() {
    playErrorSound();
    
    // Open failure timeout overlay
    const timeoutModal = document.getElementById('timeoutModal');
    const bar = document.getElementById('timeoutProgressBar');
    
    if (timeoutModal) {
        timeoutModal.classList.remove('hidden');
        setTimeout(() => {
            if (bar) bar.style.width = "100%";
        }, 100);
    }
    
    // Clear timer and active sub-stages
    localStorage.removeItem('escape_cipher_timer_end');
    localStorage.removeItem('escape_cipher_substage');
    
    // Redirect back to home after 3s
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 3000);
}

/* ==========================================================================
   9. DYNAMIC HINT PANEL
   ========================================================================== */
function showChamberHint() {
    playClickSound();
    
    const modal = document.getElementById('hintModal');
    const hintTextEl = document.getElementById('hintText');
    if (!modal || !hintTextEl) return;
    
    let hint = "";
    if (currentSubStage === 1) {
        hint = "💡 Caesar shifts each character by a constant offset key. Slide the dial to rotate the letters until they form a recognizable cybersecurity word (e.g. CYBER, KERNEL, SYSTEM).";
    } else if (currentSubStage === 2) {
        hint = "💡 Atbash mirrors the alphabet (A ↔ Z, B ↔ Y, C ↔ X). Examine the encrypted key (e.g. VMRTNZ) and solve it by hand using the mirrored alphabet.";
    } else if (currentSubStage === 3) {
        hint = "💡 ROT13 rotates each character by 13 positions forward or backward (A ↔ N, B ↔ O). Examine the encrypted key and apply the rotation to reveal the override key.";
    }
    
    hintTextEl.innerHTML = hint;
    modal.classList.remove('hidden');
}
window.showChamberHint = showChamberHint;

function closeChamberHint() {
    playClickSound();
    const modal = document.getElementById('hintModal');
    if (modal) modal.classList.add('hidden');
}
window.closeChamberHint = closeChamberHint;
