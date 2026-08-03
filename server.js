const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');
// Initialize Database (Glitch uses .data/ for persistent storage automatically)
const dbPath = process.env.DB_PATH || path.join(__dirname, '.data', 'database.sqlite');
try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
} catch (err) {
    console.error("Failed to create database directory:", err);
}
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                password TEXT,
                stage INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active',
                warnings INTEGER DEFAULT 0,
                members TEXT,
                score INTEGER DEFAULT 0,
                entryTime INTEGER,
                slotId TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                action TEXT,
                category TEXT,
                teamId TEXT,
                details TEXT
            )`);
            
            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('gameMode', 'demo')`);
        });
    }
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows)));
const dbGet = (query, params = []) => new Promise((resolve, reject) => db.get(query, params, (err, row) => err ? reject(err) : resolve(row)));
const dbRun = (query, params = []) => new Promise((resolve, reject) => db.run(query, params, function(err) { err ? reject(err) : resolve(this); }));

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

app.post('/api/login', async (req, res) => {
    const { teamId, password } = req.body;
    if (!teamId || !password) return res.status(400).json({ error: "Missing credentials" });
    
    try {
        const team = await dbGet(`SELECT * FROM teams WHERE id = ?`, [teamId.toUpperCase()]);
        if (!team) return res.status(404).json({ error: "Team not found" });
        if (team.password !== password) return res.status(401).json({ error: "Invalid password" });
        
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teams', async (req, res) => {
    try {
        const teams = await dbAll(`SELECT * FROM teams`);
        const teamsObj = {};
        teams.forEach(t => teamsObj[t.id] = t);
        res.json(teamsObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams', async (req, res) => {
    const t = req.body;
    if (!t.id) return res.status(400).json({ error: "Missing team id" });
    
    try {
        await dbRun(`
            INSERT INTO teams (id, password, stage, status, warnings, members, score, entryTime, slotId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                password=excluded.password,
                stage=excluded.stage,
                status=excluded.status,
                warnings=excluded.warnings,
                members=excluded.members,
                score=excluded.score,
                entryTime=excluded.entryTime,
                slotId=excluded.slotId
        `, [t.id, t.password, t.stage, t.status, t.warnings, t.members, t.score, t.entryTime, t.slotId]);
        
        io.emit('team_update', t);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM teams WHERE id = ?`, [req.params.id]);
        io.emit('team_delete', req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams', async (req, res) => {
    try {
        await dbRun(`DELETE FROM teams`);
        io.emit('database_cleared');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams/bulk', async (req, res) => {
    const teamsObj = req.body;
    try {
        await dbRun(`BEGIN TRANSACTION`);
        await dbRun(`DELETE FROM teams`);
        
        const stmt = db.prepare(`INSERT INTO teams (id, password, stage, status, warnings, members, score, entryTime, slotId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const [id, t] of Object.entries(teamsObj)) {
            stmt.run([id, t.password, t.stage || 1, t.status || 'active', t.warnings || 0, t.members || '', t.score || 0, t.entryTime || Date.now(), t.slotId || '']);
        }
        stmt.finalize();
        await dbRun(`COMMIT`);
        
        io.emit('bulk_teams_update');
        res.json({ success: true });
    } catch (err) {
        await dbRun(`ROLLBACK`);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM settings`);
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const settings = req.body;
    try {
        await dbRun(`BEGIN TRANSACTION`);
        for (const [key, value] of Object.entries(settings)) {
            await dbRun(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
        }
        await dbRun(`COMMIT`);
        io.emit('settings_update', settings);
        res.json({ success: true });
    } catch (err) {
        await dbRun(`ROLLBACK`);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    const { action, category, teamId, details } = req.body;
    try {
        await dbRun(`INSERT INTO logs (timestamp, action, category, teamId, details) VALUES (?, ?, ?, ?, ?)`, 
            [Date.now(), action, category, teamId, details]);
        
        const latestLogs = await dbAll(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50`);
        io.emit('logs_update', latestLogs);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await dbAll(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50`);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/logs', async (req, res) => {
    try {
        await dbRun(`DELETE FROM logs`);
        io.emit('logs_update', []);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ----------------------------------------------------
// SOCKET.IO REAL-TIME NETWORKING
// ----------------------------------------------------
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('gm_command', (payload) => {
        io.emit('gm_command', payload);
    });
    
    socket.on('team_completed_stage', async ({ teamId, nextStage, scoreGained, eventData }) => {
        try {
            const team = await dbGet(`SELECT * FROM teams WHERE id = ?`, [teamId]);
            if (team) {
                const newScore = (team.score || 0) + scoreGained;
                await dbRun(`UPDATE teams SET stage = ?, score = ? WHERE id = ?`, [nextStage, newScore, teamId]);
                
                const updatedTeam = await dbGet(`SELECT * FROM teams WHERE id = ?`, [teamId]);
                io.emit('team_update', updatedTeam);
                
                await dbRun(`INSERT INTO logs (timestamp, action, category, teamId, details) VALUES (?, ?, ?, ?, ?)`, 
                    [Date.now(), `[${teamId}] completed stage.`, 'success', teamId, `Advanced to Stage ${nextStage}`]);
                
                const latestLogs = await dbAll(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50`);
                io.emit('logs_update', latestLogs);
            }
        } catch (err) {
            console.error('Error handling team completion:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Escape The Room backend running on port ${PORT}`);
});
