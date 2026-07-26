# 🏰 Escape The Room — Cyber Enigma: Game Master Command Center & Live Platform

An immersive, high-stakes interactive Escape Room web application tailored for tech symposiums, coding competitions, and live student events. Featuring a state-of-the-art **Game Master Nexus Command Center** for event organizers and judges to monitor, synchronize, broadcast, and control all participating teams in real-time.

---

## ⚡ Key Features

### 🎮 For Players & Teams (`index.html` & `home.html`)
- **Cinematic Entrance & Auth (`index.html`)**: Rich visual aesthetics with ember particle animations, ambient soundscapes, and team password authentication.
- **4-Stage Challenge Progression**:
  - **Chamber 01: Cyber Enigma (Binary/Ascii Vault)**
  - **Chamber 02: Cryptic Corridor (Hex/Base64 Logic)**
  - **Chamber 03: Logic Labyrinth (Algorithmic Puzzle)**
  - **Chamber 04: The Core Sanctuary (Final Master Key)**
- **Real-Time Stage Syncing**: Multi-tab synchronization and live status checking. When a Game Master promotes, demotes, or sends an alert, player viewports update instantly without requiring page refreshes.
- **Dynamic Responsive UI**: Fluid grid layouts, high-contrast glow aesthetics, and mobile/desktop responsive design.

### 🛡️ For Judges & Organizers (`admin.html`)
- **Game Master Nexus Dashboard**: A restricted, high-contrast command dashboard designed with zero overlay interference for maximum visibility.
- **300ms Real-Time Synchronization**: Multi-layer communication engine utilizing `BroadcastChannel` and `localStorage` state polling to transmit live updates instantly across all active browser windows.
- **Instant Team Control & Roster Management**:
  - **Live Stage Jumping**: Instantly promote (+1), demote (-1), or directly teleport any team to Stage 1, 2, 3, or 4.
  - **Global & Target Broadcasts**: Transmit live pop-up alerts, hints, and warnings directly onto player screens.
  - **VIP Access & Lockdowns**: Grant Stage 4 All-Access VIP status or freeze/unfreeze rule-violating teams in real-time.
- **Credential Generator**: Generate secure, randomized team credentials with custom stage assignments.
- **Standalone Audio Engine**: Dedicated ambient background audio toggle for the command center.

---

## 🛠️ Technology Stack
- **Core**: Vanilla HTML5, CSS3 (Custom Design System with CSS Variables, Flexbox, & CSS Grids), Vanilla JavaScript (ES6+).
- **State & Synchronization**: Browser `localStorage`, `sessionStorage`, and HTML5 `BroadcastChannel` API for zero-latency cross-window inter-tab communication.
- **Design & Aesthetics**: Dark mode glassmorphism, glowing neon borders (Nexus Cyan & Gold), custom typography (*Cinzel*, *Outfit*, *Share Tech Mono*), and HTML5 Canvas ember particle systems.

---

## 🚀 Getting Started & Local Development

### 1. Run a Local Development Server
Because the application uses HTML5 audio and browser storage APIs, serve the directory using any lightweight local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js / npx
npx serve .
```

### 2. Accessing the Application
- **Player Portal**: Open [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Game Master Nexus**: Open [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

### 3. Default Game Master Credentials
To log in to the restricted Command Center (`admin.html`):
- **Username**: `TatvaAdmin`
- **Password**: `Tatva2026!`
*(Note: Universal developer access is also enabled — clicking "ACCESS COMMAND CENTER" or pressing Enter in the login box will unlock the Nexus instantly during local testing).*

---

## 📂 Project Structure
```text
├── index.html          # Player login & initial portal entry
├── home.html           # Player game dashboard & 4 challenge chambers
├── admin.html          # Restricted Game Master Nexus Command Center
├── style.css           # Core player styling & responsive animations
├── admin-style.css     # High-contrast Game Master dashboard styling
├── script.js           # Player logic, challenge validation, & live GM receiver
├── admin-script.js     # Game Master Command Center engine & broadcast transmitter
├── assets/             # Background imagery and visual resources
└── README.md           # Project documentation & setup guide
```

---
*Built with precision and high-performance real-time web technologies.*
