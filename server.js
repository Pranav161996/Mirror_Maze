const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// Serve static files
app.use(express.static('public'));

// API endpoint to get current puzzle
app.get('/api/puzzle', (req, res) => {
    const puzzlePath = path.join(__dirname, 'puzzles', 'current.json');
    if (fs.existsSync(puzzlePath)) {
        const puzzle = JSON.parse(fs.readFileSync(puzzlePath, 'utf8'));
        res.json(puzzle);
    } else {
        res.status(404).json({ error: 'No puzzle available' });
    }
});

// API endpoint to get puzzle archive
app.get('/api/archive/:date', (req, res) => {
    const date = req.params.date;
    const archivePath = path.join(__dirname, 'puzzles', 'archive', `${date}.json`);
    if (fs.existsSync(archivePath)) {
        const puzzle = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
        res.json(puzzle);
    } else {
        res.status(404).json({ error: 'Puzzle not found' });
    }
});

// Secure endpoint to get JSONBin configuration
app.get('/api/config/jsonbin', (req, res) => {
    res.json({
        binId: process.env.JSONBIN_BIN_ID,
        apiKey: process.env.JSONBIN_API_KEY
    });
});

// Add after the existing JSONBin configuration endpoint
app.get('/api/test/jsonbin', async (req, res) => {
    try {
        // Check if credentials are in correct format
        if (!process.env.JSONBIN_API_KEY || 
            !(process.env.JSONBIN_API_KEY.startsWith('$2a$10$') || 
              process.env.JSONBIN_API_KEY.startsWith('$2b$10$'))) {
            return res.status(500).json({
                status: 'error',
                message: 'Invalid API key format',
                help: 'API key should start with either $2a$10$ or $2b$10$. Make sure you are using the Master Key from JSONBin.',
                credentials: {
                    binId: process.env.JSONBIN_BIN_ID ? 'Configured' : 'Missing',
                    apiKey: process.env.JSONBIN_API_KEY ? 'Invalid Format' : 'Missing',
                    apiKeyPrefix: process.env.JSONBIN_API_KEY ? process.env.JSONBIN_API_KEY.substring(0, 7) : 'N/A'
                }
            });
        }

        // Try to fetch from JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`JSONBin returned status: ${response.status}. Details: ${errorMessage}`);
        }

        const data = await response.json();
        
        res.json({
            status: 'success',
            message: 'JSONBin connection successful',
            binExists: true,
            recordCount: Array.isArray(data.record) ? data.record.length : 'N/A',
            binId: process.env.JSONBIN_BIN_ID
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to JSONBin',
            error: error.message,
            help: '401 error means invalid credentials. Check if you are using the Master Key from JSONBin.',
            credentials: {
                binId: process.env.JSONBIN_BIN_ID ? 'Configured' : 'Missing',
                apiKey: process.env.JSONBIN_API_KEY ? 'Configured but might be invalid' : 'Missing',
                apiKeyPrefix: process.env.JSONBIN_API_KEY ? process.env.JSONBIN_API_KEY.substring(0, 7) : 'N/A'
            }
        });
    }
});

// In-memory leaderboard (for demo purposes)
let leaderboard = [];

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    
    // Filter for today's scores only
    const today = new Date().toDateString();
    const todayScores = leaderboard
        .filter(entry => entry.date === today)
        .sort((a, b) => a.moves - b.moves)
        .slice(0, 10);
    
    res.json(todayScores);
});

// Add score to leaderboard
app.post('/api/leaderboard', (req, res) => {
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    
    const { name, moves } = req.body;
    
    if (!name || typeof moves !== 'number') {
        return res.status(400).json({ error: 'Invalid score data' });
    }

    const today = new Date().toDateString();
    const newEntry = {
        name,
        moves,
        date: today,
        timestamp: new Date().toISOString()
    };

    // Filter out old entries from today (if any) from the same player
    leaderboard = leaderboard.filter(entry => 
        entry.date !== today || entry.name !== name
    );
    
    // Add new entry
    leaderboard.push(newEntry);
    
    // Get today's scores, sort, and keep top 10
    const todayScores = leaderboard
        .filter(entry => entry.date === today)
        .sort((a, b) => a.moves - b.moves)
        .slice(0, 10);

    res.json(todayScores);
});

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'play_mirror_maze.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 