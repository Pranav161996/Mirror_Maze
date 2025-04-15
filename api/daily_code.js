// Generate a deterministic daily code
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
    try {
        if (req.method === 'GET') {
            const code = generateDailyCode();
            console.log('Generated daily code:', code); // For debugging
            res.status(200).json({ code });
        } else {
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error in daily_code API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 