import fetch from 'node-fetch';

const BIN_IDS = {
    'Mirror_Maze': '67f912b08a456b7966874534',
    'Code_Breaker': '67fca1278960c979a5849c70'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const apiKey = process.env.JSONBIN_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Get today's date in IST
        const now = new Date();
        const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const istToday = istNow.toISOString().slice(0, 10);
        console.log('Today in IST:', istToday);

        const getISTDate = (timestamp) => {
            const date = new Date(timestamp);
            const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
            return istDate.toISOString().slice(0, 10);
        };

        if (req.method === 'GET') {
            const { game } = req.query;
            if (!game || !BIN_IDS[game]) {
                return res.status(400).json({ error: 'Invalid or missing game parameter' });
            }

            const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_IDS[game]}/latest`, {
                headers: { 'X-Master-Key': apiKey }
            });

            if (!response.ok) {
                console.error('JSONBin API error:', response.status, await response.text());
                return res.status(500).json({ error: 'Failed to fetch leaderboard data' });
            }

            const data = await response.json();
            console.log('IST Today:', istToday);
            console.log('Raw JSONBin response:', JSON.stringify(data, null, 2));
            
            const records = Array.isArray(data.record) ? data.record : [];
            
            // Filter today's scores (IST) and format response
            const todayScores = records
                .filter(score => {
                    if (!score?.timestamp || score?.game !== game) return false;
                    const entryISTDate = getISTDate(score.timestamp);
                    console.log('Entry date in IST:', entryISTDate, 'Score:', score.name, score.moves);
                    return entryISTDate === istToday;
                })
                .sort((a, b) => a.moves - b.moves)
                .slice(0, 10)
                .map((entry, index) => ({
                    rank: index + 1,
                    name: entry.name,
                    moves: entry.moves
                }));

            console.log('Today\'s scores (IST):', JSON.stringify(todayScores, null, 2));
            return res.status(200).json(todayScores);

        } else if (req.method === 'POST') {
            const { name, moves, game } = req.body;
            if (!name || !moves || !game || !BIN_IDS[game]) {
                return res.status(400).json({ error: 'Invalid request body' });
            }

            const binId = BIN_IDS[game];
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                headers: { 'X-Master-Key': apiKey }
            });

            if (!response.ok) {
                console.error('JSONBin API error:', response.status, await response.text());
                return res.status(500).json({ error: 'Failed to fetch leaderboard data' });
            }

            const data = await response.json();
            const records = Array.isArray(data.record) ? data.record : [];

            const newScore = {
                name,
                moves,
                game,
                timestamp: new Date().toISOString()
            };

            records.push(newScore);

            const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': apiKey
                },
                body: JSON.stringify(records)
            });

            if (!updateResponse.ok) {
                console.error('JSONBin API error:', updateResponse.status, await updateResponse.text());
                return res.status(500).json({ error: 'Failed to update leaderboard' });
            }

            // Filter today's scores (IST) and format response
            const todayScores = records
                .filter(score => {
                    if (!score?.timestamp || score?.game !== game) return false;
                    const entryISTDate = getISTDate(score.timestamp);
                    console.log('Entry date in IST:', entryISTDate, 'Score:', score.name, score.moves);
                    return entryISTDate === istToday;
                })
                .sort((a, b) => a.moves - b.moves)
                .slice(0, 10)
                .map((entry, index) => ({
                    rank: index + 1,
                    name: entry.name,
                    moves: entry.moves
                }));

            return res.status(200).json(todayScores);
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Leaderboard error:', error);
        return res.status(500).json({ error: error.message });
    }
}
