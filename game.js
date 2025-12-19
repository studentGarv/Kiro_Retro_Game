/**
 * AI-Powered Snake Game with Win95 Retro UI
 * Modern AI features with classic gameplay
 */

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 24;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress);
        
        // Initialize display
        this.draw();
    }
    
    generateFood() {
        return {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
    }
    
    handleKeyPress(event) {
        if (!this.gameRunning && !this.gameOver) {
            this.startGame();
            return;
        }
        
        if (this.gameOver) {
            if (event.code === 'Space') {
                this.resetGame();
            }
            return;
        }
        
        // Prevent reverse direction
        switch (event.code) {
            case 'ArrowUp':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.dx = 1;
        this.dy = 0;
        this.gameLoop();
    }
    
    resetGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.draw();
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        // Move snake head
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver = true;
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            // Make sure food doesn't spawn on snake
            while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
                this.food = this.generateFood();
            }
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#008000';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        // Draw food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 1,
            this.food.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
        
        // Draw score
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '16px monospace';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        } else if (!this.gameRunning) {
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press any arrow key to start', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning && !this.gameOver) {
            setTimeout(this.gameLoop, 150);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});
   