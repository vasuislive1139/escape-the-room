# Tech Tatva: Escape The Room ("Hack The Hacker")
**Apex Institute of Technology, Chandigarh University**

An interactive, responsive event website and teaser puzzle experience for the flagship **Tech Tatva 2026** event: **Escape The Room - Hack The Hacker Before Time Runs Out**.

---

## 🧭 Event Overview
- **Event Name**: Escape The Room: Hack The Hacker
- **Date**: 4 August 2026
- **Time**: 9:30 AM to 4:30 PM
- **Venue**: Apex Institute of Technology, Chandigarh University
- **Theme**: A fusion of Ancient Treasure Hunt & Steampunk Exploration with Modern Cybersecurity & Hacker Challenges.

---

## ✨ Features
1. **Parchment & Cyberpunk Aesthetics**: Custom UI styled after aged parchment paper, antique gold frames, compasses, and neon cyber terminals.
2. **Live Countdown Timer**: Real-time countdown to August 4, 2026, 9:30 AM.
3. **Interactive Teaser Game ("The Hacker's Treasure Vault")**: An embedded 3-stage mini-game on the homepage allowing students to solve a compass lock, hack a terminal, and unlock a virtual treasure chest for a secret event bonus code!
4. **4 Dedicated Activity Slots**: Ready-to-build page slots for the four flagship activities:
   - 🧩 **Activity 1**: The Cryptic Cipher (Logic & Pattern Decoding)
   - 📜 **Activity 2**: The Digital Treasure Map (Campus & Vault Navigation)
   - 💻 **Activity 3**: Cyber Firewall Breach (Terminal Hacking & Security Override)
   - 🏆 **Activity 4**: The Master Vault Escape (Final Collaborative Challenge)
5. **Interactive Registration Form**: Dynamic student registration generating a downloadable/printable "Treasure Pass".
6. **Web Audio API Sound Effects**: Synthesized ambient sound effects without relying on external audio files.

---

## 🚀 Getting Started
To run the website locally:
1. Open `index.html` directly in any modern web browser (Chrome, Firefox, Safari, Edge).
2. Or use a local development server such as VS Code Live Server or Python:
   ```bash
   python3 -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your browser.

---

## 📁 File Structure
```
Escape The Room/
│
├── index.html          # Main Event Website & Portal
├── activity1.html      # Activity Slot 1: The Cryptic Cipher
├── activity2.html      # Activity Slot 2: The Digital Treasure Map
├── activity3.html      # Activity Slot 3: Cyber Firewall Breach
├── activity4.html      # Activity Slot 4: The Master Vault Escape
├── styles.css          # Core Design System, Animations & Theme Styling
│
└── js/
    ├── main.js         # Countdown Timer, Navigation & Registration Modal
    ├── game.js         # Interactive Teaser Mini-Game ("The Hacker's Vault")
    └── audio.js        # Web Audio API Sound Synthesizer
```

---

## 🛠 Next Steps for Activity Development
Each activity page (`activity1.html` through `activity4.html`) contains a modular slot template with consistent navigation, header, and footer styling. As you build out the custom challenges for each activity, modify the respective slot container inside those files!
