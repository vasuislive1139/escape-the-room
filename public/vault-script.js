const toast = document.getElementById('toast');
let toastTimer;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initStageTimer === 'function') {
        initStageTimer(4);
    }
});

let unlockedIndex = parseInt(localStorage.getItem('streamwave_qr_progress')) || 1;

// --- QR RANDOMIZATION LOGIC ---
const LOCATION_NAMES = {
    1: "Action category",
    2: "Live sports section",
    3: "Binge-worthy series section",
    4: "Horror category",
    5: "Tokyo Signal movie card in Stories from around the world",
    6: "Moon and Me movie card in Kids and family favourites"
};

let qrSequence = JSON.parse(localStorage.getItem('streamwave_qr_sequence'));
if (!qrSequence) {
    qrSequence = [1, 2, 3, 4, 5, 6];
    // Fisher-Yates shuffle
    for (let i = qrSequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qrSequence[i], qrSequence[j]] = [qrSequence[j], qrSequence[i]];
    }
    localStorage.setItem('streamwave_qr_sequence', JSON.stringify(qrSequence));
}

// Populate the DOM with the randomized sequence
qrSequence.forEach((locId, zeroBasedIndex) => {
    const qrIndex = zeroBasedIndex + 1; // 1 to 6
    const el = document.querySelector(`.secret-qr-spot[data-loc-id="${locId}"]`);
    if (el) {
        el.setAttribute('data-qr-index', qrIndex);
        
        const img = el.querySelector('img');
        if (qrIndex === 6) {
            el.setAttribute('data-qr', 'QR 6: Winner!');
            if (img) img.src = "https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=" + encodeURIComponent("Congratulations! You're the winner!");
        } else {
            const nextLocId = qrSequence[qrIndex]; // qrSequence is 0-indexed, so index qrIndex is the next item
            const nextLocName = LOCATION_NAMES[nextLocId];
            el.setAttribute('data-qr', `QR ${qrIndex}: Found clue!`);
            if (img) img.src = "https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=" + encodeURIComponent(`LOCATION OF QR ${qrIndex+1}: ${nextLocName}`);
        }
    }
});
// ------------------------------

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateQrVisibility() {
  document.querySelectorAll('.secret-qr-spot').forEach(el => {
    if (!el.hasAttribute('data-qr-index')) return;
    const idx = parseInt(el.getAttribute('data-qr-index'));
    if (idx <= unlockedIndex) {
      el.classList.remove('qr-locked');
    } else {
      el.classList.add('qr-locked');
    }
  });
}

// Initial visibility setup
updateQrVisibility();

document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
  document.querySelector('.chip.selected').classList.remove('selected');
  chip.classList.add('selected');
  notify(`${chip.textContent} picks loaded`);
}));

document.querySelectorAll('.category-card').forEach(category => category.addEventListener('click', event => {
  if (category.dataset.qr) {
    const index = parseInt(category.getAttribute('data-qr-index'));
    if (index <= unlockedIndex) {
      const bounds = category.getBoundingClientRect();
      const insideSecretCorner = event.clientX > bounds.right - 52 && event.clientY < bounds.top + 55;
      if (insideSecretCorner) {
        openQr(category.dataset.qr, category.querySelector('.qr-mini').src, index);
        return;
      }
    }
  }
  notify(`${category.dataset.category} collection loaded`);
}));

document.querySelectorAll('.poster').forEach(card => card.addEventListener('click', () => {
  const title = card.querySelector('.card-title, .sport-info b')?.textContent || 'live stream';
  notify(`Opening ${title}...`);
}));

document.getElementById('playHero').addEventListener('click', () => notify('Starting The Last Lighthouse...'));
document.querySelector('.circle-button').addEventListener('click', () => notify('Added to My List'));

const panel = document.getElementById('searchPanel');
const input = document.getElementById('searchInput');
document.getElementById('searchButton').addEventListener('click', () => {
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  setTimeout(() => input.focus(), 50);
});
document.getElementById('closeSearch').addEventListener('click', closeSearch);
function closeSearch() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

const qrModal = document.getElementById('qrModal');
const qrTitle = document.getElementById('qrTitle');
const qrLarge = document.getElementById('qrLarge');
const qrHint = document.getElementById('qrHint');
function openQr(title, src, index) {
  qrTitle.textContent = title;
  qrLarge.src = src.replace('size=110x110', 'size=300x300');
  qrHint.textContent = 'Scan this code with your phone camera to reveal the next clue.';
  qrModal.classList.add('open');
  qrModal.setAttribute('aria-hidden', 'false');

  if (index === unlockedIndex && unlockedIndex < 6) {
    unlockedIndex++;
    localStorage.setItem('streamwave_qr_progress', unlockedIndex);
    updateQrVisibility();
    notify("Next clue unlocked!");
  } else if (index === 6) {
    let timeTakenStr = "";
    if (typeof window.getTimeTaken === 'function') {
        const t = window.getTimeTaken();
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        timeTakenStr = ` (Time: ${m}:${s})`;
    }
    notify("Congratulations! You completed the hunt! 🎉" + timeTakenStr);
    
    // ESCAPE THE ROOM INTEGRATION
    const curLvl = parseInt(localStorage.getItem('escape_unlocked_level')) || 1;
    if (curLvl < 5) {
        localStorage.setItem('escape_unlocked_level', 5); // 5 = fully completed
        if (typeof window.completeStage === 'function') {
            window.completeStage(5, 1000, 'StreamWave Vault Completed (Game Beaten!)');
        }
    }
  }
}
function closeQr() {
  qrModal.classList.remove('open');
  qrModal.setAttribute('aria-hidden', 'true');
}
document.querySelectorAll('.section-qr').forEach(button => button.addEventListener('click', () => {
  const index = parseInt(button.getAttribute('data-qr-index'));
  if (index <= unlockedIndex) {
    openQr(button.dataset.qr, button.querySelector('img').src, index);
  }
}));
document.querySelectorAll('.poster-qr').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  const index = parseInt(button.getAttribute('data-qr-index'));
  if (index <= unlockedIndex) {
    openQr(button.dataset.qr, button.querySelector('img').src, index);
  }
}));
document.getElementById('closeQr').addEventListener('click', closeQr);
qrModal.addEventListener('click', event => {
  if (event.target === qrModal) closeQr();
});

document.querySelector('.profile').addEventListener('click', () => {
  if (confirm("Reset the scavenger hunt progress and randomize locations?")) {
    unlockedIndex = 1;
    localStorage.removeItem('streamwave_qr_progress');
    localStorage.removeItem('streamwave_qr_sequence');
    location.reload();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeSearch();
    closeQr();
  }
  if (event.key === 'Enter' && document.activeElement === input && input.value.trim()) {
    notify(`Searching for ${input.value.trim()}`);
    closeSearch();
  }
});