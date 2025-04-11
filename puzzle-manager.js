const fs = require('fs');
const path = require('path');

class PuzzleManager {
    constructor() {
        this.puzzlesDir = path.join(__dirname, 'puzzles');
        this.upcomingDir = path.join(this.puzzlesDir, 'upcoming');
        this.archiveDir = path.join(this.puzzlesDir, 'archive');
        this.currentFile = path.join(this.puzzlesDir, 'current.json');
        
        // Create directories if they don't exist
        [this.puzzlesDir, this.upcomingDir, this.archiveDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Add a new puzzle for a specific date
    addPuzzle(date, puzzleData) {
        const dateStr = this.formatDate(date);
        const filePath = path.join(this.upcomingDir, `${dateStr}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(puzzleData, null, 2));
        console.log(`Puzzle added for ${dateStr}`);
    }

    // Update the current puzzle (run this daily)
    updateCurrentPuzzle() {
        const today = new Date();
        const todayStr = this.formatDate(today);
        const todayPuzzlePath = path.join(this.upcomingDir, `${todayStr}.json`);

        if (fs.existsSync(todayPuzzlePath)) {
            // Move yesterday's puzzle to archive
            if (fs.existsSync(this.currentFile)) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = this.formatDate(yesterday);
                const archivePath = path.join(this.archiveDir, `${yesterdayStr}.json`);
                fs.renameSync(this.currentFile, archivePath);
            }

            // Set today's puzzle as current
            fs.copyFileSync(todayPuzzlePath, this.currentFile);
            fs.unlinkSync(todayPuzzlePath);
            console.log(`Updated current puzzle to ${todayStr}`);
        } else {
            console.log(`No puzzle scheduled for ${todayStr}`);
        }
    }

    // Get the current puzzle
    getCurrentPuzzle() {
        if (fs.existsSync(this.currentFile)) {
            return JSON.parse(fs.readFileSync(this.currentFile, 'utf8'));
        }
        return null;
    }

    // Helper function to format date as YYYY-MM-DD
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

// Example usage:
const puzzleManager = new PuzzleManager();

// Add a puzzle for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
puzzleManager.addPuzzle(tomorrow, {
    width: 8,
    height: 8,
    player1: { x: 1, y: 1 },
    player2: { x: 6, y: 6 },
    goal1: { x: 6, y: 1 },
    goal2: { x: 1, y: 6 },
    walls: [
        { x: 3, y: 3 }, { x: 4, y: 3 },
        { x: 3, y: 4 }, { x: 4, y: 4 }
    ]
});

// Update current puzzle (run this daily)
puzzleManager.updateCurrentPuzzle();

// Get current puzzle
const currentPuzzle = puzzleManager.getCurrentPuzzle();
console.log('Current puzzle:', currentPuzzle); 