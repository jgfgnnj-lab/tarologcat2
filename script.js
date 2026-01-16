// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Инициализация приложения
tg.expand();
tg.ready();

// Переменные состояния
let selectedSpread = 1;
let currentReading = null;

// База данных карт Таро
const TAROT_CARDS = [
    { name: "Шут", upright: "Начало пути, спонтанность, свобода", reversed: "Безрассудство, риск, незрелость" },
    { name: "Маг", upright: "Сила воли, мастерство, концентрация", reversed: "Обман, манипуляции, слабость" },
    { name: "Верховная Жрица", upright: "Интуиция, тайны, подсознание", reversed: "Скрытые мотивы, подавленная интуиция" },
    { name: "Императрица", upright: "Изобилие, природа, плодородие, красота", reversed: "Зависимость, расточительность, бездействие" },
    { name: "Император", upright: "Власть, контроль, структура, стабильность", reversed: "Тирания, жесткость, отсутствие дисциплины" },
    { name: "Иерофант", upright: "Традиции, духовность, вера, образование", reversed: "Догматизм, лицемерие, подавление" },
    { name: "Влюбленные", upright: "Любовь, гармония, партнерство, выбор", reversed: "Разлад, конфликты, неверный выбор" },
    { name: "Колесница", upright: "Победа, контроль, движение вперед, воля", reversed: "Потеря контроля, авария, застой" },
    { name: "Сила", upright: "Смелость, сострадание, внутренняя сила, терпение", reversed: "Слабость, неуверенность, злоупотребление силой" },
    { name: "Отшельник", upright: "Размышления, поиск истины, одиночество, мудрость", reversed: "Изоляция, одиночество, отказ от помощи" }
];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeLibrary();
    setupEventListeners();
    updateUserInfo();
});

// Обновление информации о пользователе
function updateUserInfo() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        console.log('Пользователь Telegram:', user);
    }
}

// Выбор расклада
function selectSpread(spread) {
    selectedSpread = spread;
    
    // Обновляем стиль активной кнопки
    document.querySelectorAll('.spread-btn').forEach(btn => {
        btn.style.borderColor = '#e2e8f0';
        btn.style.background = 'white';
    });
    
    event.currentTarget.style.borderColor = '#8b5cf6';
    event.currentTarget.style.background = '#f5f3ff';
}

// Проведение гадания
function performReading() {
    const question = document.getElementById('questionInput').value;
    
    // Вытягиваем карты
    const cards = [];
    for (let i = 0; i < selectedSpread; i++) {
        const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        const isReversed = Math.random() > 0.5;
        
        cards.push({
            name: randomCard.name,
            orientation: isReversed ? 'reversed' : 'upright',
            meaning: isReversed ? randomCard.reversed : randomCard.upright,
            upright: randomCard.upright,
            reversed: randomCard.reversed
        });
    }
    
    // Создаем интерпретацию
    const interpretation = generateInterpretation(cards, question);
    
    // Сохраняем текущее гадание
    currentReading = {
        spread: selectedSpread,
        question: question,
        cards: cards,
        interpretation: interpretation,
        timestamp: new Date().toISOString()
    };
    
    // Показываем результаты
    displayResults(cards, interpretation);
    
    // Показываем секцию результатов
    document.getElementById('resultsSection').style.display = 'block';
    
    // Прокручиваем к результатам
    document.getElementById('resultsSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    // Отправляем данные в бота БЕЗ всплывающих окон
    sendToTelegram({
        action: 'reading_completed',
        cards_count: cards.length,
        spread: selectedSpread
    });
}

// Генерация интерпретации
function generateInterpretation(cards, question) {
    let interpretation = '<div class="interpretation-content">';
    
    if (question) {
        interpretation += `<p class="question"><strong>Ваш вопрос:</strong> ${question}</p>`;
    }
    
    interpretation += '<div class="cards-analysis">';
    
    cards.forEach((card, index) => {
        const position = getCardPosition(index, cards.length);
        interpretation += `
            <div class="card-analysis">
                <div class="card-analysis-header">
                    <span class="card-number">${index + 1}</span>
                    <h4>${position}: ${card.name}</h4>
                    <span class="card-orientation">${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}</span>
                </div>
                <p class="card-meaning">${card.meaning}</p>
            </div>
        `;
    });
    
    interpretation += '</div>';
    
    // Общий совет
    interpretation += '<div class="advice-section">';
    interpretation += '<h4>✨ Общий совет:</h4>';
    
    const uprightCount = cards.filter(c => c.orientation === 'upright').length;
    const reversedCount = cards.length - uprightCount;
    
    if (uprightCount > reversedCount) {
        interpretation += '<p>Ситуация развивается благоприятно. Продолжайте двигаться в выбранном направлении.</p>';
    } else if (reversedCount > uprightCount) {
        interpretation += '<p>Будьте осторожны. Возможно, стоит пересмотреть свои планы или подождать более подходящего момента.</p>';
    } else {
        interpretation += '<p>Ситуация нейтральна. Ваш выбор и действия будут определять исход.</p>';
    }
    
    interpretation += '</div></div>';
    
    return interpretation;
}

// Получение позиции карты в раскладе
function getCardPosition(index, total) {
    if (total === 1) return "Карта дня";
    if (total === 3) {
        const positions = ["Прошлое", "Настоящее", "Будущее"];
        return positions[index];
    }
    if (total === 5) {
        const positions = ["Ситуация", "Вызов", "Совет", "Внешнее влияние", "Итог"];
        return positions[index];
    }
    return `Карта ${index + 1}`;
}

// Отображение результатов
function displayResults(cards, interpretation) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.orientation}`;
        cardElement.innerHTML = `
            <div class="card-symbol">🎴</div>
            <div class="card-name">${card.name}</div>
            <div class="card-orientation">${card.orientation === 'upright' ? 'Прямая' : 'Перевернутая'}</div>
        `;
        
        // Показываем детали при клике
        cardElement.addEventListener('click', () => {
            showCardDetailsInInterface(card);
        });
        
        container.appendChild(cardElement);
    });
    
    document.getElementById('interpretation').innerHTML = interpretation;
}

// Показать детали карты в интерфейсе (без Telegram popup)
function showCardDetailsInInterface(card) {
    const detailsDiv = document.getElementById('cardDetails');
    if (!detailsDiv) {
        // Создаем элемент если его нет
        const div = document.createElement('div');
        div.id = 'cardDetails';
        div.className = 'card-details-overlay';
        div.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        div.innerHTML = `
            <div class="card-details-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    float: right;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
                <h3>${card.name}</h3>
                <p><strong>Прямое значение:</strong> ${card.upright}</p>
                <p><strong>Перевернутое значение:</strong> ${card.reversed}</p>
                <p><em>Текущее положение: ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}</em></p>
            </div>
        `;
        
        document.body.appendChild(div);
    } else {
        // Обновляем существующий
        detailsDiv.innerHTML = `
            <div class="card-details-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 100%;
            ">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    float: right;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
                <h3>${card.name}</h3>
                <p><strong>Прямое значение:</strong> ${card.upright}</p>
                <p><strong>Перевернутое значение:</strong> ${card.reversed}</p>
                <p><em>Текущее положение: ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}</em></p>
            </div>
        `;
        detailsDiv.style.display = 'flex';
    }
}

// Сохранение гадания
function saveReading() {
    if (!currentReading) {
        showMessage('Сначала проведите гадание!', 'error');
        return;
    }
    
    // Отправляем данные в бота
    const data = {
        action: 'save_reading',
        spread: currentReading.spread,
        cards: currentReading.cards.map(c => ({ 
            name: c.name, 
            orientation: c.orientation 
        })),
        timestamp: currentReading.timestamp
    };
    
    tg.sendData(JSON.stringify(data));
    
    showMessage('✅ Гадание сохранено в вашу историю!', 'success');
}

// Сброс гадания
function resetReading() {
    currentReading = null;
    document.getElementById('questionInput').value = '';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('cardsContainer').innerHTML = '';
    document.getElementById('interpretation').innerHTML = '';
    
    // Прокручиваем в начало
    document.querySelector('.reading-type').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Инициализация библиотеки карт
function initializeLibrary() {
    const library = document.getElementById('cardLibrary');
    if (!library) return;
    
    TAROT_CARDS.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'library-card';
        cardElement.innerHTML = `
            <h4>${card.name}</h4>
            <p><strong>🔼 Прямое:</strong> ${card.upright.substring(0, 60)}...</p>
            <p><strong>🔽 Перевернутое:</strong> ${card.reversed.substring(0, 60)}...</p>
        `;
        
        cardElement.addEventListener('click', () => {
            showCardDetailsInInterface({
                name: card.name,
                upright: card.upright,
                reversed: card.reversed,
                orientation: 'upright'
            });
        });
        
        library.appendChild(cardElement);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработка кнопки "Назад" в Telegram
    if (tg.platform !== 'unknown') {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            tg.close();
        });
    }
    
    // Обработка выбора типа гадания
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(b => {
                b.style.borderColor = '#e2e8f0';
                b.style.background = '#f8fafc';
            });
            this.style.borderColor = '#6d28d9';
            this.style.background = '#f3e8ff';
        });
    });
    
    // Обработка выбора расклада
    document.querySelectorAll('.spread-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const spread = parseInt(this.getAttribute('data-spread') || '1');
            selectSpread(spread);
        });
    });
}

// Отправка данных в Telegram (упрощенная)
function sendToTelegram(data) {
    try {
        tg.sendData(JSON.stringify(data));
    } catch (error) {
        console.log('Ошибка отправки данных:', error);
    }
}

// Показать сообщение в интерфейсе
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        // Создаем элемент для сообщений
        const div = document.createElement('div');
        div.id = 'message';
        div.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 10px;
            z-index: 1000;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            animation: slideDown 0.3s ease;
        `;
        document.body.appendChild(div);
    }
    
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.style.display = 'block';
    
    if (type === 'success') {
        messageElement.style.background = '#10b981';
        messageElement.style.color = 'white';
    } else if (type === 'error') {
        messageElement.style.background = '#ef4444';
        messageElement.style.color = 'white';
    } else {
        messageElement.style.background = '#3b82f6';
        messageElement.style.color = 'white';
    }
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

// Добавляем стили для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    .card-details-overlay {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);
