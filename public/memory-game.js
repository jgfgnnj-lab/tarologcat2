// Файл для игры на запоминание карт

const gameConfig = {
    rows: 4,
    cols: 4,
    totalPairs: 8,
    cardSymbols: ['🎴', '🃏', '🔮', '✨', '⭐', '💫', '🌟', '☯️'],
    gameDuration: 120
};

let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timeLeft: gameConfig.gameDuration,
    timer: null,
    isPlaying: false
};

function startMemoryGame() {
    initGameUI();
    restartGame();
}

function stopMemoryGame() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    gameState.isPlaying = false;
}

function initGameUI() {
    const gameHTML = `
        <div class="memory-game-container">
            <h2>🎮 Игра на запоминание карт</h2>
            <p>Найдите все пары одинаковых карт!</p>
            
            <div class="game-stats">
                <div><span>Ходы:</span> <span id="moves-count">0</span></div>
                <div><span>Время:</span> <span id="timer">02:00</span></div>
                <div><span>Пары:</span> <span id="pairs-count">0/8</span></div>
            </div>
            
            <div id="game-board" class="game-board"></div>
            
            <div class="game-controls">
                <button onclick="restartGame()">🔄 Новая игра</button>
                <button onclick="showHint()" id="hint-button">💡 Подсказка</button>
            </div>
            
            <div class="instructions">
                <p><strong>Как играть:</strong></p>
                <ol>
                    <li>Нажимайте на карты чтобы перевернуть их</li>
                    <li>Найдите две одинаковые карты</li>
                    <li>Запоминайте расположение карт</li>
                    <li>Найдите все пары до окончания времени!</li>
                </ol>
            </div>
        </div>
    `;
    
    document.getElementById('memory-game').innerHTML = gameHTML;
    renderCards();
}

function restartGame() {
    stopMemoryGame();
    
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timeLeft: gameConfig.gameDuration,
        timer: null,
        isPlaying: true
    };
    
    createCards();
    renderCards();
    updateStats();
    startTimer();
}

function createCards() {
    let symbols = [];
    for (let i = 0; i < gameConfig.totalPairs; i++) {
        const symbol = gameConfig.cardSymbols[i % gameConfig.cardSymbols.length];
        symbols.push(symbol, symbol);
    }
    
    // Перемешиваем
    symbols = symbols.sort(() => Math.random() - 0.5);
    
    gameState.cards = symbols.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isFlipped: false,
        isMatched: false
    }));
}

function renderCards() {
    const board = document.getElementById('game-board');
    if (!board) return;
    
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${gameConfig.cols}, 1fr)`;
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `memory-card ${card.isMatched ? 'matched' : ''}`;
        cardElement.dataset.id = card.id;
        
        cardElement.innerHTML = `
            <div class="card-inner ${card.isFlipped || card.isMatched ? 'flipped' : ''}">
                <div class="card-front">?</div>
                <div class="card-back">${card.symbol}</div>
            </div>
        `;
        
        if (!card.isMatched) {
            cardElement.addEventListener('click', () => flipCard(card.id));
        }
        
        board.appendChild(cardElement);
    });
}

function flipCard(cardId) {
    if (!gameState.isPlaying || gameState.flippedCards.length >= 2) return;
    
    const card = gameState.cards.find(c => c.id === cardId);
    if (card.isFlipped || card.isMatched) return;
    
    card.isFlipped = true;
    gameState.flippedCards.push(card);
    renderCards();
    
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateStats();
        
        const [card1, card2] = gameState.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Найдена пара
            card1.isMatched = true;
            card2.isMatched = true;
            gameState.matchedPairs++;
            gameState.flippedCards = [];
            
            if (gameState.matchedPairs === gameConfig.totalPairs) {
                // Победа!
                gameState.isPlaying = false;
                clearInterval(gameState.timer);
                setTimeout(() => {
                    alert(`🎉 Победа! Ходов: ${gameState.moves}, Время: ${formatTime(gameConfig.gameDuration - gameState.timeLeft)}`);
                }, 500);
            }
        } else {
            // Не совпали
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                gameState.flippedCards = [];
                renderCards();
            }, 1000);
        }
        updateStats();
    }
}

function showHint() {
    if (!gameState.isPlaying || gameState.flippedCards.length !== 1) return;
    
    const flippedCard = gameState.flippedCards[0];
    const matchingCard = gameState.cards.find(c => 
        !c.isMatched && !c.isFlipped && c.id !== flippedCard.id && c.symbol === flippedCard.symbol
    );
    
    if (matchingCard) {
        const cardElement = document.querySelector(`.memory-card[data-id="${matchingCard.id}"]`);
        cardElement.classList.add('hint');
        setTimeout(() => cardElement.classList.remove('hint'), 1500);
    }
}

function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateStats();
        
        if (gameState.timeLeft <= 0) {
            gameState.isPlaying = false;
            clearInterval(gameState.timer);
            setTimeout(() => {
                alert(`⏰ Время вышло! Найдено пар: ${gameState.matchedPairs}/${gameConfig.totalPairs}`);
            }, 500);
        }
    }, 1000);
}

function updateStats() {
    const movesEl = document.getElementById('moves-count');
    const timerEl = document.getElementById('timer');
    const pairsEl = document.getElementById('pairs-count');
    
    if (movesEl) movesEl.textContent = gameState.moves;
    if (timerEl) timerEl.textContent = formatTime(gameState.timeLeft);
    if (pairsEl) pairsEl.textContent = `${gameState.matchedPairs}/${gameConfig.totalPairs}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
