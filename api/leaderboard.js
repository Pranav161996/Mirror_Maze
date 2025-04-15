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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get the API key from environment variables
    const apiKey = process.env.JSONBIN_API_KEY;
    if (!apiKey) {
        console.error('JSONBIN_API_KEY environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        if (req.method === 'GET') {
            const { game, binId } = req.query;
            
            if (!game || !binId) {
                return res.status(400).json({ error: 'Missing game or binId parameter' });
            }

            // Fetch leaderboard data from JSONBin
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                headers: {
                    'X-Master-Key': apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];
            
            // Handle both array and object data structures
            let scores = [];
            if (Array.isArray(data.record)) {
                scores = data.record;
            } else if (typeof data.record === 'object') {
                scores = data.record[today] || [];
            }

            // Filter scores for the specific game and sort by moves
            const gameScores = scores
                .filter(score => score && score.game === game)
                .sort((a, b) => a.moves - b.moves);

            return res.status(200).json(gameScores);

        } else if (req.method === 'POST') {
            const { name, moves, game, binId } = req.body;

            if (!name || !moves || !game || !binId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Fetch current data
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                headers: {
                    'X-Master-Key': apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];
            const currentScores = data.record[today] || [];

            // Add new score
            const newScore = {
                name,
                moves,
                game,
                timestamp: new Date().toISOString()
            };

            currentScores.push(newScore);

            // Update JSONBin
            const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': apiKey
                },
                body: JSON.stringify({
                    ...data.record,
                    [today]: currentScores
                })
            });

            if (!updateResponse.ok) {
                throw new Error(`Failed to update JSONBin: ${updateResponse.status} ${updateResponse.statusText}`);
            }

            // Return only the scores for the specific game, sorted by moves
            const gameScores = currentScores
                .filter(score => score.game === game)
                .sort((a, b) => a.moves - b.moves);

            return res.status(200).json(gameScores);
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Error in leaderboard API:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
} 