// snake-game.js

let snakeGame = null;
let snakeGameInitialized = false;

function startSnakeGame() {
    console.log('🟢 Запуск игры Змейка...');
    
    if (snakeGameInitialized) {
        console.log('Игра уже инициализирована, перезапускаем...');
        snakeGame?.restartGame();
        return;
    }
    
    // Создаем контейнер для игры
    const gameContainer = document.getElementById('snake-game');
    if (!gameContainer) {
        console.error('❌ Контейнер snake-game не найден!');
        return;
    }
    
    // Очищаем контейнер
    gameContainer.innerHTML = '';
    
    // Создаем структуру игры
    const gameHTML = `
        <div class="snake-container">
            <div class="snake-header">
                <h1>🐍 Змейка</h1>
                <p>Собери как можно больше звёзд!</p>
            </div>
            
            <div class="game-info">
                <div class="info-item">
                    <div class="info-label">ОЧКИ</div>
                    <div class="info-value" id="snake-score">0</div>
                </div>
                <div class="info-item">
                    <div class="info-label">ДЛИНА</div>
                    <div class="info-value" id="snake-length">3</div>
                </div>
                <div class="info-item">
                    <div class="info-label">РЕКОРД</div>
                    <div class="info-value" id="snake-high-score">0</div>
                </div>
            </div>
            
            <div style="position: relative;">
                <canvas id="snake-game-canvas" width="500" height="500"></canvas>
                <div class="game-over-screen" id="snake-game-over">
                    <div class="game-over-content">
                        <h2>ИГРА ОКОНЧЕНА!</h2>
                        <div class="final-score" id="final-score">0</div>
                        <p id="game-over-message">Собери больше звёзд в следующий раз!</p>
                        <button id="snake-restart-btn-over" class="game-btn" style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 15px 30px; font-size: 1.2rem;">
                            <i class="fas fa-redo"></i> Играть снова
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="controls-container">
                <div class="mobile-controls" id="mobile-controls">
                    <button class="control-btn up" id="up-btn">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="control-btn left" id="left-btn">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="control-btn right" id="right-btn">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="control-btn down" id="down-btn">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
                
                <div class="game-buttons">
                    <button id="snake-start-btn" class="game-btn">
                        <i class="fas fa-play"></i> Старт
                    </button>
                    <button id="snake-pause-btn" class="game-btn">
                        <i class="fas fa-pause"></i> Пауза
                    </button>
                    <button id="snake-restart-btn" class="game-btn">
                        <i class="fas fa-redo"></i> Заново
                    </button>
                </div>
            </div>
            
            <div class="instructions">
                <h3><i class="fas fa-info-circle"></i> Управление:</h3>
                <ul>
                    <li><i class="fas fa-desktop"></i> <strong>PC:</strong> Стрелки ← ↑ → ↓ или WASD</li>
                    <li><i class="fas fa-mobile-alt"></i> <strong>Телефон:</strong> Кнопки управления ниже</li>
                    <li><i class="fas fa-star"></i> <strong>Цель:</strong> Собирайте звёзды, чтобы расти</li>
                    <li><i class="fas fa-skull-crossbones"></i> <strong>Осторожно:</strong> Не врезайтесь в стены и себя!</li>
                </ul>
            </div>
        </div>
    `;
    
    gameContainer.innerHTML = gameHTML;
    
    // Инициализируем игру
    snakeGame = new SnakeGame();
    snakeGameInitialized = true;
    
    // Добавляем обработчики событий
    setupSnakeEventListeners();
    
    console.log('✅ Игра Змейка успешно запущена!');
}

// Класс игры Змейка
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Размеры игрового поля
        this.gridSize = 20;
        this.gridWidth = this.canvas.width / this.gridSize;
        this.gridHeight = this.canvas.height / this.gridSize;
        
        // Игровые переменные
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 240; // мс на ход
        this.isPaused = true;
        this.gameOver = false;
        this.gameLoop = null;
        
        // Цвета
        this.colors = {
            snakeHead: '#4CAF50',
            snakeBody: '#8BC34A',
            food: '#FFEB3B',
            background: '#0f1525',
            grid: 'rgba(255, 255, 255, 0.05)'
        };
        
        // Инициализация
        this.init();
        this.updateUI();
    }
    
    init() {
        // Сброс змейки
        this.snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        
        // Сброс направления
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Сброс счета
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        
        // Генерация первой еды
        this.generateFood();
        
        // Отрисовка начального состояния
        this.draw();
        
        // Обновление UI
        this.updateUI();
        
        // Скрываем экран окончания игры
        document.getElementById('snake-game-over').classList.remove('show');
    }
    
    generateFood() {
        let foodPosition;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            foodPosition = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            // Проверяем, не находится ли еда на змейке
            for (let segment of this.snake) {
                if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        this.food = foodPosition;
    }
    
    draw() {
        // Очистка холста
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка сетки
        this.drawGrid();
        
        // Отрисовка змейки
        this.drawSnake();
        
        // Отрисовка еды
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        // Вертикальные линии
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        // Рисуем тело змейки
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // Голова
            if (i === 0) {
                this.ctx.fillStyle = this.colors.snakeHead;
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 15;
            } 
            // Тело
            else {
                this.ctx.fillStyle = this.colors.snakeBody;
                this.ctx.shadowColor = '#8BC34A';
                this.ctx.shadowBlur = 10;
            }
            
            // Рисуем сегмент змейки с закругленными углами
            this.drawRoundedRect(
                segment.x * this.gridSize, 
                segment.y * this.gridSize, 
                this.gridSize, 
                this.gridSize, 
                5
            );
            
            // Глаза для головы
            if (i === 0) {
                this.drawEyes(segment);
            }
        }
        this.ctx.shadowBlur = 0;
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawEyes(head) {
        this.ctx.fillStyle = 'white';
        
        let eye1X, eye1Y, eye2X, eye2Y;
        
        // Позиция глаз в зависимости от направления
        switch(this.direction) {
            case 'right':
                eye1X = head.x * this.gridSize + this.gridSize - 6;
                eye1Y = head.y * this.gridSize + 6;
                eye2X = head.x * this.gridSize + this.gridSize - 6;
                eye2Y = head.y * this.gridSize + this.gridSize - 6;
                break;
            case 'left':
                eye1X = head.x * this.gridSize + 6;
                eye1Y = head.y * this.gridSize + 6;
                eye2X = head.x * this.gridSize + 6;
                eye2Y = head.y * this.gridSize + this.gridSize - 6;
                break;
            case 'up':
                eye1X = head.x * this.gridSize + 6;
                eye1Y = head.y * this.gridSize + 6;
                eye2X = head.x * this.gridSize + this.gridSize - 6;
                eye2Y = head.y * this.gridSize + 6;
                break;
            case 'down':
                eye1X = head.x * this.gridSize + 6;
                eye1Y = head.y * this.gridSize + this.gridSize - 6;
                eye2X = head.x * this.gridSize + this.gridSize - 6;
                eye2Y = head.y * this.gridSize + this.gridSize - 6;
                break;
        }
        
        // Рисуем глаза
        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFood() {
        // Рисуем звезду
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const outerRadius = this.gridSize / 2 - 2;
        const innerRadius = outerRadius / 2;
        const spikes = 5;
        
        this.ctx.fillStyle = this.colors.food;
        this.ctx.shadowColor = '#FFEB3B';
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    move() {
        if (this.isPaused || this.gameOver) return;
        
        // Обновляем направление
        this.direction = this.nextDirection;
        
        // Копируем голову
        const head = {...this.snake[0]};
        
        // Перемещаем голову в зависимости от направления
        switch(this.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Проверяем столкновение со стенами
        if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            this.endGame();
            return;
        }
        
        // Проверяем столкновение с собой
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        // Добавляем новую голову
        this.snake.unshift(head);
        
        // Проверяем, съела ли змейка еду
        if (head.x === this.food.x && head.y === this.food.y) {
            // Увеличиваем счет
            this.score += 10;
            
            // Увеличиваем скорость каждые 50 очков
            if (this.score % 50 === 0 && this.gameSpeed > 60) {
                this.gameSpeed -= 10;
            }
            
            // Генерируем новую еду
            this.generateFood();
            
            // Обновляем UI
            this.updateUI();
            
            // Воспроизводим звуковой эффект (опционально)
            this.playEatSound();
        } else {
            // Удаляем хвост, если не съели еду
            this.snake.pop();
        }
        
        // Перерисовываем игру
        this.draw();
    }
    
    playEatSound() {
        // Простой звуковой эффект с использованием Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Аудио недоступно");
        }
    }
    
    updateUI() {
        document.getElementById('snake-score').textContent = this.score;
        document.getElementById('snake-length').textContent = this.snake.length;
        document.getElementById('snake-high-score').textContent = this.highScore;
        
        // Обновляем текст кнопки паузы
        const pauseBtn = document.getElementById('snake-pause-btn');
        if (pauseBtn) {
            pauseBtn.innerHTML = this.isPaused ? 
                '<i class="fas fa-play"></i> Продолжить' : 
                '<i class="fas fa-pause"></i> Пауза';
        }
    }
    
    startGame() {
        if (this.gameOver) {
            this.init();
        }
        
        this.isPaused = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            this.move();
        }, this.gameSpeed);
        
        this.updateUI();
    }
    
    pauseGame() {
        this.isPaused = !this.isPaused;
        this.updateUI();
    }
    
    restartGame() {
        clearInterval(this.gameLoop);
        this.init();
        
        if (!this.isPaused) {
            this.startGame();
        } else {
            this.draw();
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.isPaused = true;
        clearInterval(this.gameLoop);
        
        // Обновляем рекорд
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // Показываем экран окончания игры
        const gameOverScreen = document.getElementById('snake-game-over');
        const finalScore = document.getElementById('final-score');
        const gameOverMessage = document.getElementById('game-over-message');
        
        finalScore.textContent = this.score;
        
        // Разные сообщения в зависимости от счета
        if (this.score === 0) {
            gameOverMessage.textContent = 'Попробуйте еще раз!';
        } else if (this.score < 50) {
            gameOverMessage.textContent = 'Хорошая попытка!';
        } else if (this.score < 100) {
            gameOverMessage.textContent = 'Отличный результат!';
        } else if (this.score < 200) {
            gameOverMessage.textContent = 'Потрясающе! Вы эксперт!';
        } else {
            gameOverMessage.textContent = 'Невероятно! Вы мастер змейки!';
        }
        
        gameOverScreen.classList.add('show');
    }
    
    sendSnakeResult() {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (!userId) {
            console.error('❌ Нет Telegram WebApp или user ID');
            return;
        }
        
        const gameResult = {
            type: 'game_result',
            game: 'snake',
            score: this.score,
            completed: false,
            timestamp: Date.now()
        };
        
        console.log('📤 Отправка результата snake:', gameResult);
        window.Telegram.WebApp.sendData(JSON.stringify(gameResult));
        
        // Показываем уведомление
        this.showNotification('✅ Результат отправлен! Лапки скоро придут');
    }
    
    // Добавь ЭТУ функцию после sendSnakeResult() (перед закрывающей скобкой класса)
    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        // Добавляем анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
    
    changeDirection(newDirection) {
        // Предотвращаем разворот на 180 градусов
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if (newDirection !== oppositeDirections[this.direction]) {
            this.nextDirection = newDirection;
        }
    }
}

// Настройка обработчиков событий
function setupSnakeEventListeners() {
    // Обработчики для кнопок управления на телефоне
    document.getElementById('up-btn')?.addEventListener('click', () => {
        snakeGame?.changeDirection('up');
    });
    
    document.getElementById('down-btn')?.addEventListener('click', () => {
        snakeGame?.changeDirection('down');
    });
    
    document.getElementById('left-btn')?.addEventListener('click', () => {
        snakeGame?.changeDirection('left');
    });
    
    document.getElementById('right-btn')?.addEventListener('click', () => {
        snakeGame?.changeDirection('right');
    });
    
    // Обработчики для игровых кнопок
    document.getElementById('snake-start-btn')?.addEventListener('click', () => {
        if (snakeGame?.gameOver) {
            snakeGame.restartGame();
        }
        snakeGame?.startGame();
    });
    
    document.getElementById('snake-pause-btn')?.addEventListener('click', () => {
        snakeGame?.pauseGame();
    });
    
    document.getElementById('snake-restart-btn')?.addEventListener('click', () => {
        snakeGame?.restartGame();
    });
    
    document.getElementById('snake-restart-btn-over')?.addEventListener('click', () => {
        snakeGame?.restartGame();
        snakeGame?.startGame();
    });
    
    // Обработчики клавиатуры для ПК
    document.addEventListener('keydown', (e) => {
        if (!snakeGame || snakeGame.gameOver) return;
        
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
            case 'ц':
                e.preventDefault();
                snakeGame.changeDirection('up');
                break;
            case 'arrowdown':
            case 's':
            case 'ы':
                e.preventDefault();
                snakeGame.changeDirection('down');
                break;
            case 'arrowleft':
            case 'a':
            case 'ф':
                e.preventDefault();
                snakeGame.changeDirection('left');
                break;
            case 'arrowright':
            case 'd':
            case 'в':
                e.preventDefault();
                snakeGame.changeDirection('right');
                break;
            case ' ':
            case 'spacebar':
                e.preventDefault();
                snakeGame.pauseGame();
                break;
            case 'enter':
                if (snakeGame.gameOver) {
                    snakeGame.restartGame();
                    snakeGame.startGame();
                }
                break;
        }
    });
    
    // Обработчики для сенсорного управления на телефоне (свайпы)
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, {passive: true});
    
    document.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY || !snakeGame || snakeGame.gameOver) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Определяем направление свайпа
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Горизонтальный свайп
            if (diffX > 0) {
                snakeGame.changeDirection('left');
            } else {
                snakeGame.changeDirection('right');
            }
        } else {
            // Вертикальный свайп
            if (diffY > 0) {
                snakeGame.changeDirection('up');
            } else {
                snakeGame.changeDirection('down');
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }, {passive: true});
}

// Экспортируем функцию для глобального доступа
window.startSnakeGame = startSnakeGame;
window.snakeGameInitialized = false;
