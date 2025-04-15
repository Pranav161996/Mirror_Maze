import fetch from 'node-fetch';

const CODE_BREAKER_BIN_ID = '67f912b08a456b7966874534';

// Generate a random 5-digit code with unique digits
function generateCode() {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const code = [];
    
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        code.push(digits.splice(randomIndex, 1)[0]);
    }
    
    return code.join('');
}

// Get today's date in YYYY-MM-DD format
function getToday() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Check for API key
        const apiKey = process.env.JSONBIN_API_KEY;
        if (!apiKey) {
            throw new Error('JSONBIN_API_KEY environment variable is not set');
        }
        
        // Get today's date
        const today = getToday();
        
        // Fetch current data from JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${CODE_BREAKER_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`JSONBin API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const dailyCodes = data.record || {};
        
        // If we already have a code for today, return it
        if (dailyCodes[today]) {
            return res.status(200).json({ code: dailyCodes[today] });
        }
        
        // Generate a new code for today
        const newCode = generateCode();
        
        // Update JSONBin with the new code
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${CODE_BREAKER_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...dailyCodes,
                [today]: newCode
            })
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to update JSONBin: ${updateResponse.status} ${updateResponse.statusText}`);
        }
        
        // Return the new code
        return res.status(200).json({ code: newCode });
        
    } catch (error) {
        console.error('Error in daily_code API:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
} 