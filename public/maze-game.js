// ========== ИГРА "ЛАБИРИНТ ТАРО" ==========
// Обернуто в IIFE для предотвращения конфликтов

(function() {
    'use strict';
    
    console.log('=== maze-game.js инициализируется ===');
    
    // Защита от повторного выполнения
    if (window.mazeGameInitialized) {
        console.error('maze-game.js уже инициализирован! Пропускаем.');
        return;
    }
    window.mazeGameInitialized = true;
    
    // Конфигурация игры
    const MAZE_CONFIG = {
        levels: [
            { id: 1, size: 8,  time: 90,  stars: 3,  name: "Начальный",  color: "#4ade80" },
            { id: 2, size: 10, time: 120, stars: 4,  name: "Легкий",     color: "#60a5fa" },
            { id: 3, size: 12, time: 150, stars: 5,  name: "Средний",    color: "#fbbf24" },
            { id: 4, size: 14, time: 180, stars: 6,  name: "Сложный",    color: "#f87171" },
            { id: 5, size: 16, time: 210, stars: 7,  name: "Эксперт",    color: "#c084fc" }
        ],
        cellSize: 35,
        wallColor: '#374151',
        pathColor: '#1f2937',
        playerChar: '🐱',
        exitChar: '🚪',
        starChar: '⭐',
        wallChar: '🧱'
    };

    // Состояние игры (внутри IIFE, поэтому безопасно)
    let gameState = {
        currentLevel: 0,
        maze: [],
        player: { x: 1, y: 1 },
        exit: { x: 0, y: 0 },
        stars: [],
        collectedStars: 0,
        moves: 0,
        timeLeft: 0,
        timer: null,
        isPlaying: false,
        touchStartX: 0,
        touchStartY: 0
    };

    // DOM элементы
    let gameContainer, mazeGrid, movesCount, timerCount, starsCount, levelInfo;

    // Инициализация игры
    function startMazeGame() {
        console.log('🎮 Запуск игры Лабиринт');
        try {
            initMazeUI();
            loadLevel(0);
        } catch (error) {
            console.error('Ошибка запуска игры:', error);
            showError('Не удалось запустить игру: ' + error.message);
        }
    }

    function stopMazeGame() {
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        gameState.isPlaying = false;
    }

    // Создание интерфейса игры
    function initMazeUI() {
        console.log('Инициализация UI лабиринта');
        
        const gameHTML = `
            <div class="maze-game-container">
                <!-- Заголовок -->
                <div class="maze-header">
                    <h2><i class="fas fa-chess-board"></i> Лабиринт Таро</h2>
                    <p>Помоги Коту Тоше найти выход! 🐱</p>
                </div>

                <!-- Информация об уровне -->
                <div class="level-info" id="level-info">
                    <div class="level-name">Уровень 1: Начальный</div>
                    <div class="level-stats">
                        <span class="stat"><i class="fas fa-star"></i> <span id="stars-count">0/3</span></span>
                        <span class="stat"><i class="fas fa-shoe-prints"></i> <span id="moves-count">0</span></span>
                        <span class="stat"><i class="fas fa-clock"></i> <span id="timer-count">01:30</span></span>
                    </div>
                </div>

                <!-- Игровое поле -->
                <div class="maze-wrapper">
                    <div class="maze-grid" id="maze-grid">
                        <!-- Лабиринт будет здесь -->
                    </div>
                </div>

                <!-- Управление -->
                <div class="controls-section">
                    <div class="controls-title">
                        <i class="fas fa-gamepad"></i> Управление:
                    </div>
                    
                    <!-- Виртуальный джойстик -->
                    <div class="joystick">
                        <div class="joystick-row">
                            <button class="control-btn up-btn" data-direction="up">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                        </div>
                        <div class="joystick-row">
                            <button class="control-btn left-btn" data-direction="left">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <div class="joystick-center">
                                <i class="fas fa-paw"></i>
                            </div>
                            <button class="control-btn right-btn" data-direction="right">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="joystick-row">
                            <button class="control-btn down-btn" data-direction="down">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Быстрые кнопки -->
                    <div class="quick-controls">
                        <button class="quick-btn hint-btn" id="hint-btn">
                            <i class="fas fa-lightbulb"></i> Подсказка
                        </button>
                        <button class="quick-btn restart-btn" id="restart-btn">
                            <i class="fas fa-redo"></i> Перезапуск
                        </button>
                    </div>
                </div>

                <!-- Инструкция -->
                <div class="instructions">
                    <p><i class="fas fa-info-circle"></i> <strong>Как играть:</strong></p>
                    <ul>
                        <li>Используй кнопки управления или свайп пальцем</li>
                        <li>Собери все звёзды ⭐ по пути</li>
                        <li>Найди выход 🚪 до окончания времени</li>
                        <li>Каждый уровень сложнее предыдущего!</li>
                    </ul>
                </div>
            </div>
        `;

        const mazeGameElement = document.getElementById('maze-game');
        if (!mazeGameElement) {
            throw new Error('Элемент #maze-game не найден в DOM');
        }
        
        mazeGameElement.innerHTML = gameHTML;

        // Получаем элементы
        gameContainer = document.querySelector('.maze-game-container');
        mazeGrid = document.getElementById('maze-grid');
        movesCount = document.getElementById('moves-count');
        timerCount = document.getElementById('timer-count');
        starsCount = document.getElementById('stars-count');
        levelInfo = document.getElementById('level-info');

        // Настраиваем обработчики
        setupMazeControls();
        setupTouchControls();
        
        console.log('UI лабиринта инициализирован');
    }

    // Настройка кнопок управления
    function setupMazeControls() {
        // Кнопки направления
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                movePlayer(direction);
            });
        });

        // Быстрые кнопки
        document.getElementById('hint-btn').addEventListener('click', showHint);
        document.getElementById('restart-btn').addEventListener('click', () => loadLevel(gameState.currentLevel));

        // Клавиатура
        document.addEventListener('keydown', handleKeyPress);
    }

    // Настройка сенсорного управления (свайпы)
    function setupTouchControls() {
        mazeGrid.addEventListener('touchstart', (e) => {
            gameState.touchStartX = e.touches[0].clientX;
            gameState.touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        mazeGrid.addEventListener('touchend', (e) => {
            if (!gameState.touchStartX || !gameState.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchEndX - gameState.touchStartX;
            const diffY = touchEndY - gameState.touchStartY;

            // Определяем направление свайпа
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Горизонтальный свайп
                if (Math.abs(diffX) > 30) {
                    movePlayer(diffX > 0 ? 'right' : 'left');
                }
            } else {
                // Вертикальный свайп
                if (Math.abs(diffY) > 30) {
                    movePlayer(diffY > 0 ? 'down' : 'up');
                }
            }

            gameState.touchStartX = 0;
            gameState.touchStartY = 0;
            e.preventDefault();
        }, { passive: false });
    }

    // Обработка клавиатуры
    function handleKeyPress(e) {
        if (!gameState.isPlaying) return;

        const keyMap = {
            'ArrowUp': 'up', 'w': 'up', 'ц': 'up',
            'ArrowDown': 'down', 's': 'down', 'ы': 'down',
            'ArrowLeft': 'left', 'a': 'left', 'ф': 'left',
            'ArrowRight': 'right', 'd': 'right', 'в': 'right'
        };

        if (keyMap[e.key]) {
            movePlayer(keyMap[e.key]);
            e.preventDefault();
        }
    }

    // Загрузка уровня
    function loadLevel(levelIndex) {
        stopMazeGame();
        
        gameState.currentLevel = levelIndex;
        const level = MAZE_CONFIG.levels[levelIndex];
        
        // Сброс состояния
        gameState.moves = 0;
        gameState.collectedStars = 0;
        gameState.timeLeft = level.time;
        gameState.isPlaying = true;
        
        // Генерация лабиринта
        generateMaze(level.size);
        
        // Обновление интерфейса
        updateUI();
        renderMaze();
        startTimer();
        
        // Анимация появления
        mazeGrid.classList.add('fade-in');
        setTimeout(() => mazeGrid.classList.remove('fade-in'), 500);
    }

    // Функция для добавления стен вокруг клетки
    function addWalls(x, y, walls, maze, size) {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Проверяем, что клетка внутри границ и является стеной
            if (newX > 0 && newX < size - 1 && 
                newY > 0 && newY < size - 1 && 
                maze[newY][newX] === 1) {
                walls.push({ 
                    x: newX, 
                    y: newY, 
                    fromX: x, 
                    fromY: y 
                });
            }
        }
    }

    // Генерация лабиринта (алгоритм Prim)
    function generateMaze(size) {
        // Инициализация
        const maze = Array(size).fill().map(() => Array(size).fill(1));
        const walls = [];
        
        // Начальная позиция
        const startX = 1, startY = 1;
        maze[startY][startX] = 0;
        gameState.player = { x: startX, y: startY };
        
        // Добавляем стены вокруг старта
        addWalls(startX, startY, walls, maze, size);
        
        // Алгоритм Prim
        while (walls.length > 0) {
            const randomIndex = Math.floor(Math.random() * walls.length);
            const wall = walls[randomIndex];
            walls.splice(randomIndex, 1);
            
            const { x, y, fromX, fromY } = wall;
            
            if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
                const oppositeX = x + (x - fromX);
                const oppositeY = y + (y - fromY);
                
                if (maze[oppositeY][oppositeX] === 1) {
                    maze[y][x] = 0;
                    maze[oppositeY][oppositeX] = 0;
                    addWalls(oppositeX, oppositeY, walls, maze, size);
                }
            }
        }
        
        // Устанавливаем выход
        let exitX, exitY;
        for (let y = size - 2; y >= 1; y--) {
            for (let x = size - 2; x >= 1; x--) {
                if (maze[y][x] === 0) {
                    exitX = x;
                    exitY = y;
                    y = 0; // Выход из внешнего цикла
                    break;
                }
            }
        }
        
        // Гарантируем, что выход найден
        if (!exitX || !exitY) {
            exitX = size - 2;
            exitY = size - 2;
            maze[exitY][exitX] = 0;
        }
        
        gameState.exit = { x: exitX, y: exitY };
            
        // Расставляем звёзды
        gameState.stars = [];
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        
        for (let i = 0; i < level.stars; i++) {
            let starX, starY;
            do {
                starX = Math.floor(Math.random() * (size - 2)) + 1;
                starY = Math.floor(Math.random() * (size - 2)) + 1;
            } while (maze[starY][starX] !== 0 || 
                     (starX === startX && starY === startY) ||
                     (starX === exitX && starY === exitY) ||
                     gameState.stars.some(s => s.x === starX && s.y === starY));
            
            gameState.stars.push({ x: starX, y: starY, collected: false });
        }
        
        gameState.maze = maze;
    }

    // Отрисовка лабиринта
    function renderMaze() {
        console.log('Отрисовка лабиринта');
        
        if (!mazeGrid) {
            console.error('mazeGrid не найден');
            mazeGrid = document.getElementById('maze-grid');
            if (!mazeGrid) {
                showError('Не удалось найти игровое поле');
                return;
            }
        }
        
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        const size = level.size;
        
        mazeGrid.innerHTML = '';
        mazeGrid.style.gridTemplateColumns = `repeat(${size}, ${MAZE_CONFIG.cellSize}px)`;
        mazeGrid.style.gridTemplateRows = `repeat(${size}, ${MAZE_CONFIG.cellSize}px)`;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                
                // Стена
                if (gameState.maze[y][x] === 1) {
                    cell.classList.add('wall');
                    cell.textContent = MAZE_CONFIG.wallChar;
                } 
                // Путь
                else {
                    cell.classList.add('path');
                    
                    // Игрок
                    if (x === gameState.player.x && y === gameState.player.y) {
                        cell.classList.add('player');
                        cell.textContent = MAZE_CONFIG.playerChar;
                    }
                    // Выход
                    else if (x === gameState.exit.x && y === gameState.exit.y) {
                        cell.classList.add('exit');
                        cell.textContent = MAZE_CONFIG.exitChar;
                    }
                    // Звезда
                    else {
                        const star = gameState.stars.find(s => s.x === x && s.y === y);
                        if (star) {
                            if (star.collected) {
                                cell.classList.add('star-collected');
                                cell.textContent = '✨';
                            } else {
                                cell.classList.add('star');
                                cell.textContent = MAZE_CONFIG.starChar;
                            }
                        }
                    }
                }
                
                mazeGrid.appendChild(cell);
            }
        }
        
        console.log('Лабиринт отрисован');
    }

    // Движение игрока
    function movePlayer(direction) {
        if (!gameState.isPlaying) return;
        
        const newPos = { ...gameState.player };
        
        switch (direction) {
            case 'up':    newPos.y--; break;
            case 'down':  newPos.y++; break;
            case 'left':  newPos.x--; break;
            case 'right': newPos.x++; break;
            default: return;
        }
        
        // Проверка на выход за границы и стены
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        if (newPos.x < 0 || newPos.x >= level.size || 
            newPos.y < 0 || newPos.y >= level.size ||
            gameState.maze[newPos.y][newPos.x] === 1) {
            return;
        }
        
        // Перемещаем игрока
        gameState.player = newPos;
        gameState.moves++;
        
        // Проверяем сбор звезды
        checkStarCollection();
        
        // Проверяем достижение выхода
        checkExitReached();
        
        // Обновляем отображение
        updateUI();
        renderMaze();
        
        // Анимация движения
        mazeGrid.classList.add('move-animation');
        setTimeout(() => mazeGrid.classList.remove('move-animation'), 200);
    }

    // Проверка сбора звезды
    function checkStarCollection() {
        const starIndex = gameState.stars.findIndex(s => 
            s.x === gameState.player.x && 
            s.y === gameState.player.y && 
            !s.collected
        );
        
        if (starIndex !== -1) {
            gameState.stars[starIndex].collected = true;
            gameState.collectedStars++;
            
            // Анимация сбора звезды
            const starCell = document.querySelector(`.maze-cell:nth-child(${
                gameState.player.y * MAZE_CONFIG.levels[gameState.currentLevel].size + 
                gameState.player.x + 1
            })`);
            if (starCell) {
                starCell.classList.add('star-collect-animation');
                setTimeout(() => starCell.classList.remove('star-collect-animation'), 500);
            }
        }
    }

    // Проверка достижения выхода
    function checkExitReached() {
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        
        if (gameState.player.x === gameState.exit.x && 
            gameState.player.y === gameState.exit.y) {
            
            // Все ли звёзды собраны?
            const allStarsCollected = gameState.collectedStars === level.stars;
            
            // Завершаем уровень
            gameState.isPlaying = false;
            clearInterval(gameState.timer);
            
            setTimeout(() => {
                showLevelComplete(allStarsCollected);
            }, 500);
        }
    }

    // Показ подсказки
    function showHint() {
        if (!gameState.isPlaying) return;
        
        // Находим кратчайший путь к выходу (упрощённый вариант)
        const path = findPathToExit();
        
        if (path.length > 0) {
            // Подсвечиваем клетки пути на 2 секунды
            path.forEach((cell, index) => {
                setTimeout(() => {
                    const cellElement = document.querySelector(`.maze-cell:nth-child(${
                        cell.y * MAZE_CONFIG.levels[gameState.currentLevel].size + 
                        cell.x + 1
                    })`);
                    if (cellElement) {
                        cellElement.classList.add('hint-path');
                        setTimeout(() => cellElement.classList.remove('hint-path'), 2000);
                    }
                }, index * 100);
            });
        }
    }

    // Поиск пути к выходу (упрощённый BFS)
    function findPathToExit() {
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        const size = level.size;
        const visited = Array(size).fill().map(() => Array(size).fill(false));
        const queue = [{ x: gameState.player.x, y: gameState.player.y, path: [] }];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === gameState.exit.x && current.y === gameState.exit.y) {
                return current.path;
            }
            
            if (visited[current.y][current.x]) continue;
            visited[current.y][current.x] = true;
            
            const directions = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                
                if (newX >= 0 && newX < size && newY >= 0 && newY < size &&
                    gameState.maze[newY][newX] === 0) {
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }]
                    });
                }
            }
        }
        
        return [];
    }

    // Запуск таймера
    function startTimer() {
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            updateUI();
            
            if (gameState.timeLeft <= 0) {
                gameState.isPlaying = false;
                clearInterval(gameState.timer);
                
                setTimeout(() => {
                    showTimeUp();
                }, 500);
            }
        }, 1000);
    }

    // Обновление интерфейса
    function updateUI() {
        if (!movesCount || !timerCount || !starsCount || !levelInfo) {
            console.warn('UI элементы не найдены');
            return;
        }
        
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        
        // Обновляем информацию об уровне
        levelInfo.style.background = `linear-gradient(135deg, ${level.color}20, ${level.color}40)`;
        levelInfo.querySelector('.level-name').textContent = 
            `Уровень ${level.id}: ${level.name}`;
        
        // Обновляем статистику
        movesCount.textContent = gameState.moves;
        starsCount.textContent = `${gameState.collectedStars}/${level.stars}`;
        
        // Форматируем время
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        timerCount.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerCount.style.color = gameState.timeLeft < 30 ? '#ef4444' : '#6b7280';
    }

    // Показ завершения уровня
    function showLevelComplete(allStarsCollected) {
        const level = MAZE_CONFIG.levels[gameState.currentLevel];
        
        let message = `🎉 Уровень ${level.id} пройден!\n\n`;
        message += `Ходы: ${gameState.moves}\n`;
        message += `Время: ${level.time - gameState.timeLeft} сек\n`;
        message += `Звёзды: ${gameState.collectedStars}/${level.stars}\n\n`;
        
        if (allStarsCollected) {
            message += `✨ Вы собрали ВСЕ звёзды! ✨\n`;
        }
        
        message += `\n${gameState.currentLevel < MAZE_CONFIG.levels.length - 1 ? 
            'Переходим к следующему уровню?' : 
            '🎊 Вы прошли все уровни! 🎊'}`;
        
        if (confirm(message)) {
            if (gameState.currentLevel < MAZE_CONFIG.levels.length - 1) {
                loadLevel(gameState.currentLevel + 1);
            } else {
                showAllLevelsComplete();
            }
        }
    }

    // Показ завершения всех уровней
    function showAllLevelsComplete() {
        sendMazeResult()
        alert(`🏆 ПОБЕДА! 🏆\n\nВы прошли все 5 уровней лабиринта!\n\nВаш кот-таролог 🐱 гордится вами!`);
        loadLevel(0); // Возвращаемся к первому уровню        
    }
    async function sendMazeResult() {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (!userId) return;
        
        try {
            const result = await window.CryptoUtils.sendResult(
                userId, 
                'maze', 
                5,      // 5 уровней
                true    // все уровни пройдены
            );
            console.log('Maze result sent:', result);
        } catch (e) {
            console.error('Error sending maze result:', e);
        }
    }
    
    // Показ истечения времени
    function showTimeUp() {
        alert(`⏰ Время вышло!\n\nУровень: ${gameState.currentLevel + 1}\nСобрано звёзд: ${gameState.collectedStars}\n\nПопробуйте снова!`);
        loadLevel(gameState.currentLevel);
    }

    // Функция показа ошибки
    function showError(message) {
        const mazeGameElement = document.getElementById('maze-game');
        if (mazeGameElement) {
            mazeGameElement.innerHTML = `
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

    // Экспорт функций
    window.startMazeGame = startMazeGame;
    window.stopMazeGame = stopMazeGame;
    
    console.log('✅ maze-game.js готов к использованию');
    
})(); // Конец IIFE
