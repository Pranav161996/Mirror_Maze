class MirrorMaze {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 0;
        this.cellSize = 40;
        this.gameState = {
            player1: { x: 0, y: 0 },
            player2: { x: 0, y: 0 },
            goal1: { x: 0, y: 0 },
            goal2: { x: 0, y: 0 },
            walls: []
        };
        
        this.timer = {
            startTime: 0,
            currentTime: 0,
            isRunning: false,
            levelTimes: []
        };
        
        this.setupEventListeners();
        this.loadLevel(0);
        this.resizeCanvas();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        document.getElementById('restartButton').addEventListener('click', () => this.loadLevel(this.currentLevel));
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePlayers(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePlayers(1, 0);
                    break;
                case 'ArrowUp':
                    this.movePlayers(0, -1);
                    break;
                case 'ArrowDown':
                    this.movePlayers(0, 1);
                    break;
            }
        });

        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.movePlayers(dx > 0 ? 1 : -1, 0);
            } else {
                this.movePlayers(0, dy > 0 ? 1 : -1);
            }
        });
    }

    resizeCanvas() {
        const level = LEVELS[this.currentLevel];
        this.canvas.width = level.width * this.cellSize;
        this.canvas.height = level.height * this.cellSize;
        this.draw();
    }

    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        const level = LEVELS[levelIndex];
        
        this.gameState = {
            player1: { ...level.player1 },
            player2: { ...level.player2 },
            goal1: { ...level.goal1 },
            goal2: { ...level.goal2 },
            walls: [...level.walls]
        };

        // Reset and start timer
        this.timer.startTime = Date.now();
        this.timer.isRunning = true;
        this.timer.currentTime = 0;

        document.getElementById('level-number').textContent = levelIndex + 1;
        this.resizeCanvas();
    }

    movePlayers(dx, dy) {
        const newPlayer1 = {
            x: this.gameState.player1.x + dx,
            y: this.gameState.player1.y + dy
        };
        
        const newPlayer2 = {
            x: this.gameState.player2.x - dx,
            y: this.gameState.player2.y - dy
        };

        if (this.isValidMove(newPlayer1) && this.isValidMove(newPlayer2)) {
            this.gameState.player1 = newPlayer1;
            this.gameState.player2 = newPlayer2;
            this.checkWinCondition();
        }
    }

    isValidMove(position) {
        const level = LEVELS[this.currentLevel];
        
        // Check boundaries
        if (position.x < 0 || position.x >= level.width ||
            position.y < 0 || position.y >= level.height) {
            return false;
        }

        // Check walls
        for (const wall of this.gameState.walls) {
            if (wall.x === position.x && wall.y === position.y) {
                return false;
            }
        }

        return true;
    }

    checkWinCondition() {
        const { player1, player2, goal1, goal2 } = this.gameState;
        
        // Check if both players are on their respective goals
        const player1OnGoal = player1.x === goal1.x && player1.y === goal1.y;
        const player2OnGoal = player2.x === goal2.x && player2.y === goal2.y;
        
        if (player1OnGoal && player2OnGoal) {
            // Stop timer and record time
            if (this.timer.isRunning) {
                this.timer.isRunning = false;
                const completionTime = (Date.now() - this.timer.startTime) / 1000;
                this.timer.levelTimes[this.currentLevel] = completionTime;
                console.log(`Level ${this.currentLevel + 1} completed in ${completionTime.toFixed(2)} seconds`);
            }

            if (this.currentLevel < LEVELS.length - 1) {
                this.currentLevel++;
                setTimeout(() => {
                    this.loadLevel(this.currentLevel);
                }, 1000);
            } else {
                alert(`Congratulations! You completed all levels!\nTotal time: ${this.timer.levelTimes.reduce((a, b) => a + b, 0).toFixed(2)} seconds`);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update timer if running
        if (this.timer.isRunning) {
            this.timer.currentTime = (Date.now() - this.timer.startTime) / 1000;
        }

        // Draw timer
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Time: ${this.timer.currentTime.toFixed(2)}s`,
            this.canvas.width - 10,
            30
        );

        // Draw grid
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw walls
        this.ctx.fillStyle = '#2c3e50';
        for (const wall of this.gameState.walls) {
            this.ctx.fillRect(
                wall.x * this.cellSize,
                wall.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }

        // Draw goals with matching player colors and flags
        // Goal 1 (for blue player)
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(
            this.gameState.goal1.x * this.cellSize,
            this.gameState.goal1.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
        
        // Draw flag for goal 1
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.gameState.goal1.x * this.cellSize + this.cellSize/2,
            this.gameState.goal1.y * this.cellSize
        );
        this.ctx.lineTo(
            this.gameState.goal1.x * this.cellSize + this.cellSize/2,
            this.gameState.goal1.y * this.cellSize - this.cellSize/2
        );
        this.ctx.lineTo(
            this.gameState.goal1.x * this.cellSize + this.cellSize,
            this.gameState.goal1.y * this.cellSize - this.cellSize/4
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        // Goal 2 (for red player)
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.gameState.goal2.x * this.cellSize,
            this.gameState.goal2.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
        
        // Draw flag for goal 2
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.gameState.goal2.x * this.cellSize + this.cellSize/2,
            this.gameState.goal2.y * this.cellSize
        );
        this.ctx.lineTo(
            this.gameState.goal2.x * this.cellSize + this.cellSize/2,
            this.gameState.goal2.y * this.cellSize - this.cellSize/2
        );
        this.ctx.lineTo(
            this.gameState.goal2.x * this.cellSize + this.cellSize,
            this.gameState.goal2.y * this.cellSize - this.cellSize/4
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Draw players
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(
            this.gameState.player1.x * this.cellSize,
            this.gameState.player1.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.gameState.player2.x * this.cellSize,
            this.gameState.player2.y * this.cellSize,
            this.cellSize,
            this.cellSize
        );
    }

    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new MirrorMaze();
}); 