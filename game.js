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
        this.gamePaused = false;

        // Initialize AI Engine
        this.aiEngine = new AIEngine();
        this.lastMoveTime = 0;
        this.lastUpdateTime = 0;
        this.moveInterval = 150; // Base move interval in ms

        // Adjust canvas size for mobile
        this.adjustCanvasSize();

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);

        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress);

        // Canvas context loss handling
        this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('Canvas context lost');
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('Canvas context restored');
            this.draw();
        });

        // Touch and swipe controls
        this.setupTouchControls();

        // Initialize display
        this.draw();
        this.updateUI();
    }

    generateFood() {
        // Use AI-driven food placement if available
        if (this.aiEngine && this.gameRunning) {
            try {
                const aiFood = this.aiEngine.calculateOptimalFoodPosition(
                    this.snake,
                    null,
                    this.tileCount
                );
                if (aiFood) {
                    return aiFood;
                }
            } catch (error) {
                console.warn('AI food placement failed, using random placement:', error);
            }
        }

        // Fallback to random placement with buffer zone
        const buffer = 1; // 1-tile buffer from edges
        let food;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            // Try with buffer zone first
            if (attempts < maxAttempts / 2) {
                food = {
                    x: buffer + Math.floor(Math.random() * (this.tileCount - 2 * buffer)),
                    y: buffer + Math.floor(Math.random() * (this.tileCount - 2 * buffer))
                };
            } else {
                // Fallback to full grid if buffer zone fails
                food = {
                    x: Math.floor(Math.random() * this.tileCount),
                    y: Math.floor(Math.random() * this.tileCount)
                };
            }
            attempts++;
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y) && attempts < maxAttempts);

        return food;
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

        if (this.gamePaused) {
            return;
        }

        const currentTime = performance.now();
        const reactionTime = currentTime - this.lastMoveTime;

        // Prevent reverse direction and record movement
        let newDirection = null;
        switch (event.code) {
            case 'ArrowUp':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                    newDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                    newDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                    newDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                    newDirection = 'right';
                }
                break;
        }

        // Record movement with AI engine
        if (newDirection && this.gameRunning) {
            try {
                this.aiEngine.analyzeMovement(newDirection, reactionTime);
                this.lastMoveTime = currentTime;
            } catch (error) {
                console.warn('AI movement analysis failed:', error);
            }
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;
        this.dx = 1;
        this.dy = 0;
        this.lastMoveTime = performance.now();
        this.lastUpdateTime = 0;
        this.aiEngine.reset();
        this.updateUI();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    pauseGame() {
        if (this.gameRunning && !this.gameOver) {
            this.gamePaused = !this.gamePaused;
            if (!this.gamePaused) {
                this.lastUpdateTime = 0; // Reset timing
                requestAnimationFrame((time) => this.gameLoop(time));
            }
        }
        this.updateUI();
    }

    resetGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.gamePaused = false;
        this.aiEngine.reset();
        this.updateUI();
        this.draw();
    }

    update() {
        if (!this.gameRunning || this.gameOver || this.gamePaused) return;

        // Move snake head
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver = true;
            this.aiEngine.recordCollision();
            this.updateUI();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            this.aiEngine.recordCollision();
            this.updateUI();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.aiEngine.recordFoodCollection();
            this.food = this.generateFood();
            // Make sure food doesn't spawn on snake
            while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
                this.food = this.generateFood();
            }
        } else {
            this.snake.pop();
        }

        // Update AI and UI
        try {
            this.aiEngine.adjustDifficulty();
        } catch (error) {
            console.warn('AI difficulty adjustment failed:', error);
        }
        this.updateUI();
    }

    draw() {
        try {
            // Clear canvas with appropriate background color
            // Gray for desktop (retro), black for mobile (modern)
            this.ctx.fillStyle = isMobile() ? '#000000' : '#c0c0c0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw prediction hint if enabled
            if (this.aiEngine.aiSettings.showPredictions && this.gameRunning && !this.gameOver && !this.gamePaused) {
                this.drawPredictionHint();
            }

            // Draw snake
            this.snake.forEach((segment, index) => {
                if (index === 0) {
                    // Draw triangular head pointing in movement direction
                    this.drawSnakeHead(segment);
                } else {
                    // Draw regular body segments
                    this.ctx.fillStyle = '#008000';
                    this.ctx.fillRect(
                        segment.x * this.gridSize + 1,
                        segment.y * this.gridSize + 1,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                }
            });

            // Draw food with AI indicator
            if (this.aiEngine.aiSettings.smartFoodPlacement) {
                this.ctx.fillStyle = '#ff00ff'; // Magenta for AI food
            } else {
                this.ctx.fillStyle = '#ff0000'; // Red for random food
            }
            this.ctx.fillRect(
                this.food.x * this.gridSize + 1,
                this.food.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );


            // Draw score
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px monospace';
            this.ctx.fillText(`Score: ${this.score}`, 10, 25);

            // Draw AI activity indicator
            if (this.gameRunning && !this.gameOver) {
                this.drawAIActivityIndicator();
            }

            // Draw touch feedback and swipe indicators
            this.drawTouchFeedback();

            // Draw game over message
            if (this.gameOver) {
                this.drawGameOverScreen();
            } else if (!this.gameRunning) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '18px monospace';
                this.ctx.textAlign = 'center';

                if (isMobile()) {
                    this.ctx.font = '24px monospace';
                    this.ctx.fillText('AI Snake \'95', this.canvas.width / 2, this.canvas.height / 2 - 40);
                    this.ctx.font = '16px monospace';
                    this.ctx.fillText('Swipe anywhere to move', this.canvas.width / 2, this.canvas.height / 2 - 10);
                    this.ctx.font = '14px monospace';
                    this.ctx.fillText('Tap to start playing', this.canvas.width / 2, this.canvas.height / 2 + 20);
                } else {
                    this.ctx.fillText('Press any arrow key to start', this.canvas.width / 2, this.canvas.height / 2);
                }
                this.ctx.textAlign = 'left';
            } else if (this.gamePaused) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.textAlign = 'left';
            }
        } catch (error) {
            console.error('Rendering error:', error);
            // Try to recover by reinitializing context
            this.ctx = this.canvas.getContext('2d');
        }
    }

    drawPredictionHint() {
        const head = this.snake[0];
        const currentDirection = this.getCurrentDirection();
        const prediction = this.aiEngine.predictNextMove(currentDirection, head, null);

        if (prediction && prediction !== currentDirection) {
            let nextX = head.x;
            let nextY = head.y;

            switch (prediction) {
                case 'up': nextY--; break;
                case 'down': nextY++; break;
                case 'left': nextX--; break;
                case 'right': nextX++; break;
            }

            // Only draw if within bounds
            if (nextX >= 0 && nextX < this.tileCount && nextY >= 0 && nextY < this.tileCount) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                this.ctx.fillRect(
                    nextX * this.gridSize + 1,
                    nextY * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );

                // Draw dashed border
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.setLineDash([3, 3]);
                this.ctx.strokeRect(
                    nextX * this.gridSize + 1,
                    nextY * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                this.ctx.setLineDash([]);
            }
        }
    }

    drawAIActivityIndicator() {
        const aiStatus = this.aiEngine.getAIStatus();
        const intensity = aiStatus.difficulty / 100;

        // Draw small AI activity indicator in corner
        this.ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + intensity * 0.7})`;
        this.ctx.fillRect(this.canvas.width - 30, 10, 20, 8);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('AI', this.canvas.width - 28, 20);
    }

    drawTouchFeedback() {
        // Touch feedback disabled for cleaner mobile experience
        // Swipe direction indicators removed
    }

    drawSnakeHead(headSegment) {
        const x = headSegment.x * this.gridSize;
        const y = headSegment.y * this.gridSize;
        const size = this.gridSize;
        const padding = 1;

        // Set head color
        this.ctx.fillStyle = '#00aa00';

        // Get current direction
        const direction = this.getCurrentDirection();

        // Draw triangular head based on direction
        this.ctx.beginPath();

        switch (direction) {
            case 'right':
                // Triangle pointing right
                this.ctx.moveTo(x + padding, y + padding);
                this.ctx.lineTo(x + size - padding, y + size / 2);
                this.ctx.lineTo(x + padding, y + size - padding);
                break;
            case 'left':
                // Triangle pointing left
                this.ctx.moveTo(x + size - padding, y + padding);
                this.ctx.lineTo(x + padding, y + size / 2);
                this.ctx.lineTo(x + size - padding, y + size - padding);
                break;
            case 'up':
                // Triangle pointing up
                this.ctx.moveTo(x + padding, y + size - padding);
                this.ctx.lineTo(x + size / 2, y + padding);
                this.ctx.lineTo(x + size - padding, y + size - padding);
                break;
            case 'down':
                // Triangle pointing down
                this.ctx.moveTo(x + padding, y + padding);
                this.ctx.lineTo(x + size / 2, y + size - padding);
                this.ctx.lineTo(x + size - padding, y + padding);
                break;
            default:
                // Default to right-pointing triangle
                this.ctx.moveTo(x + padding, y + padding);
                this.ctx.lineTo(x + size - padding, y + size / 2);
                this.ctx.lineTo(x + padding, y + size - padding);
                break;
        }

        this.ctx.closePath();
        this.ctx.fill();

        // Add a subtle border for better visibility
        this.ctx.strokeStyle = '#006600';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawGameOverScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const aiStatus = this.aiEngine.getAIStatus();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 60);

        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 30);

        // AI Performance Summary
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`AI Skill Assessment: Level ${aiStatus.skillLevel}/5`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Success Rate: ${aiStatus.successRate}%`, this.canvas.width / 2, this.canvas.height / 2 + 15);
        this.ctx.fillText(`Total Moves: ${aiStatus.totalMoves}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

        // Different restart message for mobile vs desktop
        this.ctx.font = '14px monospace';
        if (isMobile()) {
            this.ctx.fillText('Touch anywhere to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        } else {
            this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        this.ctx.textAlign = 'left';
    }

    getCurrentDirection() {
        if (this.dx === 1) return 'right';
        if (this.dx === -1) return 'left';
        if (this.dy === 1) return 'down';
        if (this.dy === -1) return 'up';
        return 'right'; // default
    }

    setupTouchControls() {
        // Enhanced swipe gesture recognition for fullscreen mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let touchStartTime = 0;
        let isSwipeInProgress = false;

        // Add swipe visual feedback
        this.swipeIndicator = null;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isSwipeInProgress = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isSwipeInProgress) {
                const touch = e.changedTouches[0];
                touchEndX = touch.clientX;
                touchEndY = touch.clientY;
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isSwipeInProgress) {
                const touch = e.changedTouches[0];
                touchEndX = touch.clientX;
                touchEndY = touch.clientY;
                const touchDuration = Date.now() - touchStartTime;

                this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, touchDuration);
                isSwipeInProgress = false;
                this.clearSwipePreview();
            }
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            isSwipeInProgress = false;
            this.clearSwipePreview();
        });

        // Prevent scrolling and zooming on mobile
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    handleDirectionInput(direction) {
        if (!this.gameRunning && !this.gameOver) {
            this.startGame();
            return;
        }

        if (this.gameOver || this.gamePaused) {
            return;
        }

        const currentTime = performance.now();
        const reactionTime = currentTime - this.lastMoveTime;

        // Prevent reverse direction and record movement
        let validMove = false;
        switch (direction) {
            case 'up':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                    validMove = true;
                }
                break;
            case 'down':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                    validMove = true;
                }
                break;
            case 'left':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                    validMove = true;
                }
                break;
            case 'right':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                    validMove = true;
                }
                break;
        }

        // Record movement with AI engine
        if (validMove && this.gameRunning) {
            try {
                this.aiEngine.analyzeMovement(direction, reactionTime);
                this.lastMoveTime = currentTime;
            } catch (error) {
                console.warn('AI movement analysis failed:', error);
            }
        }
    }

    handleSwipe(startX, startY, endX, endY, duration = 0) {
        const minSwipeDistance = 25; // Reduced for more responsive controls
        const maxSwipeTime = 500; // Maximum time for a valid swipe (ms)
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if swipe is long enough and fast enough
        if (distance < minSwipeDistance || duration > maxSwipeTime) {
            // Tap to start game if not running
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            }
            // Tap to restart game if game is over
            else if (this.gameOver) {
                this.resetGame();
            }
            return;
        }

        // If game is over, any swipe should restart
        if (this.gameOver) {
            this.resetGame();
            return;
        }

        // Determine swipe direction with improved accuracy
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        let direction = null;

        // Convert angle to direction (with 45-degree zones)
        if (angle >= -45 && angle <= 45) {
            direction = 'right';
        } else if (angle >= 45 && angle <= 135) {
            direction = 'down';
        } else if (angle >= -135 && angle <= -45) {
            direction = 'up';
        } else {
            direction = 'left';
        }

        // Add haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        this.handleDirectionInput(direction);
    }

    showTouchFeedback(x, y) {
        // Touch feedback disabled for cleaner mobile experience
    }

    showSwipePreview(startX, startY, endX, endY) {
        // Swipe preview disabled for cleaner mobile experience
    }

    clearSwipePreview() {
        // No visual feedback to clear
    }

    adjustCanvasSize() {
        if (isMobile()) {
            // Make canvas fill the screen on mobile
            const updateCanvasSize = () => {
                const canvas = this.canvas;
                const container = canvas.parentElement;

                // Get the actual viewport size
                const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

                // Set canvas to fill viewport
                canvas.style.width = vw + 'px';
                canvas.style.height = vh + 'px';

                // Maintain square aspect ratio for game logic
                const size = Math.min(vw, vh);
                canvas.width = size;
                canvas.height = size;

                // Update grid size to maintain game proportions
                this.gridSize = Math.floor(size / 20); // 20x20 grid
                this.tileCount = Math.floor(size / this.gridSize);

                // Redraw if game is initialized
                if (this.snake) {
                    this.draw();
                }
            };

            // Update on load and resize
            updateCanvasSize();
            window.addEventListener('resize', updateCanvasSize);
            window.addEventListener('orientationchange', () => {
                setTimeout(updateCanvasSize, 100);
            });
        } else {
            // Desktop: Keep original canvas size and grid
            this.canvas.width = 480;
            this.canvas.height = 480;
            this.gridSize = 24;
            this.tileCount = 20;
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.gameRunning || this.gameOver || this.gamePaused) {
            return;
        }

        // Calculate time since last update
        const deltaTime = currentTime - this.lastUpdateTime;

        // Use AI-adjusted speed
        const baseSpeed = 150;
        const difficulty = this.aiEngine.gameState.currentDifficulty;
        const adjustedSpeed = Math.max(50, baseSpeed - (difficulty * 100));

        // Only update game state if enough time has passed
        if (deltaTime >= adjustedSpeed) {
            this.update();
            this.lastUpdateTime = currentTime;
        }

        // Always draw to maintain smooth visuals
        this.draw();

        // Continue game loop
        if (this.gameRunning && !this.gameOver && !this.gamePaused) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    updateUI() {
        // Update score
        document.getElementById('score').textContent = this.score;

        // Update AI status
        const aiStatus = this.aiEngine.getAIStatus();
        document.getElementById('difficulty-fill').style.width = `${aiStatus.difficulty}%`;
        document.getElementById('strategy').textContent = aiStatus.strategy;
        document.getElementById('prediction').textContent = this.getDirectionSymbol(aiStatus.prediction);

        // Update button states
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');

        if (this.gameOver) {
            startBtn.textContent = 'Start Game';
            pauseBtn.disabled = true;
        } else if (this.gameRunning) {
            startBtn.textContent = 'Restart';
            pauseBtn.disabled = false;
            pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
        } else {
            startBtn.textContent = 'Start Game';
            pauseBtn.disabled = true;
        }
    }

    getDirectionSymbol(direction) {
        const symbols = {
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→'
        };
        return symbols[direction] || '?';
    }
}

// Global functions for HTML buttons
function startGame() {
    if (window.game) {
        window.game.startGame();
    }
}

function pauseGame() {
    if (window.game) {
        window.game.pauseGame();
    }
}

function resetGame() {
    if (window.game) {
        window.game.resetGame();
    }
}

// AI Settings functions
function toggleAIHints() {
    if (window.game) {
        const checkbox = document.getElementById('ai-hints');
        window.game.aiEngine.updateSettings({ showPredictions: checkbox.checked });
        window.game.updateUI();
    }
}

function toggleAdaptiveDifficulty() {
    if (window.game) {
        const checkbox = document.getElementById('adaptive-difficulty');
        window.game.aiEngine.updateSettings({ adaptiveDifficulty: checkbox.checked });
    }
}

function toggleSmartFood() {
    if (window.game) {
        const checkbox = document.getElementById('smart-food');
        window.game.aiEngine.updateSettings({ smartFoodPlacement: checkbox.checked });
    }
}

// Window control functions
function minimizeWindow() {
    const gameWindow = document.getElementById('game-window');
    const taskbarApp = document.getElementById('snake-taskbar');
    const isMinimized = gameWindow.style.display === 'none';

    if (isMinimized) {
        // Restore window
        gameWindow.style.display = 'block';
        gameWindow.style.transform = 'scale(1)';
        gameWindow.style.opacity = '1';

        // Update taskbar button
        taskbarApp.classList.remove('minimized');

        // Update title bar
        const titleText = document.querySelector('.title-bar-text');
        if (window.game && window.game.gameRunning) {
            titleText.textContent = 'AI Snake \'95 - [Playing]';
        } else {
            titleText.textContent = 'AI Snake \'95 - [Ready]';
        }

        // Resume game if it was running
        if (window.game && window.game.gameRunning && window.game.gamePaused) {
            window.game.pauseGame();
        }
    } else {
        // Minimize window with animation
        gameWindow.style.transform = 'scale(0.1)';
        gameWindow.style.opacity = '0';

        // Update taskbar button
        taskbarApp.classList.add('minimized');

        // Pause game if running
        if (window.game && window.game.gameRunning && !window.game.gamePaused) {
            window.game.pauseGame();
        }

        setTimeout(() => {
            gameWindow.style.display = 'none';

            // Update title bar for minimized state
            const titleText = document.querySelector('.title-bar-text');
            titleText.textContent = 'AI Snake \'95 - [Minimized]';
        }, 200);
    }
}

function toggleFullscreen() {
    const gameWindow = document.getElementById('game-window');
    const isFullscreen = gameWindow.classList.contains('fullscreen');

    if (isFullscreen) {
        // Exit fullscreen
        gameWindow.classList.remove('fullscreen');
        gameWindow.style.width = '800px';
        gameWindow.style.height = '600px';
        gameWindow.style.top = '50px';
        gameWindow.style.left = '50px';

        // Update button symbol
        const fullscreenBtn = document.querySelector('.title-bar-control:nth-child(2)');
        fullscreenBtn.textContent = '□';
    } else {
        // Enter fullscreen
        gameWindow.classList.add('fullscreen');
        gameWindow.style.width = '95vw';
        gameWindow.style.height = '90vh';
        gameWindow.style.top = '20px';
        gameWindow.style.left = '2.5vw';

        // Update button symbol
        const fullscreenBtn = document.querySelector('.title-bar-control:nth-child(2)');
        fullscreenBtn.textContent = '❐';
    }
}

function closeGame() {
    // Show confirmation dialog in Win95 style
    const confirmed = confirm('Are you sure you want to close AI Snake \'95?');

    if (confirmed) {
        // Pause the game
        if (window.game && window.game.gameRunning) {
            window.game.pauseGame();
        }

        // Hide the game window with animation
        const gameWindow = document.getElementById('game-window');
        gameWindow.style.transform = 'scale(0.8)';
        gameWindow.style.opacity = '0';

        setTimeout(() => {
            gameWindow.style.display = 'none';

            // Show desktop message
            showDesktopMessage();
        }, 200);
    }
}

function showDesktopMessage() {
    // Create a desktop message window
    const desktop = document.querySelector('.desktop');
    const messageWindow = document.createElement('div');
    messageWindow.className = 'message-window';
    messageWindow.innerHTML = `
        <div class="title-bar">
            <div class="title-bar-text">AI Snake '95 - Closed</div>
            <div class="title-bar-controls">
                <button class="title-bar-control close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
        </div>
        <div class="message-content">
            <div class="message-icon">🐍</div>
            <div class="message-text">
                <p>Thanks for playing AI Snake '95!</p>
                <p>Your AI companion learned a lot from your gameplay.</p>
                <button class="retro-button" onclick="restartGame()">Play Again</button>
            </div>
        </div>
    `;

    messageWindow.style.cssText = `
        position: absolute;
        top: 200px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        z-index: 1001;
    `;

    // Style the message content
    const style = document.createElement('style');
    style.textContent = `
        .message-content {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .message-icon {
            font-size: 32px;
        }
        .message-text p {
            margin: 5px 0;
            font-size: 11px;
        }
        .message-window .retro-button {
            margin-top: 10px;
        }
    `;
    document.head.appendChild(style);

    desktop.appendChild(messageWindow);
}

function restartGame() {
    // Remove any message windows
    const messageWindows = document.querySelectorAll('.message-window');
    messageWindows.forEach(window => window.remove());

    // Show and reset the game window
    const gameWindow = document.getElementById('game-window');
    gameWindow.style.display = 'block';
    gameWindow.style.transform = 'scale(1)';
    gameWindow.style.opacity = '1';

    // Update title bar
    const titleText = document.querySelector('.title-bar-text');
    titleText.textContent = 'AI Snake \'95 - [Ready]';

    // Reset the game
    if (window.game) {
        window.game.resetGame();
    }
}

// Menu functions
function showAbout() {
    alert('AI Snake \'95\n\nA retro Snake game enhanced with artificial intelligence!\n\nThe AI learns from your gameplay patterns and adapts the challenge accordingly.\n\nVersion 1.0\n© 2024 Retro Gaming AI');
}

function showSettings() {
    alert('AI Settings are available in the right panel of the game window.\n\nYou can toggle:\n• AI Predictions\n• Adaptive Difficulty\n• Smart Food Placement');
}

function showStats() {
    if (window.game) {
        const aiStatus = window.game.aiEngine.getAIStatus();
        alert(`Game Statistics:\n\nCurrent Score: ${window.game.score}\nSkill Level: ${aiStatus.skillLevel}/5\nTotal Moves: ${aiStatus.totalMoves}\nSuccess Rate: ${aiStatus.successRate}%\nAI Strategy: ${aiStatus.strategy}`);
    } else {
        alert('No game statistics available. Start a game first!');
    }
}

function showHelp() {
    alert('How to Play AI Snake \'95:\n\n• Use arrow keys to control the snake\n• Eat food to grow and increase score\n• Avoid hitting walls or yourself\n• Watch the AI panels to see how the AI adapts to your play style\n\nAI Features:\n• Yellow squares show predicted moves\n• Magenta food indicates AI placement\n• Difficulty bar shows current challenge level\n• AI strategy adapts to your performance');
}

// Mobile detection
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 900;
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();

    // Set up AI settings event listeners
    document.getElementById('ai-hints').addEventListener('change', toggleAIHints);
    document.getElementById('adaptive-difficulty').addEventListener('change', toggleAdaptiveDifficulty);
    document.getElementById('smart-food').addEventListener('change', toggleSmartFood);

    // Mobile-specific setup
    if (isMobile()) {
        // Adjust window for mobile fullscreen
        const gameWindow = document.getElementById('game-window');
        gameWindow.classList.add('mobile-mode');

        // Hide desktop-specific elements
        const taskbar = document.querySelector('.taskbar');
        if (taskbar) {
            taskbar.style.display = 'none';
        }

        // Set mobile title
        const titleText = document.querySelector('.title-bar-text');
        if (titleText) {
            titleText.textContent = 'AI Snake \'95 - [Mobile]';
        }

        // Prevent zoom and scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    // Update taskbar time (desktop only)
    if (!isMobile()) {
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timeElement = document.getElementById('taskbar-time');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Handle orientation changes on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.game) {
                window.game.draw();
            }
        }, 100);
    });
});
