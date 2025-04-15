import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

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

// Function to generate a deterministic daily code based on date
function generateDailyCode() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Create a simple hash of the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Create an array of digits 0-9
    const allDigits = Array.from({ length: 10 }, (_, i) => i);
    
    // Use the hash to shuffle the array deterministically
    for (let i = allDigits.length - 1; i > 0; i--) {
        // Use the hash to generate a random index
        hash = Math.abs((hash * 31) & hash);
        const j = hash % (i + 1);
        // Swap elements
        [allDigits[i], allDigits[j]] = [allDigits[j], allDigits[i]];
    }
    
    // Take the first 5 digits
    const selectedDigits = allDigits.slice(0, 5);
    return selectedDigits.join('');
}

// Store the daily code and its generation timestamp
let dailyCode = {
    code: generateDailyCode(),
    timestamp: new Date().setHours(0, 0, 0, 0)
};

// Guess validation endpoint
app.post('/api/validate_guess', (req, res) => {
    const { guess } = req.body;
    
    // Input validation
    if (!guess || guess.length !== 5 || !/^\d+$/.test(guess)) {
        return res.status(400).json({ error: 'Invalid guess format' });
    }

    // Check if we need to generate a new code for the day
    const today = new Date().setHours(0, 0, 0, 0);
    if (today !== dailyCode.timestamp) {
        dailyCode = {
            code: generateDailyCode(),
            timestamp: today
        };
    }

    // Calculate feedback
    let correctPosition = 0;
    let correctDigit = 0;
    const usedIndices = new Set();
    const usedGuessIndices = new Set();

    // First check for correct positions
    for (let i = 0; i < 5; i++) {
        if (guess[i] === dailyCode.code[i]) {
            correctPosition++;
            usedIndices.add(i);
            usedGuessIndices.add(i);
        }
    }

    // Then check for correct digits in wrong positions
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

app.get('/api/leaderboard', async (req, res) => {
    const { game, binId } = req.query;
    if (!binId) {
        return res.status(400).json({ error: 'Missing binId parameter' });
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let scores = data.record || [];

        // Filter by game if specified
        if (game) {
            scores = scores.filter(score => score.game === game);
        }

        // Sort by moves (ascending) and limit to top 10
        scores.sort((a, b) => a.moves - b.moves);
        scores = scores.slice(0, 10);

        res.json(scores);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/api/leaderboard', async (req, res) => {
    const { name, moves, game, binId } = req.body;
    
    if (!name || !moves || !game || !binId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // First, get the current scores
        const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!getResponse.ok) {
            throw new Error(`JSONBin GET error: ${getResponse.status} ${getResponse.statusText}`);
        }

        const data = await getResponse.json();
        let scores = data.record || [];

        // Add new score
        scores.push({ name, moves, game, timestamp: new Date().toISOString() });

        // Sort by moves (ascending)
        scores.sort((a, b) => a.moves - b.moves);

        // Update the bin with new scores
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.JSONBIN_API_KEY
            },
            body: JSON.stringify(scores)
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

// Config endpoint to provide API key
app.get('/api/config', (req, res) => {
    if (!process.env.JSONBIN_API_KEY) {
        console.error('JSONBIN_API_KEY environment variable is not set');
        return res.status(500).json({ error: 'API key not configured' });
    }
    res.json({ apiKey: process.env.JSONBIN_API_KEY });
});

// Test endpoint for JSONBin connectivity
app.get('/api/test-jsonbin', async (req, res) => {
    try {
        const binId = '67fca1278960c979a5849c70';
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`JSONBin API error: ${response.status}`);
        }

        const data = await response.json();
        res.json({
            status: 'success',
            message: 'JSONBin connection successful',
            details: {
                binId,
                responseStatus: response.status,
                recordCount: data.record ? data.record.length : 0,
                apiKeyPresent: !!process.env.JSONBIN_API_KEY
            }
        });
    } catch (error) {
        console.error('JSONBin test failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: {
                apiKeyPresent: !!process.env.JSONBIN_API_KEY
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
try {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
} 