import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Helper function to interact with JSONBin
async function getLeaderboard() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`JSONBin returned status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.record) ? data.record : [];
    } catch (error) {
        console.error('Error fetching from JSONBin:', error);
        return [];
    }
}

async function updateLeaderboard(leaderboard) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.JSONBIN_API_KEY
            },
            body: JSON.stringify(leaderboard)
        });

        if (!response.ok) {
            throw new Error(`JSONBin returned status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error updating JSONBin:', error);
        return false;
    }
}

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    
    try {
        const leaderboard = await getLeaderboard();
        const gameName = req.query.game || 'Mirror_Maze'; // Default to Mirror_Maze if no game specified
        
        // Filter by game name and sort by moves
        const scores = leaderboard
            .filter(entry => entry.game === gameName)
            .sort((a, b) => a.moves - b.moves)
            .slice(0, 10);
        
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Add score to leaderboard
app.post('/api/leaderboard', async (req, res) => {
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    
    const { name, moves, game = 'Mirror_Maze' } = req.body; // Default game to Mirror_Maze
    
    if (!name || typeof moves !== 'number' || !game) {
        return res.status(400).json({ error: 'Invalid score data' });
    }

    try {
        const leaderboard = await getLeaderboard();
        const today = new Date().toDateString();
        const newEntry = {
            name,
            moves,
            game,
            date: today,
            timestamp: new Date().toISOString()
        };

        // Filter out old entries from the same player for the same game
        const filteredLeaderboard = leaderboard.filter(entry => 
            !(entry.game === game && entry.name === name)
        );
        
        // Add new entry
        filteredLeaderboard.push(newEntry);
        
        // Update JSONBin
        const success = await updateLeaderboard(filteredLeaderboard);
        if (!success) {
            throw new Error('Failed to update leaderboard');
        }
        
        // Get scores for this game only
        const scores = filteredLeaderboard
            .filter(entry => entry.game === game)
            .sort((a, b) => a.moves - b.moves)
            .slice(0, 10);

        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update leaderboard' });
    }
});

// Serve the game
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'play_mirror_maze.html'));
// });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 