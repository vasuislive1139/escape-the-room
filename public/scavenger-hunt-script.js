/**
 * DIGITAL SCAVENGER HUNT (STAGE 1) ENGINE
 * Handles File Explorer, Clue Logic, Timer, and GM Sync.
 */

const PLAYER_GM_CHANNEL = 'escape_gm_channel';
let playerBroadcastChannel = null;
try {
    playerBroadcastChannel = new BroadcastChannel(PLAYER_GM_CHANNEL);
} catch (e) {
    console.warn("BroadcastChannel not supported.");
}

// Global State
let activeTeamName = "TEAM-ALPHA";
let currentClueIndex = 0;
let score = 0;
let hintsLeft = 3;
let timeRemaining = 10 * 60; // 10 minutes in seconds
let timerInterval = null;
let typingTimeout = null;

// The Clues
const CLUES = [
    {
        title: "CLUE #1: Initial Breach",
        text: "The system logs show a file created before all others. Find the oldest file in the project workspace to understand our starting point.",
        answer: "README.md",
        points: 10,
        hint: "Look at the root level of the project. It's usually the first file created in any repository."
    },
    {
        title: "CLUE #2: The Behemoth",
        text: "To infiltrate the network, we need to locate the largest surface area. Which component has the longest file name?",
        answer: "NotificationManagementSystem.jsx",
        points: 10,
        hint: "Check inside the src/components folder."
    },
    {
        title: "CLUE #3: Dependency Overload",
        text: "One of the files relies heavily on external libraries. Which file contains the most import statements?",
        answer: "UserDashboardComponent.jsx",
        points: 15,
        hint: "Open the files in src/components and count the 'import' lines at the top."
    },
    {
        title: "CLUE #4: The Developer's Secret",
        text: "Careless developers often leave sensitive information behind in comments. Find the hidden code left inside a developer comment.",
        answer: "H4CK3R",
        points: 20,
        hint: "Check the authentication-related files, perhaps in src/pages."
    },
    {
        title: "CLUE #5: Visual Evidence",
        text: "A physical key was digitized and hidden in plain sight. Find the image file that contains the hidden key.",
        answer: "hidden_key_image.png",
        points: 15,
        hint: "Look inside the assets directory."
    },
    {
        title: "FINAL CLUE: The Override",
        text: "Combine your knowledge. In the config file, there is a reference to a final escape key for the year 2026. What is the final escape key?",
        answer: "ESCAPE2026",
        points: 30,
        hint: "Check src/utils/config.js for the system override constants."
    }
];

// The Virtual File System (Hardcoded for simulation)
const FILE_SYSTEM = {
    name: "project",
    type: "folder",
    children: [
        {
            name: "src",
            type: "folder",
            children: [
                {
                    name: "components",
                    type: "folder",
                    children: [
                        { name: "Navigation.jsx", type: "file", content: "import React from 'react';\nimport { Link } from 'react-router-dom';\n\nexport const Navigation = () => {\n  return <nav>...</nav>;\n};" },
                        { name: "UserDashboardComponent.jsx", type: "file", content: "import React, { useState, useEffect } from 'react';\nimport { useSelector, useDispatch } from 'react-redux';\nimport { fetchUserData } from '../utils/helpers';\nimport { Card, Button, Avatar } from 'ui-library';\nimport { BarChart } from 'charts';\nimport axios from 'axios';\n\n// Dashboard implementation\nexport const UserDashboardComponent = () => {\n  return <div>Dashboard</div>;\n};" },
                        { name: "Footer.jsx", type: "file", content: "import React from 'react';\n\nexport const Footer = () => <footer>© 2026 System</footer>;" },
                        { name: "NotificationManagementSystem.jsx", type: "file", content: "import React from 'react';\n\nexport const NotificationManagementSystem = () => {\n  // Handles global alerts\n  return <div>No new notifications</div>;\n};" }
                    ]
                },
                {
                    name: "pages",
                    type: "folder",
                    children: [
                        { name: "Home.jsx", type: "file", content: "import React from 'react';\nimport { Navigation } from '../components/Navigation';\n\nexport const Home = () => <Navigation />;" },
                        { name: "Login.jsx", type: "file", content: "import React from 'react';\n\nexport const Login = () => {\n  // TODO: Remove hardcoded admin bypass before production!\n  // Secret Code: H4CK3R\n  return <form>Login Form</form>;\n};" },
                        { name: "Profile.jsx", type: "file", content: "import React from 'react';\n\nexport const Profile = () => <div>User Profile</div>;" }
                    ]
                },
                {
                    name: "utils",
                    type: "folder",
                    children: [
                        { name: "helpers.js", type: "file", content: "export const formatDate = (date) => {\n  return new Date(date).toLocaleDateString();\n};" },
                        { name: "config.js", type: "file", content: "export const CONFIG = {\n  API_URL: 'https://api.system.local',\n  TIMEOUT: 5000,\n  MAX_RETRIES: 3,\n  SYSTEM_OVERRIDE_KEY: 'ESCAPE2026' // Required for manual subsystem restart\n};" }
                    ]
                }
            ]
        },
        {
            name: "assets",
            type: "folder",
            children: [
                { name: "logo.png", type: "image", content: "logo" },
                { name: "hidden_key_image.png", type: "image", content: "key" },
                { name: "background.jpg", type: "image", content: "bg" }
            ]
        },
        { name: "README.md", type: "file", content: "# System Project\n\nInitial commit: Jan 1, 2020 (Oldest file in repository)\n\nSetup instructions:\n1. npm install\n2. npm start" },
        { name: "package.json", type: "file", content: "{\n  \"name\": \"system-project\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {\n    \"react\": \"^18.2.0\"\n  }\n}" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initMatrixCanvas();
    setupUIEvents();
    buildFileTree(FILE_SYSTEM.children, document.getElementById('fileTree'), 0);
    if (typeof initStageTimer === 'function') initStageTimer(2);
});

// --- Auth & Setup ---
function initAuth() {
    activeTeamName = localStorage.getItem('escape_team_id');
    if (!activeTeamName) {
        alert("Session expired! Please login first.");
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('navTeamId').textContent = activeTeamName;
    
    // Resume from localStorage if available
    const savedScore = localStorage.getItem('sh_score');
    if (savedScore) score = parseInt(savedScore, 10);
    
    const savedClue = localStorage.getItem('sh_clue_index');
    if (savedClue) currentClueIndex = parseInt(savedClue, 10);
    
    const savedHints = localStorage.getItem('sh_hints');
    if (savedHints) hintsLeft = parseInt(savedHints, 10);
    
    const savedTime = localStorage.getItem('sh_time');
    if (savedTime) timeRemaining = parseInt(savedTime, 10);
    
    updateTrackerUI();
    
    // If already completed
    if (currentClueIndex >= CLUES.length) {
        showCompletionScreen();
    }
}

function setupUIEvents() {
    document.getElementById('rulesBtn').addEventListener('click', () => {
        document.getElementById('rulesModal').classList.remove('hidden');
    });
    
    document.getElementById('closeRulesBtn').addEventListener('click', () => {
        document.getElementById('rulesModal').classList.add('hidden');
    });
    
    window.onStageStart = function() {
        document.getElementById('heroSection').classList.add('hidden');
        document.getElementById('workspaceSection').classList.remove('hidden');
        loadClue(currentClueIndex);
    };
    
    document.getElementById('submitAnswerBtn').addEventListener('click', handleAnswerSubmit);
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnswerSubmit();
    });
    
    document.getElementById('hintBtn').addEventListener('click', handleHintRequest);
}

// --- File Explorer Logic ---
function buildFileTree(nodes, parentElement, depth) {
    nodes.forEach(node => {
        const itemWrap = document.createElement('div');
        
        const itemRow = document.createElement('div');
        itemRow.className = 'ft-item';
        itemRow.style.paddingLeft = `${15 + (depth * 15)}px`;
        
        const icon = document.createElement('span');
        icon.className = 'ft-icon';
        icon.textContent = node.type === 'folder' ? '📁' : (node.type === 'image' ? '🖼️' : '📄');
        
        const text = document.createElement('span');
        text.textContent = node.name;
        
        itemRow.appendChild(icon);
        itemRow.appendChild(text);
        itemWrap.appendChild(itemRow);
        
        if (node.type === 'folder') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'ft-folder-content';
            buildFileTree(node.children, childrenContainer, depth + 1);
            itemWrap.appendChild(childrenContainer);
            
            itemRow.addEventListener('click', () => {
                const isOpen = childrenContainer.classList.contains('open');
                childrenContainer.classList.toggle('open');
                icon.textContent = isOpen ? '📁' : '📂';
                playSound('beep');
            });
        } else {
            itemRow.addEventListener('click', () => {
                document.querySelectorAll('.ft-item').forEach(el => el.classList.remove('active'));
                itemRow.classList.add('active');
                openFile(node);
                playSound('type');
            });
        }
        
        parentElement.appendChild(itemWrap);
    });
}

function openFile(node) {
    const editorTab = document.getElementById('editorTab');
    const editorContent = document.getElementById('editorContent');
    
    editorTab.textContent = node.name;
    editorContent.innerHTML = '';
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (node.type === 'image') {
        editorContent.innerHTML = `<div class="image-viewer">
            <div style="text-align:center; color: #8b949e;">
                <p>[Image Viewer Initialized]</p>
                <div style="border: 1px dashed #30363d; padding: 50px; margin-top: 20px; font-size: 2rem;">
                    [ ${node.name} ]<br>
                    <span style="font-size:1rem;">(Simulated Image Data)</span>
                </div>
            </div>
        </div>`;
    } else {
        // Typing animation for code
        let i = 0;
        const speed = 10;
        const text = node.content;
        
        function typeWriter() {
            if (i < text.length) {
                let char = text.charAt(i);
                if (char === '\n') {
                    editorContent.appendChild(document.createElement('br'));
                } else {
                    const span = document.createElement('span');
                    span.textContent = char;
                    editorContent.appendChild(span);
                }
                i++;
                typingTimeout = setTimeout(typeWriter, speed);
            } else {
                // Apply syntax highlighting once typing finishes
                applySyntaxHighlighting(editorContent, text);
            }
        }
        typeWriter();
    }
}

function applySyntaxHighlighting(container, text) {
    // Very basic simulated syntax highlighting for effect
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Keywords
    const keywords = ['import', 'from', 'export', 'const', 'return'];
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        html = html.replace(regex, `<span class="sh-keyword">${kw}</span>`);
    });
    
    // Strings
    html = html.replace(/('[^']*'|"[^"]*")/g, '<span class="sh-string">$1</span>');
    
    // Comments
    html = html.replace(/(\/\/.*)/g, '<span class="sh-comment">$1</span>');
    
    // Secret highlight trick (so it looks cool)
    html = html.replace(/H4CK3R/g, '<span class="sh-secret">H4CK3R</span>');
    
    container.innerHTML = html.replace(/\n/g, '<br>');
}

// --- Clue & Game Logic ---
function loadClue(index) {
    if (index >= CLUES.length) {
        completeStage();
        return;
    }
    const clue = CLUES[index];
    document.getElementById('clueTitle').textContent = clue.title;
    document.getElementById('clueText').textContent = clue.text;
    document.getElementById('answerInput').value = '';
    
    const feedback = document.getElementById('feedbackMsg');
    feedback.textContent = '';
    feedback.className = 'feedback-msg';
    
    document.getElementById('hintText').classList.add('hidden');
    document.getElementById('hintText').textContent = '';
    
    updateTrackerUI();
}

function handleAnswerSubmit() {
    const input = document.getElementById('answerInput').value.trim();
    const feedback = document.getElementById('feedbackMsg');
    
    if (!input) return;
    
    const currentClue = CLUES[currentClueIndex];
    
    if (input.toLowerCase() === currentClue.answer.toLowerCase()) {
        playSound('success');
        feedback.textContent = `CORRECT! +${currentClue.points} pts`;
        feedback.className = 'feedback-msg success';
        
        score += currentClue.points;
        currentClueIndex++;
        
        saveState();
        updateTrackerUI();
        
        document.getElementById('answerInput').disabled = true;
        document.getElementById('submitAnswerBtn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('answerInput').disabled = false;
            document.getElementById('submitAnswerBtn').disabled = false;
            loadClue(currentClueIndex);
        }, 1500);
        
    } else {
        playSound('error');
        feedback.textContent = "INCORRECT DIRECTIVE. -2 pts";
        feedback.className = 'feedback-msg error';
        score = Math.max(0, score - 2);
        saveState();
        updateTrackerUI();
        
        // Shake input
        const inputEl = document.getElementById('answerInput');
        inputEl.style.transform = 'translateX(5px)';
        setTimeout(() => inputEl.style.transform = 'translateX(-5px)', 100);
        setTimeout(() => inputEl.style.transform = 'translateX(5px)', 200);
        setTimeout(() => inputEl.style.transform = 'translateX(0)', 300);
    }
}

function handleHintRequest() {
    if (hintsLeft > 0) {
        hintsLeft--;
        score = Math.max(0, score - 5);
        
        const hintEl = document.getElementById('hintText');
        hintEl.textContent = `HINT: ${CLUES[currentClueIndex].hint}`;
        hintEl.classList.remove('hidden');
        
        saveState();
        updateTrackerUI();
        playSound('beep');
    }
}

function saveState() {
    localStorage.setItem('sh_score', score);
    localStorage.setItem('sh_clue_index', currentClueIndex);
    localStorage.setItem('sh_hints', hintsLeft);
    localStorage.setItem('sh_stage', currentFileStage);
    const tr = (typeof currentStageTimeLeft !== 'undefined') ? currentStageTimeLeft : 600;
    localStorage.setItem('sh_time', tr);
}

function updateTrackerUI() {
    document.getElementById('scoreDisplay').textContent = score.toString().padStart(3, '0');
    document.getElementById('clueProgressText').textContent = `${currentClueIndex} / ${CLUES.length}`;
    
    const pct = (currentClueIndex / CLUES.length) * 100;
    document.getElementById('clueProgressBar').style.width = `${pct}%`;
    
    document.getElementById('hintsLeft').textContent = hintsLeft;
    const hintBtn = document.getElementById('hintBtn');
    if (hintsLeft <= 0 || !document.getElementById('hintText').classList.contains('hidden')) {
        hintBtn.disabled = true;
        hintBtn.style.opacity = 0.5;
    } else {
        hintBtn.disabled = false;
        hintBtn.style.opacity = 1;
    }
}

// Timer logic handled by global timer-logic.js
// --- Completion ---
function completeStage() {
    if (typeof stopTimer === 'function') stopTimer();
    
    // Bonus for time
    const timeRemaining = (typeof currentStageTimeLeft !== 'undefined') ? currentStageTimeLeft : 0;
    const timeBonus = Math.floor(timeRemaining / 60) * 2; 
    const completionBonus = 20;
    score += completionBonus + timeBonus;
    saveState();
    
    let timeTaken = 0;
    if (typeof window.getTimeTaken === 'function') {
        timeTaken = window.getTimeTaken();
    }
    
    const m = Math.floor(timeTaken / 60).toString().padStart(2, '0');
    const s = (timeTaken % 60).toString().padStart(2, '0');
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalTime').textContent = `${m}:${s} taken`;
    
    document.getElementById('workspaceSection').classList.add('hidden');
    document.getElementById('completionOverlay').classList.remove('hidden');
    playSound('success');
    
    // Save progression locally for UI
    localStorage.setItem('escape_unlocked_level', '3');
    
    if (typeof window.completeStage === 'function') {
        window.completeStage(3, score, 'Scavenger Hunt Complete');
    }
}

// --- Utilities (Matrix & Audio) ---
function initMatrixCanvas() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = '0123456789ABCDEF{}[]/\\!@#$%^&*'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let x = 0; x < columns; x++) drops[x] = 1;
    
    function draw() {
        ctx.fillStyle = 'rgba(5, 10, 15, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00f0ff';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 33);
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioMuted = true;
function playSound(type) {
    if (audioMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random()*200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'success') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

document.getElementById('audioToggleBtn')?.addEventListener('click', (e) => {
    audioMuted = !audioMuted;
    const btn = e.currentTarget;
    if (audioMuted) {
        btn.classList.remove('active');
        btn.querySelector('.audio-label').textContent = '🔇 Audio';
    } else {
        btn.classList.add('active');
        btn.querySelector('.audio-label').textContent = '🔊 Audio';
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playSound('beep');
    }
});
