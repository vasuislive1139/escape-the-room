/* ==========================================================================
   TECH TATVA: ESCAPE THE ROOM ("HACK THE HACKER")
   Interactive Teaser Game Module ("The Hacker's Treasure Vault")
   ========================================================================== */

class TeaserGame {
  constructor() {
    this.currentStage = 1;
    
    // Stage 1: Compass Lock State
    this.compassAngle = 0;
    this.compassHistory = [0]; // Starts at North (0)
    this.targetSequence = [0, 90, 180, 270, 0]; // N -> E -> S -> W -> N
    
    // Stage 2: Terminal State
    this.terminalUnlocked = false;

    this.initListeners();
  }

  initListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Stage 1: Compass Click
      const compass = document.getElementById('compassDial');
      if (compass) {
        compass.addEventListener('click', () => this.rotateCompass());
      }

      // Stage 2: Terminal Input
      const termInput = document.getElementById('terminalInput');
      if (termInput) {
        termInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.handleTerminalCommand(termInput.value.trim());
            termInput.value = '';
          }
        });
      }

      // Stage 3: Chest Click
      const chest = document.getElementById('chestIcon');
      if (chest) {
        chest.addEventListener('click', () => this.unlockChest());
      }
    });
  }

  // Switch between stages
  goToStage(stageNum) {
    if (window.soundSystem) window.soundSystem.playClick();
    
    // Hide all panels
    document.querySelectorAll('.stage-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    // Show target stage panel
    const targetPanel = document.getElementById(`stagePanel${stageNum}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Update progress indicators
    document.querySelectorAll('.step-indicator').forEach((ind, idx) => {
      if (idx + 1 < stageNum) {
        ind.classList.remove('active');
        ind.classList.add('completed');
        ind.innerHTML = '✔';
      } else if (idx + 1 === stageNum) {
        ind.classList.add('active');
        ind.classList.remove('completed');
        ind.innerHTML = `${stageNum}`;
      } else {
        ind.classList.remove('active', 'completed');
        ind.innerHTML = `${idx + 1}`;
      }
    });

    this.currentStage = stageNum;
  }

  /* --- STAGE 1: COMPASS LOCK --- */
  rotateCompass() {
    if (window.soundSystem) window.soundSystem.playClick();
    const compass = document.getElementById('compassDial');
    const statusText = document.getElementById('compassStatus');
    
    this.compassAngle = (this.compassAngle + 90) % 360;
    if (compass) {
      compass.style.transform = `rotate(${this.compassAngle}deg)`;
    }

    this.compassHistory.push(this.compassAngle);
    
    // Check if matching sequence so far
    const currentStep = this.compassHistory.length - 1;
    const targetStepVal = this.targetSequence[currentStep];

    if (this.compassAngle !== targetStepVal) {
      // Wrong rotation! Reset
      if (window.soundSystem) window.soundSystem.playError();
      if (statusText) {
        statusText.style.color = '#8b0000';
        statusText.textContent = "⚠️ Incorrect direction! Alignment sequence reset.";
      }
      setTimeout(() => {
        this.compassAngle = 0;
        this.compassHistory = [0];
        if (compass) compass.style.transform = `rotate(0deg)`;
        if (statusText) {
          statusText.style.color = 'var(--wood-dark)';
          statusText.textContent = "Sequence: North -> East -> South -> West -> North";
        }
      }, 1000);
      return;
    }

    // Right direction!
    if (statusText) {
      statusText.style.color = '#2b1d0c';
      const dirName = {0: 'North', 90: 'East', 180: 'South', 270: 'West'}[this.compassAngle];
      statusText.textContent = `🎯 Locked onto ${dirName} (${currentStep}/4 steps aligned)...`;
    }

    if (currentStep === 4) {
      // Complete!
      if (window.soundSystem) window.soundSystem.playUnlock();
      if (statusText) {
        statusText.style.color = '#006600';
        statusText.innerHTML = "✨ <strong>COMPASS ALIGNED! Unlocking Hacker Terminal...</strong>";
      }
      setTimeout(() => {
        this.goToStage(2);
      }, 1200);
    }
  }

  /* --- STAGE 2: HACKER TERMINAL --- */
  handleTerminalCommand(cmd) {
    if (window.soundSystem) window.soundSystem.playBeep(600, 0.08);
    const output = document.getElementById('terminalOutput');
    if (!output) return;

    const cleanCmd = cmd.toLowerCase();
    let response = `\n> ${cmd}\n`;

    if (cleanCmd === 'help') {
      response += "AVAILABLE COMMANDS:\n  scan          - Scan local ports & encrypted data streams\n  cat logs.txt  - Read archive log files\n  override <key>- Execute security protocol override\n  clear         - Clear terminal display";
    } else if (cleanCmd === 'scan') {
      response += "Scanning encrypted streams... [DONE]\nFound hidden file in root directory: 'logs.txt'\nHint: Use 'cat logs.txt' to inspect contents.";
    } else if (cleanCmd === 'cat logs.txt' || cleanCmd === 'cat logs') {
      response += "=== ARCHIVE LOG: 26-JUL-2026 ===\n[HACKER NOTE]: The firewall passkey is set to our event name and year.\nTo bypass security, run: override TATVA2026";
    } else if (cleanCmd === 'clear') {
      output.textContent = "CU CYBER-OS v3.14 [FIREWALL ACTIVE]\nType 'help' for available commands.\n";
      return;
    } else if (cleanCmd.startsWith('override ')) {
      const key = cleanCmd.replace('override ', '').trim();
      if (key === 'tatva2026') {
        if (window.soundSystem) window.soundSystem.playUnlock();
        response += "\n[✔] PASSKEY ACCEPTED! FIREWALL OVERRIDDEN.\n[✔] SECURITY DOORS UNLOCKED.\n[✔] ACCESSING TREASURE VAULT...\n";
        output.textContent += response;
        output.scrollTop = output.scrollHeight;
        setTimeout(() => {
          this.goToStage(3);
        }, 1500);
        return;
      } else {
        if (window.soundSystem) window.soundSystem.playError();
        response += "[✖] ACCESS DENIED: Invalid override key.";
      }
    } else if (cleanCmd === '') {
      return;
    } else {
      if (window.soundSystem) window.soundSystem.playError();
      response += `Command not recognized: '${cmd}'. Type 'help' for instructions.`;
    }

    output.textContent += response;
    output.scrollTop = output.scrollHeight;
  }

  /* --- STAGE 3: TREASURE CHEST --- */
  unlockChest() {
    const chestIcon = document.getElementById('chestIcon');
    const rewardBox = document.getElementById('rewardCodeBox');
    const chestStatus = document.getElementById('chestStatusText');

    if (chestIcon && !chestIcon.classList.contains('unlocked')) {
      if (window.soundSystem) window.soundSystem.playUnlock();
      chestIcon.classList.add('unlocked');
      chestIcon.innerHTML = '🎁';
      if (chestStatus) {
        chestStatus.textContent = "🎉 CONGRATULATIONS! YOU HAVE HACKED THE VAULT!";
      }
      if (rewardBox) {
        rewardBox.style.display = 'block';
      }
    }
  }
}

// Global instance
window.teaserGame = new TeaserGame();
