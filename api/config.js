import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        if (!process.env.JSONBIN_API_KEY) {
            console.error('JSONBIN_API_KEY environment variable is not set');
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        res.json({ apiKey: process.env.JSONBIN_API_KEY });
    } catch (error) {
        console.error('Error in config endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 