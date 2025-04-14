import fetch from 'node-fetch';

// Helper function to interact with JSONBin
async function getLeaderboard(binId) {
    try {
        if (!binId || !process.env.JSONBIN_API_KEY) {
            throw new Error('Missing required parameters');
        }

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JSONBin returned status: ${response.status}. Details: ${errorText}`);
        }

        const data = await response.json();
        return Array.isArray(data.record) ? data.record : [];
    } catch (error) {
        console.error('Error fetching from JSONBin:', error);
        throw error;
    }
}

async function updateLeaderboard(leaderboard, binId) {
    try {
        if (!binId || !process.env.JSONBIN_API_KEY) {
            throw new Error('Missing required parameters');
        }

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.JSONBIN_API_KEY
            },
            body: JSON.stringify(leaderboard)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JSONBin returned status: ${response.status}. Details: ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Error updating JSONBin:', error);
        throw error;
    }
}

// Vercel API handler
export default async function handler(req, res) {
    console.log(`[${new Date().toISOString()}] ${req.method} request to /api/leaderboard`);
    console.log('Query parameters:', req.query);
    console.log('URL:', req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request (for CORS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Add cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');

    try {
        // Log environment variables (without revealing sensitive data)
        console.log('Environment check:', {
            JSONBIN_API_KEY: process.env.JSONBIN_API_KEY ? 'Set' : 'Not set'
        });

        // Check environment variables
        if (!process.env.JSONBIN_API_KEY) {
            console.error('Missing required environment variables');
            return res.status(500).json({ 
                error: 'Server configuration error',
                details: 'Missing required environment variables'
            });
        }

        if (req.method === 'GET') {
            console.log('Processing GET request');
            const gameName = (req.query && req.query.game) || 'Mirror_Maze';
            const binId = req.query.binId;
            console.log('Game name:', gameName, 'Bin ID:', binId);

            if (!binId) {
                return res.status(400).json({ 
                    error: 'Missing required parameter',
                    details: 'binId is required'
                });
            }

            const leaderboard = await getLeaderboard(binId);
            console.log('Fetched leaderboard entries:', leaderboard.length);

            const scores = leaderboard
                .filter(entry => entry.game === gameName)
                .sort((a, b) => a.moves - b.moves)
                .slice(0, 10);

            console.log('Filtered scores:', scores.length);
            return res.status(200).json(scores);
        } 
        else if (req.method === 'POST') {
            console.log('Processing POST request');
            console.log('Request body:', req.body);

            const { name, moves, game = 'Mirror_Maze', binId } = req.body;

            if (!name || typeof moves !== 'number' || !game || !binId) {
                console.error('Invalid score data:', { name, moves, game, binId });
                return res.status(400).json({ 
                    error: 'Invalid score data',
                    details: 'Name, moves (number), game, and binId are required'
                });
            }

            const leaderboard = await getLeaderboard(binId);
            const today = new Date().toDateString();
            const newEntry = {
                name,
                moves,
                game,
                date: today,
                timestamp: new Date().toISOString()
            };

            console.log('New entry:', newEntry);

            const filteredLeaderboard = leaderboard.filter(entry => 
                !(entry.game === game && entry.name === name)
            );

            filteredLeaderboard.push(newEntry);
            await updateLeaderboard(filteredLeaderboard, binId);

            const scores = filteredLeaderboard
                .filter(entry => entry.game === game)
                .sort((a, b) => a.moves - b.moves)
                .slice(0, 10);

            console.log('Updated scores:', scores.length);
            res.status(200).json(scores);
        } 
        else {
            console.warn(`Unsupported method: ${req.method}`);
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
} 