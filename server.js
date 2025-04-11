const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// API endpoint to get current puzzle
app.get('/api/puzzle', (req, res) => {
    const puzzlePath = path.join(__dirname, 'puzzles', 'current.json');
    if (fs.existsSync(puzzlePath)) {
        const puzzle = JSON.parse(fs.readFileSync(puzzlePath, 'utf8'));
        res.json(puzzle);
    } else {
        res.status(404).json({ error: 'No puzzle available' });
    }
});

// API endpoint to get puzzle archive
app.get('/api/archive/:date', (req, res) => {
    const date = req.params.date;
    const archivePath = path.join(__dirname, 'puzzles', 'archive', `${date}.json`);
    if (fs.existsSync(archivePath)) {
        const puzzle = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
        res.json(puzzle);
    } else {
        res.status(404).json({ error: 'Puzzle not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 