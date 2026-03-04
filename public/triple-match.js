// triple-match.js

let tripleGame = null;
let tripleGameInitialized = false;

function startTripleMatchGame() {
    console.log('🟢 Запуск игры Три в ряд...');
    
    if (tripleGameInitialized) {
        console.log('Игра уже инициализирована, перезапускаем...');
        tripleGame?.newGame();
        return;
    }
    
    const gameContainer = document.getElementById('triple-match-game');
    if (!gameContainer) {
        console.error('❌ Контейнер triple-match-game не найден!');
        return;
    }
    
    gameContainer.innerHTML = '';
    
    const gameHTML = `
        <div class="triple-container">
            <div class="triple-header">
                <h1>🌈 Три в ряд</h1>
                <p>Собирай комбинации из трёх одинаковых символов</p>
            </div>
            
            <div class="game-stats">
                <div class="stat-item">
                    <div class="stat-label">ОЧКИ</div>
                    <div class="stat-value" id="triple-score">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">ХОДЫ</div>
                    <div class="stat-value" id="triple-moves">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">ЦЕПОЧКА</div>
                    <div class="stat-value" id="triple-chain">0</div>
                </div>
            </div>
            
            <div id="triple-board"></div>
            
            <div class="game-buttons">
                <button id="triple-new-game-btn" class="game-btn">
                    <i class="fas fa-redo"></i> <span>Новая игра</span>
                </button>
                <button id="triple-hint-btn" class="game-btn">
                    <i class="fas fa-lightbulb"></i> <span>Подсказка</span>
                </button>
                <button id="triple-shuffle-btn" class="game-btn">
                    <i class="fas fa-random"></i> <span>Перемешать</span>
                </button>
            </div>
            
            <div class="instructions">
                <h3><i class="fas fa-info-circle"></i> Как играть:</h3>
                <ul>
                    <li><i class="fas fa-finger"></i> Нажимай на соседние клетки</li>
                    <li><i class="fas fa-arrow-right-arrow-left"></i> Меняй их местами</li>
                    <li><i class="fas fa-star"></i> Собирай 3+ одинаковых</li>
                    <li><i class="fas fa-bolt"></i> Длинные цепочки = больше очков</li>
                </ul>
            </div>
        </div>
        
        <div class="game-over-screen" id="triple-game-over">
            <div class="game-over-content">
                <h2>ИГРА ЗАВЕРШЕНА!</h2>
                <div class="final-score" id="triple-final-score">0</div>
                <p id="triple-game-message">Отличный результат!</p>
                <button id="triple-play-again" class="game-btn">
                    <i class="fas fa-play"></i> Играть снова
                </button>
            </div>
        </div>
    `;
    
    gameContainer.innerHTML = gameHTML;
    
    tripleGame = new TripleMatchGame();
    tripleGameInitialized = true;
    
    setupTripleEventListeners();
    
    console.log('✅ Игра Три в ряд запущена!');
}

class TripleMatchGame {
    constructor() {
        this.board = [];
        this.rows = 6;
        this.cols = 6;
        this.cellTypes = ['❤️', '⭐', '🌙', '🍀', '🌸', '💎'];
        this.score = 0;
        this.moves = 0;
        this.chainCount = 0;
        this.selectedCell = null;
        this.isAnimating = false;
        
        // Создаем игровое поле
        this.createBoard();
        // Убираем начальные совпадения
        while (this.findAllMatches().length > 0) {
            this.removeMatches();
            this.fillBoard();
        }
        
        this.render();
        this.updateUI();
    }
    
    createBoard() {
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = Math.floor(Math.random() * this.cellTypes.length);
            }
        }
    }
    
    render() {
        const boardElement = document.getElementById('triple-board');
        if (!boardElement) return;
        
        let html = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.board[r][c];
                const isSelected = this.selectedCell && 
                                   this.selectedCell.row === r && 
                                   this.selectedCell.col === c;
                
                html += `
                    <div class="triple-cell ${isSelected ? 'selected' : ''}" 
                         data-row="${r}" 
                         data-col="${c}" 
                         data-type="${type}"
                         style="animation: none;">
                        ${this.cellTypes[type]}
                    </div>
                `;
            }
        }
        boardElement.innerHTML = html;
    }
    
    findAllMatches() {
        const matches = [];
        
        // Поиск горизонтальных совпадений
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                const val = this.board[r][c];
                if (val === null) continue;
                
                if (this.board[r][c + 1] === val && this.board[r][c + 2] === val) {
                    let matchLength = 3;
                    while (c + matchLength < this.cols && this.board[r][c + matchLength] === val) {
                        matchLength++;
                    }
                    
                    for (let i = 0; i < matchLength; i++) {
                        matches.push({row: r, col: c + i});
                    }
                    c += matchLength - 1;
                }
            }
        }
        
        // Поиск вертикальных совпадений
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows - 2; r++) {
                const val = this.board[r][c];
                if (val === null) continue;
                
                if (this.board[r + 1][c] === val && this.board[r + 2][c] === val) {
                    let matchLength = 3;
                    while (r + matchLength < this.rows && this.board[r + matchLength][c] === val) {
                        matchLength++;
                    }
                    
                    for (let i = 0; i < matchLength; i++) {
                        matches.push({row: r + i, col: c});
                    }
                    r += matchLength - 1;
                }
            }
        }
        
        // Убираем дубликаты
        return matches.filter((match, index, self) => 
            index === self.findIndex(m => m.row === match.row && m.col === match.col)
        );
    }
    
    removeMatches() {
        const matches = this.findAllMatches();
        
        if (matches.length === 0) return 0;
        
        // Считаем очки
        const matchCount = matches.length;
        if (matchCount >= 6) {
            this.chainCount++;
            this.score += matchCount * 20 * this.chainCount;
        } else {
            this.chainCount = 1;
            this.score += matchCount * 10;
        }
        
        // Анимируем совпадения
        matches.forEach(match => {
            const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            if (cell) {
                cell.style.animation = 'match 0.3s ease';
                setTimeout(() => {
                    cell.style.animation = '';
                }, 300);
            }
        });
        
        // Удаляем совпадения
        matches.forEach(match => {
            this.board[match.row][match.col] = null;
        });
        
        return matches.length;
    }
    
    fillBoard() {
        // Сохраняем текущее состояние DOM
        const boardElement = document.getElementById('triple-board');
        const cells = boardElement?.children;
        
        for (let c = 0; c < this.cols; c++) {
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.board[r][c] === null || this.board[r][c] === undefined) {
                    // Сдвигаем элементы вниз
                    for (let r2 = r - 1; r2 >= 0; r2--) {
                        if (this.board[r2][c] !== null && this.board[r2][c] !== undefined) {
                            this.board[r][c] = this.board[r2][c];
                            this.board[r2][c] = null;
                            break;
                        }
                    }
                    
                    // Если после сдвига все еще null, создаем новый
                    if (this.board[r][c] === null || this.board[r][c] === undefined) {
                        this.board[r][c] = Math.floor(Math.random() * this.cellTypes.length);
                    }
                }
            }
        }
    }
    
    async swapCells(cell1, cell2) {
        const temp = this.board[cell1.row][cell1.col];
        this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
        this.board[cell2.row][cell2.col] = temp;
        
        // Анимация свапа
        const cell1El = document.querySelector(`[data-row="${cell1.row}"][data-col="${cell1.col}"]`);
        const cell2El = document.querySelector(`[data-row="${cell2.row}"][data-col="${cell2.col}"]`);
        
        if (cell1El && cell2El) {
            cell1El.classList.add('swapping');
            cell2El.classList.add('swapping');
            
            setTimeout(() => {
                cell1El.classList.remove('swapping');
                cell2El.classList.remove('swapping');
            }, 200);
        }
        
        this.moves++;
        this.updateUI();
        
        // Проверяем совпадения
        await this.processMatches();
    }
    
    async processMatches() {
        let matchesFound;
        do {
            matchesFound = this.removeMatches();
            if (matchesFound > 0) {
                // НЕ перерисовываем здесь, removeMatches уже обновил классы
                await this.sleep(400);
                
                // Заполняем пустоты
                this.fillBoard();
                
                // Теперь перерисовываем
                this.render();
                await this.sleep(200);
            }
        } while (matchesFound > 0);
        
        this.updateUI();
        this.selectedCell = null;
        this.isAnimating = false;
        
        // Проверяем, есть ли возможные ходы
        if (!this.hasPossibleMoves()) {
            this.showGameOver();
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    hasPossibleMoves() {
        // Проверяем все возможные свапы
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Проверяем соседей
                const directions = [
                    {dr: 0, dc: 1},  // право
                    {dr: 1, dc: 0}   // низ
                ];
                
                for (let dir of directions) {
                    const nr = r + dir.dr;
                    const nc = c + dir.dc;
                    
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        // Пробуем поменять
                        [this.board[r][c], this.board[nr][nc]] = [this.board[nr][nc], this.board[r][c]];
                        
                        const hasMatch = this.findAllMatches().length > 0;
                        
                        // Меняем обратно
                        [this.board[r][c], this.board[nr][nc]] = [this.board[nr][nc], this.board[r][c]];
                        
                        if (hasMatch) return true;
                    }
                }
            }
        }
        return false;
    }
    
    showGameOver() {
        const gameOverScreen = document.getElementById('triple-game-over');
        const finalScore = document.getElementById('triple-final-score');
        const message = document.getElementById('triple-game-message');
        
        finalScore.textContent = this.score;
        
        if (this.score < 100) {
            message.textContent = 'Неплохо для начала!';
        } else if (this.score < 300) {
            message.textContent = 'Хорошая игра!';
        } else if (this.score < 600) {
            message.textContent = 'Отличный результат!';
        } else {
            message.textContent = 'Ты настоящий чемпион! 🏆';
        }
        
        gameOverScreen.classList.add('show');

        this.sendTripleResult();
    }

    async sendTripleResult() {
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (!userId) return;
        
        await window.CryptoUtils.sendResult(userId, 'triple', this.score, this.score >= 1000);
    }
    
    updateUI() {
        document.getElementById('triple-score').textContent = this.score;
        document.getElementById('triple-moves').textContent = this.moves;
        document.getElementById('triple-chain').textContent = this.chainCount;
    }
    
    async handleCellClick(row, col) {
        if (this.isAnimating) return;
        
        if (!this.selectedCell) {
            // Выбираем первую клетку
            this.selectedCell = {row, col};
            this.render();
            return;
        }
        
        // Проверяем, соседние ли клетки
        const rowDiff = Math.abs(this.selectedCell.row - row);
        const colDiff = Math.abs(this.selectedCell.col - col);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Соседние клетки - делаем свап
            this.isAnimating = true;
            await this.swapCells(this.selectedCell, {row, col});
        }
        
        // Снимаем выделение
        this.selectedCell = null;
        this.render();
    }
    
    newGame() {
        this.board = [];
        this.score = 0;
        this.moves = 0;
        this.chainCount = 0;
        this.selectedCell = null;
        this.isAnimating = false;
        
        this.createBoard();
        while (this.findAllMatches().length > 0) {
            this.removeMatches();
            this.fillBoard();
        }
        
        this.render();
        this.updateUI();
        
        document.getElementById('triple-game-over').classList.remove('show');
    }
    
    findHint() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const directions = [
                    {dr: 0, dc: 1},  // право
                    {dr: 1, dc: 0}   // низ
                ];
                
                for (let dir of directions) {
                    const nr = r + dir.dr;
                    const nc = c + dir.dc;
                    
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        [this.board[r][c], this.board[nr][nc]] = [this.board[nr][nc], this.board[r][c]];
                        
                        const hasMatch = this.findAllMatches().length > 0;
                        
                        [this.board[r][c], this.board[nr][nc]] = [this.board[nr][nc], this.board[r][c]];
                        
                        if (hasMatch) {
                            // Подсвечиваем подсказку
                            const cell1 = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                            const cell2 = document.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
                            
                            if (cell1 && cell2) {
                                cell1.style.border = '2px solid #feca57';
                                cell2.style.border = '2px solid #feca57';
                                cell1.style.boxShadow = '0 0 20px #feca57';
                                cell2.style.boxShadow = '0 0 20px #feca57';
                                
                                setTimeout(() => {
                                    cell1.style.border = '';
                                    cell2.style.border = '';
                                    cell1.style.boxShadow = '';
                                    cell2.style.boxShadow = '';
                                }, 2000);
                            }
                            
                            return;
                        }
                    }
                }
            }
        }
        
        // Если нет ходов, показываем сообщение
        alert('Нет доступных ходов! Нажми "Перемешать"');
    }
    
    shuffleBoard() {
        // Перемешиваем все клетки
        const flatBoard = this.board.flat();
        for (let i = flatBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatBoard[i], flatBoard[j]] = [flatBoard[j], flatBoard[i]];
        }
        
        // Заполняем обратно
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = flatBoard[r * this.cols + c];
            }
        }
        
        // Убираем совпадения
        while (this.findAllMatches().length > 0) {
            this.removeMatches();
            this.fillBoard();
        }
        
        this.render();
    }
}

function setupTripleEventListeners() {
    // Обработчик кликов по клеткам
    document.getElementById('triple-board')?.addEventListener('click', (e) => {
        const cell = e.target.closest('.triple-cell');
        if (!cell || !tripleGame) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        tripleGame.handleCellClick(row, col);
    });
    
    document.getElementById('triple-new-game-btn')?.addEventListener('click', () => {
        tripleGame?.newGame();
    });
    
    document.getElementById('triple-hint-btn')?.addEventListener('click', () => {
        tripleGame?.findHint();
    });
    
    document.getElementById('triple-shuffle-btn')?.addEventListener('click', () => {
        tripleGame?.shuffleBoard();
    });
    
    document.getElementById('triple-play-again')?.addEventListener('click', () => {
        tripleGame?.newGame();
        document.getElementById('triple-game-over').classList.remove('show');
    });
}

window.startTripleMatchGame = startTripleMatchGame;
window.tripleGameInitialized = false;
