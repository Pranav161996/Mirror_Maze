import fetch from 'node-fetch';

// Function to generate a random 5-digit code with unique digits
function generateRandomCode() {
    const digits = [];
    while (digits.length < 5) {
        const digit = Math.floor(Math.random() * 10);
        if (!digits.includes(digit)) {
            digits.push(digit);
        }
    }
    return digits.join('');
}

// Function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Function to get or generate today's code
async function getTodaysCode() {
    const today = getTodayDate();
    console.log('Getting code for date:', today);
    
    try {
        // Check if we already have a code for today in JSONBin
        console.log('Fetching from JSONBin...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/67fca06c8561e97a50ff0bf1/latest`, {
            headers: {
                'X-Master-Key': process.env.JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            console.error('JSONBin fetch failed:', response.status, await response.text());
            throw new Error('Failed to fetch from JSONBin');
        }

        const data = await response.json();
        console.log('JSONBin response:', data);
        const storedData = data.record || {};
        
        if (storedData.date === today && storedData.code) {
            console.log('Found existing code for today:', storedData.code);
            return storedData.code;
        }

        // Generate new code for today
        const newCode = generateRandomCode();
        console.log('Generated new code:', newCode);
        
        // Store the new code in JSONBin
        console.log('Storing new code in JSONBin...');
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/67fca06c8561e97a50ff0bf1`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.JSONBIN_API_KEY
            },
            body: JSON.stringify({
                date: today,
                code: newCode
            })
        });

        if (!updateResponse.ok) {
            console.error('JSONBin update failed:', updateResponse.status, await updateResponse.text());
            throw new Error('Failed to update JSONBin');
        }

        console.log('Successfully stored new code in JSONBin');
        return newCode;
    } catch (error) {
        console.error('Error in getTodaysCode:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!process.env.JSONBIN_API_KEY) {
            throw new Error('Missing required environment variables');
        }

        const code = await getTodaysCode();
        res.status(200).json({ code });
    } catch (error) {
        console.error('Error in daily_code API:', error);
        res.status(500).json({ error: 'Failed to get daily code' });
    }
} 