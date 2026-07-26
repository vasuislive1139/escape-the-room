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

## ✨ Features & The 4 Official Activities
The competition centers around four progressive, code-centric escape room challenges:
1. 🔍 **Activity 1: Digital Scavenger Hunt**
   - Teams analyze a target codebase or file hierarchy to solve specific exploration tasks:
     - Find the oldest file in the project directory.
     - Identify the file with the most module imports.
     - Locate the component or function with the longest name.
2. 🧩 **Activity 2: Component Crossword**
   - An interactive technical crossword puzzle where clues are based on React/web component names, props, lifecycle methods, or filenames.
   - Solving the entire crossword grid reveals the secret coordinates of the next challenge location!
3. 🔐 **Activity 3: Cipher Chase**
   - A progressive cryptographic trail where every clue is encrypted using Caesar Ciphers (Caipher) and custom shift algorithms.
   - Teams must decrypt each clue sequentially using custom scripts or our built-in interactive decryptor to advance.
4. 📱 **Activity 4: QR Chain Challenge**
   - A multi-stage QR scavenger challenge with two play modes:
     - **Fragment Mode**: Collect distributed pieces of a broken QR code across the project to assemble the final master QR.
     - **Chain Mode**: Each scanned QR code reveals the secret location of the next hidden QR code until the final vault is unlocked!

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
├── activity1.html      # Activity 1: Digital Scavenger Hunt
├── activity2.html      # Activity 2: Component Crossword
├── activity3.html      # Activity 3: Cipher Chase
├── activity4.html      # Activity 4: QR Chain Challenge
├── styles.css          # Core Design System, Animations & Theme Styling
│
└── js/
    ├── main.js         # Countdown Timer, Navigation & Registration Modal
    ├── game.js         # Interactive Teaser Mini-Game ("The Hacker's Vault")
    └── audio.js        # Web Audio API Sound Synthesizer
```

---

## 🛠 Next Steps for Activity Development
Each activity page (`activity1.html` through `activity4.html`) contains a dedicated interactive preview and sandbox container. As your event development progresses, you can plug your actual competition codebases, crossword grids, and QR tokens directly into these page slots!
