// Generate a deterministic daily code based on date
function generateDailyCode() {
    const today = new Date().toISOString().split('T')[0];
    const seed = parseInt(today.replace(/-/g, ''));
    
    // Use the seed to generate 5 unique digits
    let digits = new Set();
    let rng = seed;
    
    while (digits.size < 5) {
        rng = (rng * 16807) % 2147483647; // Linear congruential generator
        const digit = rng % 10;
        digits.add(digit);
    }
    
    return Array.from(digits).join('');
}

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
        
        // Log request for debugging
        console.log('Received guess:', guess);
        
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
        console.log('Daily code:', code); // For debugging
        
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
        
        // Log response for debugging
        const response = { correctPosition, correctDigit, isCorrect };
        console.log('Sending response:', response);

        res.status(200).json(response);
    } catch (error) {
        console.error('Error validating guess:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
} 