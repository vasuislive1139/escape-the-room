/* ==========================================================================
   TECH TATVA: ESCAPE THE ROOM ("HACK THE HACKER")
   Main Controller (Countdown Timer, Navigation, Registration Modal)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initNavigation();
  initRegistrationForm();
});

/* --- COUNTDOWN TIMER --- */
function initCountdown() {
  // Target Date: 4 August 2026, 09:30 AM IST (or local time)
  const targetDate = new Date('August 4, 2026 09:30:00').getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('timerDays').textContent = '00';
      document.getElementById('timerHours').textContent = '00';
      document.getElementById('timerMins').textContent = '00';
      document.getElementById('timerSecs').textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const elDays = document.getElementById('timerDays');
    const elHours = document.getElementById('timerHours');
    const elMins = document.getElementById('timerMins');
    const elSecs = document.getElementById('timerSecs');

    if (elDays) elDays.textContent = String(days).padStart(2, '0');
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMins) elMins.textContent = String(minutes).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* --- NAVIGATION & MOBILE MENU --- */
function initNavigation() {
  const hamburger = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      if (window.soundSystem) window.soundSystem.playClick();
    });
  }

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          if (navLinks) navLinks.classList.remove('active');
          if (window.soundSystem) window.soundSystem.playClick();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

/* --- REGISTRATION FORM HANDLER --- */
function initRegistrationForm() {
  const form = document.getElementById('regForm');
  const modal = document.getElementById('passModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const printBtn = document.getElementById('printPassBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const teamName = document.getElementById('teamName').value.trim();
      const captainName = document.getElementById('captainName').value.trim();
      const uidBranch = document.getElementById('uidBranch').value.trim();
      const contactPhone = document.getElementById('contactPhone').value.trim();
      const category = document.getElementById('partCategory').value;

      if (!teamName || !captainName || !uidBranch || !contactPhone) {
        alert("Please fill in all required fields!");
        if (window.soundSystem) window.soundSystem.playError();
        return;
      }

      if (window.soundSystem) window.soundSystem.playUnlock();

      // Generate random VIP Pass ID
      const passId = "CU-TT26-" + Math.floor(100000 + Math.random() * 900000);

      // Populate Modal
      document.getElementById('passTeamDisplay').textContent = teamName;
      document.getElementById('passCaptainDisplay').textContent = captainName;
      document.getElementById('passUidDisplay').textContent = uidBranch;
      document.getElementById('passCategoryDisplay').textContent = category;
      document.getElementById('passIdDisplay').textContent = passId;

      if (modal) {
        modal.classList.add('active');
      }
      form.reset();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      if (window.soundSystem) window.soundSystem.playClick();
      modal.classList.remove('active');
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      if (window.soundSystem) window.soundSystem.playClick();
      window.print();
    });
  }
}
