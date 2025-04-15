import fetch from 'node-fetch';

const CODE_BREAKER_BIN_ID = '67f912b08a456b7966874534';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { guess } = req.body;
        
        if (!guess || typeof guess !== 'string' || guess.length !== 5 || !/^\d{5}$/.test(guess)) {
            return res.status(400).json({ error: 'Invalid guess format. Must be a 5-digit number.' });
        }

        // Get today's code
        const apiKey = process.env.JSONBIN_API_KEY;
        if (!apiKey) {
            throw new Error('JSONBIN_API_KEY environment variable is not set');
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Fetch current data from JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CODE_BREAKER_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const dailyCode = data.record[today];

        if (!dailyCode) {
            return res.status(404).json({ error: 'Daily code not found' });
        }

        // Calculate feedback
        let correctPosition = 0;
        let correctDigits = 0;
        const guessArray = guess.split('');
        const codeArray = dailyCode.split('');
        
        // Count correct positions
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === codeArray[i]) {
                correctPosition++;
                // Mark these digits as used
                guessArray[i] = 'x';
                codeArray[i] = 'y';
            }
        }

        // Count correct digits in wrong positions
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] !== 'x') {
                const index = codeArray.indexOf(guessArray[i]);
                if (index !== -1) {
                    correctDigits++;
                    codeArray[index] = 'y';
                }
            }
        }

        return res.status(200).json({
            correctPosition,
            correctDigits,
            isCorrect: correctPosition === 5
        });

    } catch (error) {
        console.error('Error in validate_guess API:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
} 