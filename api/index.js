const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection caching for serverless environments
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    
    // Check if URI is provided
    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside Vercel');
    }
    
    const db = await mongoose.connect(process.env.MONGODB_URI);
    
    cachedDb = db;
    return db;
}

// Mongoose Models
const TeamSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    password: { type: String },
    stage: { type: Number, default: 1 },
    status: { type: String, default: 'active' },
    warnings: { type: Number, default: 0 },
    members: { type: String },
    score: { type: Number, default: 0 },
    entryTime: { type: Number },
    slotId: { type: String },
    stageTimes: { type: mongoose.Schema.Types.Mixed, default: {} },
    totalTime: { type: Number, default: 0 },
    vaultFinishRank: { type: Number, default: 0 },
    timeEvents: { type: Array, default: [] },
    resetEvents: { type: Array, default: [] }
});

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String }
});

const LogSchema = new mongoose.Schema({
    timestamp: { type: Number },
    action: { type: String },
    category: { type: String },
    teamId: { type: String },
    details: { type: String }
});

// Since Vercel executes this code globally on warm boots, we check if models exist to avoid OverwriteModelError
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

// Middleware to ensure DB connection on every request
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ error: 'Database Connection Error: ' + err.message });
    }
});

// Utility function to get settings
async function getSettingsMap() {
    const settingsList = await Setting.find({});
    const map = {};
    settingsList.forEach(s => {
        map[s.key] = s.value;
    });
    return map;
}

// -----------------------------------------
// API ROUTES
// -----------------------------------------

app.post(['/api/login', '/login'], async (req, res) => {
    const { teamId, password } = req.body;
    if (!teamId || !password) return res.status(400).json({ error: "Missing credentials" });
    
    try {
        const team = await Team.findOne({ id: teamId });
        if (!team) {
            return res.status(401).json({ error: "Team not found", success: false });
        }
        if (team.password !== password) {
            return res.status(401).json({ error: "Incorrect password", success: false });
        }
        
        await Log.create({
            timestamp: Date.now(),
            action: 'Team Login',
            category: 'auth',
            teamId: teamId,
            details: 'Team authenticated successfully'
        });
        
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(['/api/teams', '/teams'], async (req, res) => {
    try {
        const teamsList = await Team.find({});
        const teamsObj = {};
        teamsList.forEach(t => {
            teamsObj[t.id] = t.toObject();
        });
        res.json(teamsObj);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Single team state fetch for polling
app.get(['/api/teams/:id', '/teams/:id'], async (req, res) => {
    try {
        const team = await Team.findOne({ id: req.params.id });
        if (!team) return res.status(404).json({ error: "Team not found" });
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post(['/api/teams', '/teams'], async (req, res) => {
    const { id, password, stage, status, warnings, members, score, entryTime, slotId, timeTaken, currentStageId } = req.body;
    if (!id) return res.status(400).json({ error: "Missing team id" });
    
    try {
        const updateData = {};
        if (password !== undefined) updateData.password = password;
        if (stage !== undefined) updateData.stage = stage;
        if (status !== undefined) updateData.status = status;
        if (warnings !== undefined) updateData.warnings = warnings;
        if (members !== undefined) updateData.members = members;
        if (score !== undefined) updateData.score = score;
        if (entryTime !== undefined) updateData.entryTime = entryTime;
        if (slotId !== undefined) updateData.slotId = slotId;

        const team = await Team.findOne({ id: id });
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }

        // Handle time recording
        if (timeTaken !== undefined && currentStageId !== undefined) {
            if (!team.stageTimes) team.stageTimes = {};
            team.stageTimes[currentStageId] = timeTaken;
            team.markModified('stageTimes');
            team.totalTime = (team.totalTime || 0) + timeTaken;
        }

        // Apply other updates
        Object.assign(team, updateData);

        // Assign vaultFinishRank if completing Stage 4 (stage becomes 5)
        if (team.stage >= 5 && (!team.vaultFinishRank || team.vaultFinishRank === 0)) {
            const finishedTeamsCount = await Team.countDocuments({ stage: { $gte: 5 } });
            team.vaultFinishRank = finishedTeamsCount + 1;
        }

        await team.save();
        
        // Log progression if stage changed
        if (stage !== undefined) {
            await Log.create({
                timestamp: Date.now(),
                action: 'Stage Progression',
                category: 'game',
                teamId: id,
                details: `Advanced to stage ${stage}`
            });
        }
        
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Dedicated Reset Endpoint
app.post(['/api/teams/reset', '/teams/reset'], async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing team id" });
    
    try {
        const team = await Team.findOne({ id: id });
        if (!team) return res.status(404).json({ error: "Team not found" });

        team.stage = 1;
        team.status = 'active';
        team.score = 0;
        team.totalTime = 0;
        team.stageTimes = {};
        team.vaultFinishRank = 0;

        await team.save();

        await Log.create({
            timestamp: Date.now(),
            action: 'Team Reset',
            category: 'game',
            teamId: id,
            details: 'Team progress has been reset to start'
        });

        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin Bulk Replacement
app.post(['/api/teams/bulk', '/teams/bulk'], async (req, res) => {
    const teamsObj = req.body;
    if (!teamsObj || typeof teamsObj !== 'object') {
        return res.status(400).json({ error: "Invalid payload" });
    }
    
    try {
        // Drop existing and insert new
        await Team.deleteMany({});
        
        const inserts = [];
        for (const [id, t] of Object.entries(teamsObj)) {
            inserts.push({
                id: id,
                password: t.password,
                stage: t.stage || 1,
                status: t.status || 'active',
                warnings: t.warnings || 0,
                members: t.members || '',
                score: t.score || 0,
                entryTime: t.entryTime || null,
                slotId: t.slotId || ''
            });
        }
        
        if (inserts.length > 0) {
            await Team.insertMany(inserts);
        }
        
        await Log.create({
            timestamp: Date.now(),
            action: 'Bulk Teams Update',
            category: 'system',
            teamId: 'SYSTEM',
            details: `Synchronized ${inserts.length} teams`
        });
        
        res.json({ success: true, count: inserts.length });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin Action (e.g., FREEZE, WARN, REVIVE)
app.post(['/api/teams/:id/action', '/teams/:id/action'], async (req, res) => {
    const { action } = req.body;
    const teamId = req.params.id;
    try {
        const team = await Team.findOne({ id: teamId });
        if (!team) return res.status(404).json({ error: "Team not found" });

        if (action === 'FREEZE') {
            team.status = 'frozen';
        } else if (action === 'WARN') {
            team.warnings += 1;
        } else if (action === 'REVIVE') {
            team.status = 'active';
            team.entryTime = (team.entryTime || Date.now()) + (5 * 60 * 1000); // 5 min bonus
        } else if (action === 'LOGOUT') {
            team.status = 'logged_out'; // Custom state to force client logout via polling
        }
        
        await team.save();
        
        await Log.create({
            timestamp: Date.now(),
            action: `GM Action: ${action}`,
            category: 'system',
            teamId: teamId,
            details: `Applied ${action} to team`
        });
        
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin Add Time Action
app.post(['/api/teams/:id/add-time', '/teams/:id/add-time'], async (req, res) => {
    const { stage, minutes } = req.body;
    const teamId = req.params.id;
    try {
        const team = await Team.findOne({ id: teamId });
        if (!team) return res.status(404).json({ error: "Team not found" });

        const eventId = Math.random().toString(36).substr(2, 9);
        const timeEvent = {
            id: eventId,
            stage: parseInt(stage) || team.stage,
            minutes: parseInt(minutes) || 5,
            timestamp: Date.now()
        };

        if (!team.timeEvents) team.timeEvents = [];
        team.timeEvents.push(timeEvent);

        if (team.status === 'timeout') {
            team.status = 'active'; // Revive them
        }

        await team.save();

        await Log.create({
            timestamp: Date.now(),
            action: `GM Action: ADD_TIME`,
            category: 'system',
            teamId: teamId,
            details: `Added ${timeEvent.minutes} minutes to stage ${timeEvent.stage}`
        });

        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin Reset Action
app.post(['/api/teams/:id/reset', '/teams/:id/reset'], async (req, res) => {
    const { scope } = req.body;
    const teamId = req.params.id;
    try {
        const team = await Team.findOne({ id: teamId });
        if (!team) return res.status(404).json({ error: "Team not found" });

        const eventId = Math.random().toString(36).substr(2, 9);
        const resetEvent = {
            id: eventId,
            scope: scope === 'all' ? 'all' : 'current',
            stage: team.stage,
            timestamp: Date.now()
        };

        if (!team.resetEvents) team.resetEvents = [];
        team.resetEvents.push(resetEvent);
        
        team.status = 'active';

        if (scope === 'all') {
            team.stage = 1;
            team.score = 0;
            team.totalTime = 0;
            team.stageTimes = {};
            team.warnings = 0;
            team.timeEvents = [];
        }

        await team.save();

        await Log.create({
            timestamp: Date.now(),
            action: `GM Action: RESET`,
            category: 'system',
            teamId: teamId,
            details: `Reset progress. Scope: ${scope}`
        });

        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(['/api/settings', '/settings'], async (req, res) => {
    try {
        const map = await getSettingsMap();
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post(['/api/settings', '/settings'], async (req, res) => {
    const settings = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            await Setting.findOneAndUpdate(
                { key: key },
                { $set: { value: value } },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(['/api/logs', '/logs'], async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Export the app for Vercel Serverless
module.exports = app;

// Local development fallback
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Escape The Room backend running locally on port ${PORT}`);
    });
}
