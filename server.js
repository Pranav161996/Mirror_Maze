import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const now = new Date();
const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
const istToday = istNow.toISOString().slice(0, 10);

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Master-Key');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static('.'));
app.use(express.json());

// Constants for JSONBin IDs
const BIN_IDS = {
    'Code_Breaker': '67fca1278960c979a5849c70',
    'Mirror_Maze': '67f912b08a456b7966874534'
};

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    const { game } = req.query;
    if (!game || !BIN_IDS[game]) {
        return res.status(400).json({ error: 'Invalid game parameter' });
    }

    try {
        console.log(`Fetching leaderboard for game: ${game}`);
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_IDS[game]}/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw JSONBin response:', JSON.stringify(data, null, 2));
        
        // Initialize empty array if no record exists
        const scores = Array.isArray(data.record) ? data.record : [];
        
        // Filter by game and sort
        const gameScores = scores
    .filter(score => {
        if (!score || score.game !== game || !score.timestamp) return false;
        console.log('IST Today:', istToday);
        const entryDateIST = new Date(new Date(score.timestamp).getTime() + (5.5 * 60 * 60 * 1000))
            .toISOString()
            .slice(0, 10);
        

        return entryDateIST === istToday;

    })
    .sort((a, b) => a.moves - b.moves)
    .slice(0, 10);


        res.json(gameScores);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Add score to leaderboard
app.post('/api/leaderboard', async (req, res) => {
    const { name, moves, game } = req.body;
    
    if (!name || !moves || !game || !BIN_IDS[game]) {
        return res.status(400).json({ error: 'Missing required fields or invalid game' });
    }

    try {
        // First, get the current scores
        const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_IDS[game]}/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!getResponse.ok) {
            throw new Error(`JSONBin GET error: ${getResponse.status} ${getResponse.statusText}`);
        }

        const data = await getResponse.json();
        console.log('Current data:', JSON.stringify(data, null, 2));

        // Initialize empty array if no record exists
        const scores = Array.isArray(data.record) ? data.record : [];

        // Add new score
        const newScore = {
            name,
            moves,
            game,
            timestamp: new Date().toISOString()
        };
        scores.push(newScore);

        // Sort by moves (ascending)
        scores.sort((a, b) => a.moves - b.moves);

        // Update the bin with new scores
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_IDS[game]}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.JSONBIN_API_KEY
            },
            body: JSON.stringify(scores)  // Send array directly
        });

        if (!updateResponse.ok) {
            throw new Error(`JSONBin PUT error: ${updateResponse.status} ${updateResponse.statusText}`);
        }

        // Return filtered and sorted leaderboard
        const gameScores = scores
            .filter(score => score.game === game)
            .sort((a, b) => a.moves - b.moves)
            .slice(0, 10);

        res.json(gameScores);
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        res.status(500).json({ error: 'Failed to update leaderboard' });
    }
});

// Function to generate a deterministic daily code based on date
function generateDailyCode() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash = hash & hash;
    }

    const allDigits = Array.from({ length: 10 }, (_, i) => i);
    
    for (let i = allDigits.length - 1; i > 0; i--) {
        hash = Math.abs((hash * 31) & hash);
        const j = hash % (i + 1);
        [allDigits[i], allDigits[j]] = [allDigits[j], allDigits[i]];
    }
    
    return allDigits.slice(0, 5).join('');
}

// Store the daily code and its generation timestamp
let dailyCode = {
    code: generateDailyCode(),
    timestamp: new Date().setHours(0, 0, 0, 0)
};

// Guess validation endpoint
app.post('/api/validate_guess', (req, res) => {
    const { guess } = req.body;
    
    if (!guess || guess.length !== 5 || !/^\d+$/.test(guess)) {
        return res.status(400).json({ error: 'Invalid guess format' });
    }

    const today = new Date().setHours(0, 0, 0, 0);
    if (today !== dailyCode.timestamp) {
        dailyCode = {
            code: generateDailyCode(),
            timestamp: today
        };
    }

    let correctPosition = 0;
    let correctDigit = 0;
    const usedIndices = new Set();
    const usedGuessIndices = new Set();

    for (let i = 0; i < 5; i++) {
        if (guess[i] === dailyCode.code[i]) {
            correctPosition++;
            usedIndices.add(i);
            usedGuessIndices.add(i);
        }
    }

    for (let i = 0; i < 5; i++) {
        if (usedGuessIndices.has(i)) continue;
        
        for (let j = 0; j < 5; j++) {
            if (usedIndices.has(j)) continue;
            
            if (guess[i] === dailyCode.code[j]) {
                correctDigit++;
                usedIndices.add(j);
                usedGuessIndices.add(i);
                break;
            }
        }
    }

    res.json({
        correctPosition,
        correctDigit,
        isCorrect: correctPosition === 5
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 