// ========== ИГРА "ПЯТНАШКИ ТАРО" ==========
(function() {
    'use strict';
    
    console.log('=== fifteen-game.js инициализируется ===');
    
    // Защита от повторного выполнения
    if (window.fifteenGameInitialized) {
        console.error('fifteen-game.js уже инициализирован! Пропускаем.');
        return;
    }
    window.fifteenGameInitialized = true;
    
    // Карты Таро для игры (16 карт, включая пустую)
    const TAROT_CARDS = [
        { id: 0, name: "Шут", emoji: "🎭", arcana: "Старшие", color: "#FF6B6B" },
        { id: 1, name: "Маг", emoji: "🧙", arcana: "Старшие", color: "#4ECDC4" },
        { id: 2, name: "Верховная Жрица", emoji: "👸", arcana: "Старшие", color: "#FFD166" },
        { id: 3, name: "Императрица", emoji: "👑", arcana: "Старшие", color: "#06D6A0" },
        { id: 4, name: "Император", emoji: "🤴", arcana: "Старшие", color: "#118AB2" },
        { id: 5, name: "Иерофант", emoji: "🙏", arcana: "Старшие", color: "#073B4C" },
        { id: 6, name: "Влюбленные", emoji: "💑", arcana: "Старшие", color: "#EF476F" },
        { id: 7, name: "Колесница", emoji: "🛡️", arcana: "Старшие", color: "#7209B7" },
        { id: 8, name: "Сила", emoji: "💪", arcana: "Старшие", color: "#F15BB5" },
        { id: 9, name: "Отшельник", emoji: "🧓", arcana: "Старшие", color: "#9B5DE5" },
        { id: 10, name: "Колесо Фортуны", emoji: "🎡", arcana: "Старшие", color: "#00BBF9" },
        { id: 11, name: "Справедливость", emoji: "⚖️", arcana: "Старшие", color: "#00F5D4" },
        { id: 12, name: "Повешенный", emoji: "🙃", arcana: "Старшие", color: "#FF99C8" },
        { id: 13, name: "Смерть", emoji: "💀", arcana: "Старшие", color: "#A663CC" },
        { id: 14, name: "Умеренность", emoji: "⚗️", arcana: "Старшие", color: "#6FFFE9" },
        { id: 15, name: "", emoji: "✨", arcana: "Пусто", color: "transparent" } // Пустая клетка
    ];
    
    // Уровни сложности
    const LEVELS = [
        { id: 1, size: 3, name: "Начинающий", moves: 200, time: 300, color: "#4ade80" },
        { id: 2, size: 4, name: "Обычный", moves: 500, time: 600, color: "#60a5fa" },
    ];
    
    // Состояние игры
    let gameState = {
        currentLevel: 0,
        board: [],
        emptyPos: { row: 0, col: 0 },
        moves: 0,
        timeLeft: 0,
        timer: null,
        isPlaying: false,
        isCompleted: false,
        startTime: null,
        bestTimes: JSON.parse(localStorage.getItem('tarot15_best_times')) || {}
    };
    
    // DOM элементы
    let gameContainer, puzzleGrid, movesCount, timerCount, levelInfo;
    
    // Инициализация игры
    function startFifteenGame() {
        console.log('🎮 Запуск игры Пятнашки Таро');
        try {
            initFifteenUI();
            loadLevel(0);
        } catch (error) {
            console.error('Ошибка запуска игры:', error);
            showError('Не удалось запустить игру: ' + error.message);
        }
    }
    
    // Остановка игры
    function stopFifteenGame() {
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        gameState.isPlaying = false;
    }
    
    // Создание интерфейса игры
    function initFifteenUI() {
        console.log('Инициализация UI пятнашек');
        
        const gameHTML = `
            <div class="fifteen-game-container">
                <!-- Заголовок -->
                <div class="fifteen-header">
                    <h2><i class="fas fa-crystal-ball"></i> Котняшки Таро</h2>
                    <p>Собери карты Таро в правильном порядке! 🔮</p>
                </div>

                <!-- Информация об уровне -->
                <div class="level-info" id="fifteen-level-info">
                    <div class="level-name">Уровень 1: Начинающий</div>
                    <div class="level-stats">
                        <span class="stat"><i class="fas fa-trophy"></i> Рекорд: <span id="best-time">--:--</span></span>
                        <span class="stat"><i class="fas fa-shoe-prints"></i> Ходы: <span id="moves-count">0</span></span>
                        <span class="stat"><i class="fas fa-clock"></i> Время: <span id="timer-count">02:00</span></span>
                    </div>
                </div>

                <!-- Игровое поле -->
                <div class="puzzle-wrapper">
                    <div class="puzzle-grid" id="puzzle-grid">
                        <!-- Пятнашки будут здесь -->
                    </div>
                </div>

                <!-- Управление -->
                <div class="controls-section">
                    <div class="controls-title">
                        <i class="fas fa-gamepad"></i> Управление:
                    </div>
                    
                    <!-- Кнопки уровней -->
                    <div class="levels-selector">
                        ${LEVELS.map((level, index) => `
                            <button class="level-btn ${index === 0 ? 'active' : ''}" 
                                    data-level="${index}"
                                    style="background: ${level.color}">
                                ${level.name}<br>
                                <small>${level.size}×${level.size}</small>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Кнопки действий -->
                    <div class="action-buttons">
                        <button class="action-btn shuffle-btn" id="shuffle-btn">
                            <i class="fas fa-random"></i> Перемешать
                        </button>
                        <button class="action-btn hint-btn" id="hint-btn">
                            <i class="fas fa-lightbulb"></i> Подсказка
                        </button>
                        <button class="action-btn restart-btn" id="restart-btn">
                            <i class="fas fa-redo"></i> Заново
                        </button>
                    </div>
                </div>

                <!-- Инструкция -->
                <div class="instructions">
                    <p><i class="fas fa-info-circle"></i> <strong>Как играть:</strong></p>
                    <ul>
                        <li>Нажмите на карту рядом с пустой клеткой чтобы переместить её</li>
                        <li>Соберите карты в правильном порядке (1-15)</li>
                        <li>Попробуйте побить свой рекорд времени!</li>
                    </ul>
                </div>
            </div>
        `;
        
        const fifteenGameElement = document.getElementById('fifteen-game');
        if (!fifteenGameElement) {
            throw new Error('Элемент #fifteen-game не найден в DOM');
        }
        
        fifteenGameElement.innerHTML = gameHTML;
        
        // Получаем элементы
        gameContainer = document.querySelector('.fifteen-game-container');
        puzzleGrid = document.getElementById('puzzle-grid');
        movesCount = document.getElementById('moves-count');
        timerCount = document.getElementById('timer-count');
        levelInfo = document.getElementById('fifteen-level-info');
        
        // Настраиваем обработчики
        setupFifteenControls();
        setupTouchControls();
        setupPointerControls();
        
        console.log('UI пятнашек инициализирован');
    }
    
    // Настройка элементов управления
    function setupFifteenControls() {
        // Кнопки уровней
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const levelIndex = parseInt(btn.dataset.level);
                if (levelIndex !== gameState.currentLevel) {
                    loadLevel(levelIndex);
                }
            });
        });
        
        // Кнопки действий
        document.getElementById('shuffle-btn').addEventListener('click', shuffleBoard);
        document.getElementById('hint-btn').addEventListener('click', showHint);
        document.getElementById('restart-btn').addEventListener('click', () => loadLevel(gameState.currentLevel));
        
        // Клавиатура
        document.addEventListener('keydown', handleKeyPress);
        
        // Клики по клеткам
        puzzleGrid.addEventListener('click', handleTileClick);
    }
    
    // Настройка сенсорного управления
    function setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        puzzleGrid.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        puzzleGrid.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                
                // Проверяем, был ли это тап (а не свайп)
                const diffX = Math.abs(touchEndX - touchStartX);
                const diffY = Math.abs(touchEndY - touchStartY);
                const diffTime = touchEndTime - touchStartTime;
                
                if (diffX < 10 && diffY < 10 && diffTime < 300) {
                    // Это был тап - находим элемент под пальцем
                    const touch = e.changedTouches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (element) {
                        // Ищем ближайший элемент с классом puzzle-tile
                        const tile = element.closest('.puzzle-tile');
                        if (tile && tile.dataset.index !== undefined) {
                            const index = parseInt(tile.dataset.index);
                            moveTile(index);
                            e.preventDefault();
                        }
                    }
                }
            }
        }, { passive: false });
    }
    
    // Обработка клавиатуры
    function handleKeyPress(e) {
        if (!gameState.isPlaying || gameState.isCompleted) return;
        
        const { row, col } = gameState.emptyPos;
        const size = LEVELS[gameState.currentLevel].size;
        let targetIndex = -1;
        
        switch(e.key) {
            case 'ArrowUp':
                if (row < size - 1) targetIndex = (row + 1) * size + col;
                break;
            case 'ArrowDown':
                if (row > 0) targetIndex = (row - 1) * size + col;
                break;
            case 'ArrowLeft':
                if (col < size - 1) targetIndex = row * size + (col + 1);
                break;
            case 'ArrowRight':
                if (col > 0) targetIndex = row * size + (col - 1);
                break;
        }
        
        if (targetIndex !== -1) {
            moveTile(targetIndex);
            e.preventDefault();
        }
    }
    
    // Обработка кликов по клеткам
    function handleTileClick(e) {
        if (!gameState.isPlaying || gameState.isCompleted) return;
        
        // На мобильных устройствах event.target может быть дочерним элементом
        let target = e.target;
        
        // Ищем ближайший элемент .puzzle-tile
        while (target && target !== puzzleGrid) {
            if (target.classList && target.classList.contains('puzzle-tile')) {
                const index = parseInt(target.dataset.index);
                if (!isNaN(index)) {
                    moveTile(index);
                    return;
                }
            }
            target = target.parentNode;
        }
    }

    function setupPointerControls() {
        puzzleGrid.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                e.preventDefault();
            }
        });
        
        puzzleGrid.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'mouse') {
                // Для мыши используем стандартный клик
                return;
            }
            
            // Для тач-устройств
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (element) {
                const tile = element.closest('.puzzle-tile');
                if (tile && tile.dataset.index !== undefined) {
                    const index = parseInt(tile.dataset.index);
                    moveTile(index);
                }
            }
        });
    }
    
    // Загрузка уровня
    function loadLevel(levelIndex) {
        stopFifteenGame();
        
        gameState.currentLevel = levelIndex;
        const level = LEVELS[levelIndex];
        
        // Сброс состояния
        gameState.moves = 0;
        gameState.timeLeft = level.time;
        gameState.isPlaying = true;
        gameState.isCompleted = false;
        gameState.startTime = Date.now();
        
        // Создаем и перемешиваем доску
        initializeBoard(level.size);
        shuffleBoard();
        
        // Обновляем интерфейс
        updateUI();
        renderBoard();
        startTimer();
        
        // Анимация
        puzzleGrid.classList.add('fade-in');
        setTimeout(() => puzzleGrid.classList.remove('fade-in'), 500);
        
        // Обновляем активную кнопку уровня
        document.querySelectorAll('.level-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === levelIndex);
        });
    }
    
    // Инициализация доски
    function initializeBoard(size) {
        const totalTiles = size * size;
        gameState.board = [];
        
        // Создаем упорядоченную доску
        for (let i = 0; i < totalTiles - 1; i++) {
            const cardIndex = i % TAROT_CARDS.length;
            gameState.board.push({
                id: i + 1,
                card: TAROT_CARDS[cardIndex],
                correctPosition: i
            });
        }
        
        // Добавляем пустую клетку
        gameState.board.push({
            id: 0,
            card: TAROT_CARDS[TAROT_CARDS.length - 1],
            correctPosition: totalTiles - 1
        });
        
        // Позиция пустой клетки
        gameState.emptyPos = {
            row: Math.floor((totalTiles - 1) / size),
            col: (totalTiles - 1) % size
        };
    }
    
    // Перемешивание доски
    function shuffleBoard() {
        if (gameState.isCompleted) return;
        
        const size = LEVELS[gameState.currentLevel].size;
        const directions = [
            { dr: -1, dc: 0 }, // вверх
            { dr: 1, dc: 0 },  // вниз
            { dr: 0, dc: -1 }, // влево
            { dr: 0, dc: 1 }   // вправо
        ];
        
        // Делаем много случайных ходов
        let shuffleMoves = size * 100;
        let currentRow = gameState.emptyPos.row;
        let currentCol = gameState.emptyPos.col;
        
        for (let i = 0; i < shuffleMoves; i++) {
            // Выбираем случайное валидное направление
            const validDirections = directions.filter(dir => {
                const newRow = currentRow + dir.dr;
                const newCol = currentCol + dir.dc;
                return newRow >= 0 && newRow < size && newCol >= 0 && newCol < size;
            });
            
            if (validDirections.length > 0) {
                const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
                const targetRow = currentRow + dir.dr;
                const targetCol = currentCol + dir.dc;
                const targetIndex = targetRow * size + targetCol;
                
                // Меняем местами
                [gameState.board[currentRow * size + currentCol], 
                 gameState.board[targetIndex]] = 
                [gameState.board[targetIndex], 
                 gameState.board[currentRow * size + currentCol]];
                
                currentRow = targetRow;
                currentCol = targetCol;
            }
        }
        
        gameState.emptyPos = { row: currentRow, col: currentCol };
        gameState.moves = 0;
        gameState.isCompleted = false;
        
        renderBoard();
        updateUI();
        showNotification('Доска перемешана! Начинайте игру!');
    }
    
    // Отрисовка доски
    function renderBoard() {
        if (!puzzleGrid) return;
        
        const level = LEVELS[gameState.currentLevel];
        const size = level.size;
        const cellSize = calculateCellSize(size);
        
        puzzleGrid.innerHTML = '';
        puzzleGrid.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
        puzzleGrid.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;
        puzzleGrid.style.width = `${size * cellSize}px`;
        puzzleGrid.style.height = `${size * cellSize}px`;
        
        gameState.board.forEach((tile, index) => {
            const tileElement = document.createElement('div');
            tileElement.className = 'puzzle-tile';
            tileElement.dataset.index = index;
            
            if (tile.id === 0) {
                tileElement.classList.add('empty');
                tileElement.innerHTML = `
                    <div class="empty-cell">
                        <i class="fas fa-star"></i>
                        <div>Пусто</div>
                    </div>
                `;
            } else {
                const isCorrect = tile.correctPosition === index;
                tileElement.classList.toggle('correct', isCorrect);
                
                tileElement.innerHTML = `
                    <div class="tile-content" style="background: ${tile.card.color}20; border-color: ${tile.card.color}">
                        <div class="tile-number">${tile.id}</div>
                        <div class="tile-emoji">${tile.card.emoji}</div>
                        <div class="tile-name">${tile.card.name}</div>
                        ${isCorrect ? '<div class="correct-indicator"><i class="fas fa-check"></i></div>' : ''}
                    </div>
                `;
                
                
                if (isCorrect) {
                    tileElement.classList.add('correct-position');
                }
            }
            
            puzzleGrid.appendChild(tileElement);
        });
    }
    
    // Расчет размера клетки
    function calculateCellSize(boardSize) {
        const screenWidth = window.innerWidth;
        const maxWidth = Math.min(screenWidth * 0.9, 500);
        return Math.floor(maxWidth / boardSize);
    }
    
    // Перемещение клетки
    function moveTile(index) {
        if (!gameState.isPlaying || gameState.isCompleted) return;
        
        const level = LEVELS[gameState.currentLevel];
        const size = level.size;
        const row = Math.floor(index / size);
        const col = index % size;
        const emptyRow = gameState.emptyPos.row;
        const emptyCol = gameState.emptyPos.col;
        
        // Проверяем, что клетка рядом с пустой
        const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                          (Math.abs(col - emptyCol) === 1 && row === emptyRow);
        
        if (isAdjacent) {
            // Меняем местами
            const emptyIndex = emptyRow * size + emptyCol;
            [gameState.board[emptyIndex], gameState.board[index]] = 
            [gameState.board[index], gameState.board[emptyIndex]];
            
            // Обновляем позицию пустой клетки
            gameState.emptyPos = { row, col };
            gameState.moves++;
            
            // Анимация перемещения
            animateMove(index, emptyIndex);
            
            // Проверяем завершение игры
            checkCompletion();
            
            // Обновляем интерфейс
            updateUI();
        }
    }
    
    // Анимация перемещения
    function animateMove(fromIndex, toIndex) {
        const tiles = document.querySelectorAll('.puzzle-tile');
        const fromTile = tiles[fromIndex];
        const toTile = tiles[toIndex];
        
        if (fromTile && toTile) {
            fromTile.classList.add('moving');
            toTile.classList.add('moving');
            
            setTimeout(() => {
                renderBoard();
                fromTile.classList.remove('moving');
                toTile.classList.remove('moving');
            }, 300);
        }
    }
    
    // Проверка завершения игры
    function checkCompletion() {
        const isComplete = gameState.board.every((tile, index) => 
            tile.correctPosition === index || tile.id === 0
        );
        
        if (isComplete && !gameState.isCompleted) {
            gameState.isCompleted = true;
            gameState.isPlaying = false;
            clearInterval(gameState.timer);
            
            // Рассчитываем время
            const elapsedTime = LEVELS[gameState.currentLevel].time - gameState.timeLeft;
            const levelKey = `level_${gameState.currentLevel}`;
            
            // Сохраняем рекорд
            if (!gameState.bestTimes[levelKey] || elapsedTime < gameState.bestTimes[levelKey]) {
                gameState.bestTimes[levelKey] = elapsedTime;
                localStorage.setItem('tarot15_best_times', JSON.stringify(gameState.bestTimes));
                showNotification(`🎉 Новый рекорд! ${formatTime(elapsedTime)}`);
            }
            
            // Показываем поздравление
            setTimeout(() => showCompletion(elapsedTime), 500);
        }
    }
    
    // Показ завершения
    function showCompletion(time) {
        sendFifteenResult(time, gameState.moves);
        const level = LEVELS[gameState.currentLevel];
        const bestTime = gameState.bestTimes[`level_${gameState.currentLevel}`] || time;
        
        const message = `
            🎊 Поздравляем! 🎊
            
            Вы собрали пятнашки за:
            ⏱️ Время: ${formatTime(time)}
            👣 Ходы: ${gameState.moves}
            🏆 Рекорд уровня: ${formatTime(bestTime)}
            
            ${time === bestTime ? '✨ Вы установили новый рекорд! ✨' : ''}
            
            Хотите попробовать другой уровень?
        `;
        
        if (confirm(message)) {
            const nextLevel = gameState.currentLevel < LEVELS.length - 1 
                ? gameState.currentLevel + 1 
                : 0;
            loadLevel(nextLevel);
        }
    }
        
    // Подсказка
    function showHint() {
        if (gameState.isCompleted) return;
        
        const level = LEVELS[gameState.currentLevel];
        const size = level.size;
        
        // Находим первую неправильную клетку
        const wrongTileIndex = gameState.board.findIndex((tile, index) => 
            tile.id !== 0 && tile.correctPosition !== index
        );
        
        if (wrongTileIndex !== -1) {
            const tileElement = document.querySelector(`.puzzle-tile[data-index="${wrongTileIndex}"]`);
            if (tileElement) {
                tileElement.classList.add('hint');
                setTimeout(() => tileElement.classList.remove('hint'), 2000);
                showNotification(`Подсказка: переместите карту ${gameState.board[wrongTileIndex].id}`);
            }
        }
    }
    
    // Форматирование времени
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Запуск таймера
    function startTimer() {
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        gameState.timer = setInterval(() => {
            if (gameState.isPlaying && !gameState.isCompleted) {
                gameState.timeLeft--;
                updateUI();
                
                if (gameState.timeLeft <= 0) {
                    gameState.isPlaying = false;
                    clearInterval(gameState.timer);
                    
                    setTimeout(() => {
                        showNotification('⏰ Время вышло! Попробуйте снова.');
                        loadLevel(gameState.currentLevel);
                    }, 500);
                }
            }
        }, 1000);
    }
    
    // Обновление интерфейса
    function updateUI() {
        if (!movesCount || !timerCount || !levelInfo) return;
        
        const level = LEVELS[gameState.currentLevel];
        const bestTime = gameState.bestTimes[`level_${gameState.currentLevel}`];
        
        // Обновляем информацию об уровне
        levelInfo.style.background = `linear-gradient(135deg, ${level.color}20, ${level.color}40)`;
        levelInfo.querySelector('.level-name').textContent = 
            `Уровень ${level.id}: ${level.name}`;
        
        // Обновляем статистику
        movesCount.textContent = gameState.moves;
        timerCount.textContent = formatTime(gameState.timeLeft);
        
        // Показываем лучший результат
        const bestTimeElement = document.getElementById('best-time');
        if (bestTimeElement) {
            bestTimeElement.textContent = bestTime ? formatTime(bestTime) : '--:--';
        }
        
        // Подсветка таймера при малом времени
        timerCount.style.color = gameState.timeLeft < 30 ? '#ef4444' : 
                                gameState.timeLeft < 60 ? '#fbbf24' : '#6b7280';
    }
    
    // Показать уведомление
    function showNotification(message) {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Показать ошибку
    function showError(message) {
        const fifteenGameElement = document.getElementById('fifteen-game');
        if (fifteenGameElement) {
            fifteenGameElement.innerHTML = `
                <div style="text-align: center; padding: 50px; color: white;">
                    <h2 style="color: #f87171;">⚠️ Ошибка</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        padding: 10px 20px;
                        background: #8b5cf6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 20px;
                    ">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                </div>
            `;
        }
    }

    async function sendFifteenResult(time, moves) {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (!userId) {
            console.log('No user ID');
            return;
        }
        
        try {
            const result = await window.CryptoUtils.sendResult(
                userId, 
                'fifteen', 
                moves,  // отправляем количество ходов
                true    // игра пройдена
            );
            console.log('Fifteen result sent:', result);
        } catch (e) {
            console.error('Error sending fifteen result:', e);
        }
    }
    
    // Экспорт функций
    window.startFifteenGame = startFifteenGame;
    window.stopFifteenGame = stopFifteenGame;
    
    console.log('✅ fifteen-game.js готов к использованию');
    
})();
