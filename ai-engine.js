/**
 * AI Engine for Smart Snake Game
 * Handles adaptive difficulty, smart food placement, and player behavior analysis
 */

class AIEngine {
    constructor() {
        this.playerStats = {
            totalMoves: 0,
            averageReactionTime: 0,
            preferredDirections: { up: 0, down: 0, left: 0, right: 0 },
            movementPatterns: [],
            skillLevel: 1,
            lastMoves: [],
            collisionCount: 0,
            foodCollected: 0,
            playTime: 0
        };
        
        this.aiSettings = {
            adaptiveDifficulty: true,
            smartFoodPlacement: true,
            showPredictions: true,
            learningRate: 0.1,
            difficultyAdjustmentRate: 0.05
        };
        
        this.gameState = {
            currentDifficulty: 0.3,
            lastFoodPlacement: null,
            predictedNextMove: null,
            currentStrategy: 'learning',
            patternRecognition: new Map()
        };
        
        this.startTime = Date.now();
    }
    
    // Analyze player movement patterns
    analyzeMovement(direction, reactionTime) {
        this.playerStats.totalMoves++;
        this.playerStats.averageReactionTime = 
            (this.playerStats.averageReactionTime * (this.playerStats.totalMoves - 1) + reactionTime) / this.playerStats.totalMoves;
        
        this.playerStats.preferredDirections[direction]++;
        this.playerStats.lastMoves.push(direction);
        
        // Keep only last 10 moves for pattern analysis
        if (this.playerStats.lastMoves.length > 10) {
            this.playerStats.lastMoves.shift();
        }
        
        this.updateMovementPatterns();
        this.adjustSkillLevel();
    }
    
    // Update movement patterns for prediction
    updateMovementPatterns() {
        if (this.playerStats.lastMoves.length >= 3) {
            const pattern = this.playerStats.lastMoves.slice(-3).join('');
            const count = this.gameState.patternRecognition.get(pattern) || 0;
            this.gameState.patternRecognition.set(pattern, count + 1);
        }
    }
    
    // Predict next move based on patterns
    predictNextMove(currentDirection, snakeHead, gameBoard) {
        if (!this.aiSettings.showPredictions) return null;
        
        // Simple prediction based on recent patterns
        if (this.playerStats.lastMoves.length >= 2) {
            const recentPattern = this.playerStats.lastMoves.slice(-2).join('');
            let bestNextMove = currentDirection;
            let maxCount = 0;
            
            for (let [pattern, count] of this.gameState.patternRecognition) {
                if (pattern.startsWith(recentPattern) && count > maxCount) {
                    maxCount = count;
                    bestNextMove = pattern.charAt(2);
                }
            }
            
            this.gameState.predictedNextMove = bestNextMove;
            return bestNextMove;
        }
        
        return currentDirection;
    }
    
    // Adjust skill level based on performance
    adjustSkillLevel() {
        const successRate = this.playerStats.foodCollected / Math.max(1, this.playerStats.collisionCount + this.playerStats.foodCollected);
        const avgReactionTime = this.playerStats.averageReactionTime;
        
        // Calculate skill based on success rate and reaction time
        let newSkillLevel = 1;
        if (successRate > 0.8 && avgReactionTime < 200) newSkillLevel = 5;
        else if (successRate > 0.6 && avgReactionTime < 300) newSkillLevel = 4;
        else if (successRate > 0.4 && avgReactionTime < 500) newSkillLevel = 3;
        else if (successRate > 0.2) newSkillLevel = 2;
        
        this.playerStats.skillLevel = Math.max(1, Math.min(5, newSkillLevel));
    }
    
    // Smart food placement algorithm
    calculateOptimalFoodPosition(snake, gameBoard, gridSize) {
        if (!this.aiSettings.smartFoodPlacement) {
            return this.getRandomFoodPosition(snake, gameBoard, gridSize);
        }
        
        const head = snake[0];
        const possiblePositions = [];
        
        // Get all empty positions
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (!this.isPositionOccupied(x, y, snake)) {
                    possiblePositions.push({ x, y });
                }
            }
        }
        
        if (possiblePositions.length === 0) return null;
        
        // Score positions based on AI strategy
        const scoredPositions = possiblePositions.map(pos => ({
            ...pos,
            score: this.scoreFoodPosition(pos, head, snake)
        }));
        
        // Sort by score and add some randomness
        scoredPositions.sort((a, b) => b.score - a.score);
        
        // Choose from top 30% with weighted randomness
        const topPositions = scoredPositions.slice(0, Math.max(1, Math.floor(scoredPositions.length * 0.3)));
        const weights = topPositions.map((_, i) => Math.pow(0.8, i));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < topPositions.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                this.gameState.lastFoodPlacement = topPositions[i];
                return topPositions[i];
            }
        }
        
        return topPositions[0];
    }
    
    // Score food positions based on current strategy
    scoreFoodPosition(position, head, snake) {
        const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
        let score = 0;
        
        switch (this.gameState.currentStrategy) {
            case 'learning':
                // Moderate challenge - not too easy, not too hard
                score = 100 - Math.abs(distance - 5) * 10;
                break;
                
            case 'challenging':
                // Place food in harder to reach positions
                score = distance * 5;
                // Bonus for positions that require direction changes
                if (this.requiresDirectionChange(position, head, snake)) {
                    score += 30;
                }
                break;
                
            case 'encouraging':
                // Place food closer to encourage the player
                score = 100 - distance * 15;
                break;
                
            case 'pattern-breaking':
                // Place food to break player's movement patterns
                if (this.breaksMovementPattern(position, head)) {
                    score += 50;
                }
                score += Math.random() * 20; // Add randomness
                break;
        }
        
        // Avoid positions too close to snake body
        for (let segment of snake.slice(1)) {
            const segmentDistance = Math.abs(position.x - segment.x) + Math.abs(position.y - segment.y);
            if (segmentDistance < 2) {
                score -= 50;
            }
        }
        
        return score;
    }
    
    // Check if position requires direction change
    requiresDirectionChange(position, head, snake) {
        if (snake.length < 2) return false;
        
        const currentDirection = this.getCurrentDirection(snake);
        const toFoodDirection = this.getDirectionToPosition(head, position);
        
        return currentDirection !== toFoodDirection;
    }
    
    // Check if position breaks movement patterns
    breaksMovementPattern(position, head) {
        const preferredDir = this.getMostPreferredDirection();
        const toFoodDirection = this.getDirectionToPosition(head, position);
        
        return preferredDir !== toFoodDirection;
    }
    
    // Get current snake direction
    getCurrentDirection(snake) {
        if (snake.length < 2) return 'right';
        
        const head = snake[0];
        const neck = snake[1];
        
        if (head.x > neck.x) return 'right';
        if (head.x < neck.x) return 'left';
        if (head.y > neck.y) return 'down';
        return 'up';
    }
    
    // Get direction from one position to another
    getDirectionToPosition(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }
    
    // Get most preferred direction
    getMostPreferredDirection() {
        const prefs = this.playerStats.preferredDirections;
        return Object.keys(prefs).reduce((a, b) => prefs[a] > prefs[b] ? a : b);
    }
    
    // Random food position fallback
    getRandomFoodPosition(snake, gameBoard, gridSize) {
        const possiblePositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (!this.isPositionOccupied(x, y, snake)) {
                    possiblePositions.push({ x, y });
                }
            }
        }
        
        if (possiblePositions.length === 0) return null;
        
        return possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
    }
    
    // Check if position is occupied by snake
    isPositionOccupied(x, y, snake) {
        return snake.some(segment => segment.x === x && segment.y === y);
    }
    
    // Update AI strategy based on player performance
    updateStrategy() {
        const recentPerformance = this.analyzeRecentPerformance();
        
        if (recentPerformance.struggling) {
            this.gameState.currentStrategy = 'encouraging';
        } else if (recentPerformance.excelling) {
            this.gameState.currentStrategy = 'challenging';
        } else if (recentPerformance.repetitive) {
            this.gameState.currentStrategy = 'pattern-breaking';
        } else {
            this.gameState.currentStrategy = 'learning';
        }
    }
    
    // Analyze recent performance
    analyzeRecentPerformance() {
        const totalMoves = this.playerStats.totalMoves;
        const recentCollisions = this.playerStats.collisionCount;
        const avgReactionTime = this.playerStats.averageReactionTime;
        
        return {
            struggling: recentCollisions > 3 || avgReactionTime > 800,
            excelling: this.playerStats.skillLevel >= 4 && avgReactionTime < 250,
            repetitive: this.isMovementRepetitive()
        };
    }
    
    // Check if movement is repetitive
    isMovementRepetitive() {
        if (this.playerStats.lastMoves.length < 6) return false;
        
        const recent = this.playerStats.lastMoves.slice(-6);
        const pattern = recent.slice(0, 3).join('');
        const repeated = recent.slice(3, 6).join('');
        
        return pattern === repeated;
    }
    
    // Adjust difficulty dynamically
    adjustDifficulty() {
        if (!this.aiSettings.adaptiveDifficulty) return;
        
        const targetDifficulty = this.calculateTargetDifficulty();
        const currentDiff = this.gameState.currentDifficulty;
        
        // Smooth difficulty adjustment
        this.gameState.currentDifficulty = currentDiff + 
            (targetDifficulty - currentDiff) * this.aiSettings.difficultyAdjustmentRate;
        
        // Clamp between 0.1 and 1.0
        this.gameState.currentDifficulty = Math.max(0.1, Math.min(1.0, this.gameState.currentDifficulty));
    }
    
    // Calculate target difficulty based on player skill
    calculateTargetDifficulty() {
        const skillLevel = this.playerStats.skillLevel;
        const baseTargets = [0.2, 0.35, 0.5, 0.7, 0.9];
        
        return baseTargets[skillLevel - 1] || 0.3;
    }
    
    // Record collision for analysis
    recordCollision() {
        this.playerStats.collisionCount++;
        this.updateStrategy();
    }
    
    // Record food collection
    recordFoodCollection() {
        this.playerStats.foodCollected++;
        this.updateStrategy();
    }
    
    // Get current AI status for UI
    getAIStatus() {
        return {
            difficulty: Math.round(this.gameState.currentDifficulty * 100),
            strategy: this.gameState.currentStrategy,
            prediction: this.gameState.predictedNextMove,
            skillLevel: this.playerStats.skillLevel,
            totalMoves: this.playerStats.totalMoves,
            successRate: Math.round((this.playerStats.foodCollected / 
                Math.max(1, this.playerStats.collisionCount + this.playerStats.foodCollected)) * 100)
        };
    }
    
    // Update settings
    updateSettings(newSettings) {
        Object.assign(this.aiSettings, newSettings);
    }
    
    // Reset AI state for new game
    reset() {
        this.playerStats = {
            totalMoves: 0,
            averageReactionTime: 0,
            preferredDirections: { up: 0, down: 0, left: 0, right: 0 },
            movementPatterns: [],
            skillLevel: 1,
            lastMoves: [],
            collisionCount: 0,
            foodCollected: 0,
            playTime: 0
        };
        
        this.gameState.currentDifficulty = 0.3;
        this.gameState.currentStrategy = 'learning';
        this.gameState.patternRecognition.clear();
        this.startTime = Date.now();
    }
}