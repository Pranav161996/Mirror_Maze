import { generateDailyCode } from './daily_code';

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
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { guess } = req.body;
        
        // Validate input
        if (!guess || !/^\d{5}$/.test(guess)) {
            return res.status(400).json({ error: 'Invalid guess format. Must be 5 digits.' });
        }

        // Check for duplicate digits
        if (new Set(guess.split('')).size !== 5) {
            return res.status(400).json({ error: 'All digits must be different.' });
        }

        // Get today's code
        const code = generateDailyCode();
        const guessArray = guess.split('');
        const codeArray = code.split('');

        // Count correct positions
        let correctPosition = 0;
        let correctDigit = 0;
        const usedIndices = new Set();

        // First pass: Check correct positions
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === codeArray[i]) {
                correctPosition++;
                usedIndices.add(i);
            }
        }

        // Second pass: Check correct digits in wrong positions
        for (let i = 0; i < 5; i++) {
            if (!usedIndices.has(i)) {
                for (let j = 0; j < 5; j++) {
                    if (!usedIndices.has(j) && guessArray[i] === codeArray[j]) {
                        correctDigit++;
                        usedIndices.add(j);
                        break;
                    }
                }
            }
        }

        const isCorrect = correctPosition === 5;

        res.status(200).json({
            correctPosition,
            correctDigit,
            isCorrect
        });
    } catch (error) {
        console.error('Error validating guess:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 