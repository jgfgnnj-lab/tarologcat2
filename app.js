// Конфигурация
const CONFIG = {
    API_URL: 'https://ваш-домен.vercel.app/api', // Замените на ваш домен
    CARDS_COUNT: 5,
    MAX_QUESTION_LENGTH: 500
};

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние приложения
let state = {
    question: '',
    cards: [],
    interpretation: '',
    history: [],
    currentReadingId: null
};

// DOM элементы
const elements = {
    screens: document.querySelectorAll('.screen'),
    questionScreen: document.getElementById('question-screen'),
    cardsScreen: document.getElementById('cards-screen'),
    interpretationScreen: document.getElementById('interpretation-screen'),
    historyScreen: document.getElementById('history-screen'),
    questionInput: document.getElementById('user-question'),
    charCount: document.getElementById('char-count'),
    startBtn: document.getElementById('start-reading'),
    cardsContainer: document.getElementById('cards-container'),
    currentQuestion: document.getElementById('current-question'),
    interpretationContent: document.getElementById('interpretation-content'),
    historyList: document.getElementById('history-list'),
    interpretBtn: document.getElementById('interpret-btn'),
    saveBtn: document.getElementById('save-reading'),
    newReadingBtn: document.getElementById('new-reading'),
    backToCards: document.getElementById('back-to-cards'),
    backToMain: document.getElementById('back-to-main'),
    cardModal: document.getElementById('card-modal'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.querySelector('.close-modal'),
    loader: document.getElementById('loader'),
    navBtns: document.querySelectorAll('.nav-btn'),
    navCards: document.getElementById('nav-cards')
};

// Инициализация
function init() {
    loadHistory();
    setupEventListeners();
    
    // Показываем главный экран
    showScreen('question');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Счетчик символов
    elements.questionInput.addEventListener('input', updateCharCounter);
    
    // Кнопка начала гадания
    elements.startBtn.addEventListener('click', startReading);
    
    // Кнопки навигации
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            if (screen === 'cards' && !state.cards.length) {
                showNotification('Сначала начните гадание!');
                return;
            }
            showScreen(screen);
        });
    });
    
    // Кнопки экрана карт
    elements.interpretBtn.addEventListener('click', getInterpretation);
    elements.saveBtn.addEventListener('click', saveReading);
    elements.newReadingBtn.addEventListener('click', () => {
        state.cards = [];
        showScreen('question');
    });
    
    // Кнопки назад
    elements.backToCards.addEventListener('click', () => showScreen('cards'));
    elements.backToMain.addEventListener('click', () => showScreen('question'));
    
    // Модальное окно
    elements.closeModal.addEventListener('click', () => {
        elements.cardModal.classList.remove('active');
    });
    
    // Клик вне модального окна
    elements.cardModal.addEventListener('click', (e) => {
        if (e.target === elements.cardModal) {
            elements.cardModal.classList.remove('active');
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.cardModal.classList.remove('active');
        }
    });
}

// Обновление счетчика символов
function updateCharCounter() {
    const length = elements.questionInput.value.length;
    const remaining = CONFIG.MAX_QUESTION_LENGTH - length;
    elements.charCount.textContent = remaining;
    elements.charCount.style.color = remaining < 50 ? '#f72585' : '#a9a9a9';
}

// Начать гадание
async function startReading() {
    state.question = elements.questionInput.value.trim();
    
    if (!state.question) {
        showNotification('Пожалуйста, задайте вопрос!');
        return;
    }
    
    if (state.question.length < 5) {
        showNotification('Вопрос должен содержать хотя бы 5 символов');
        return;
    }
    
    showLoader(true);
    
    try {
        // Получаем случайные карты с бэкенда
        const response = await fetch(`${CONFIG.API_URL}/draw-cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: state.question,
                count: CONFIG.CARDS_COUNT,
                user_id: tg.initDataUnsafe.user?.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.cards = data.cards;
            state.currentReadingId = data.reading_id;
            
            // Обновляем интерфейс
            elements.currentQuestion.textContent = `Вопрос: "${state.question}"`;
            renderCards();
            
            showScreen('cards');
            showNotification('Карты выпали! Нажмите на карту для описания.');
        } else {
            showNotification('Ошибка при выборе карт. Попробуйте снова.');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Ошибка соединения. Проверьте интернет.');
    } finally {
        showLoader(false);
    }
}

// Отобразить карты
function renderCards() {
    elements.cardsContainer.innerHTML = '';
    
    state.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.innerHTML = `
            <div class="card-image">
                <i class="fas fa-star"></i>
            </div>
            <div class="card-info">
                <div class="card-name">${card.name}</div>
                <div class="card-position">
                    <i class="fas fa-${card.orientation === 'upright' ? 'arrow-up' : 'arrow-down'}"></i>
                    ${card.orientation === 'upright' ? 'Прямая' : 'Перевернутая'}
                </div>
            </div>
        `;
        
        cardElement.addEventListener('click', () => showCardDetails(card, index + 1));
        elements.cardsContainer.appendChild(cardElement);
    });
}

// Показать детали карты
function showCardDetails(card, position) {
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <h3 style="color: #4cc9f0; margin-bottom: 10px;">${card.name}</h3>
            <div style="color: #a9a9a9; margin-bottom: 20px;">
                Позиция: ${position} • ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}
            </div>
        </div>
        <div style="background: rgba(76, 201, 240, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <strong style="color: #72efdd;">Значение:</strong><br>
            ${card.meaning}
        </div>
        <div style="margin-bottom: 20px;">
            <strong style="color: #72efdd;">Совет:</strong><br>
            ${getCardAdvice(card)}
        </div>
        <div style="font-size: 14px; color: #a9a9a9;">
            <i class="fas fa-info-circle"></i> Нажмите на другие карты для просмотра их значений.
        </div>
    `;
    
    elements.cardModal.classList.add('active');
}

// Получить совет для карты
function getCardAdvice(card) {
    const upright = card.orientation === 'upright';
    
    if (card.name.includes('Жезл')) {
        return upright 
            ? 'Действуйте решительно, используйте свою энергию.'
            : 'Сдерживайте импульсы, обдумывайте действия.';
    } else if (card.name.includes('Кубк')) {
        return upright
            ? 'Доверяйте чувствам, будьте открыты.'
            : 'Защищайте эмоции, не принимайте близко к сердцу.';
    } else if (card.name.includes('Меч')) {
        return upright
            ? 'Будьте честны и ясны в коммуникации.'
            : 'Избегайте конфликтов, выбирайте слова мудро.';
    } else if (card.name.includes('Пентакл')) {
        return upright
            ? 'Практичные решения принесут результаты.'
            : 'Будьте осторожны в финансовых вопросах.';
    } else {
        return upright
            ? 'Эта карта указывает на важный жизненный урок.'
            : 'Ситуация требует переосмысления.';
    }
}

// Получить интерпретацию
async function getInterpretation() {
    if (!state.cards.length || !state.currentReadingId) {
        showNotification('Сначала выберите карты!');
        return;
    }
    
    showLoader(true);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/interpret`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reading_id: state.currentReadingId,
                user_id: tg.initDataUnsafe.user?.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            state.interpretation = data.interpretation;
            renderInterpretation();
            showScreen('interpretation');
        } else {
            showNotification('Ошибка при получении интерпретации.');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Ошибка соединения.');
    } finally {
        showLoader(false);
    }
}

// Отобразить интерпретацию
function renderInterpretation() {
    elements.interpretationContent.innerHTML = `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #4cc9f0; margin-bottom: 10px;">📝 Ваш вопрос:</h3>
            <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                "${state.question}"
            </p>
        </div>
        
        <h3 style="color: #4cc9f0; margin-bottom: 15px;">🔮 Интерпретация карт:</h3>
        
        ${state.cards.map((card, index) => `
            <div class="card-interpretation">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: #72efdd;">${index + 1}. ${card.name}</strong>
                    <span style="color: ${card.orientation === 'upright' ? '#4ade80' : '#f72585'}">
                        ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Значение:</strong> ${card.meaning}
                </div>
                <div style="font-size: 14px;">
                    <strong>Позиция в раскладе:</strong> ${getPositionMeaning(index + 1)}
                </div>
            </div>
        `).join('')}
        
        ${state.interpretation ? `
            <div style="margin-top: 25px; padding: 20px; background: rgba(76, 201, 240, 0.1); border-radius: 15px;">
                <h4 style="color: #4cc9f0; margin-bottom: 10px;">✨ Полный анализ:</h4>
                <p>${state.interpretation}</p>
            </div>
        ` : ''}
        
        <div style="margin-top: 25px; text-align: center; color: #a9a9a9; font-size: 14px;">
            <i class="fas fa-crystal-ball"></i> Запомните этот расклад или сохраните его в истории.
        </div>
    `;
}

// Получить значение позиции
function getPositionMeaning(position) {
    const meanings = [
        'События которые произойдут',
        'Возможные преграды',
        'Источник неприятностей',
        'Рекомендации к действию',
        'Как будут развиваться события'
    ];
    return meanings[position - 1] || `Позиция ${position}`;
}

// Сохранить расклад
async function saveReading() {
    if (!state.cards.length) {
        showNotification('Нет данных для сохранения!');
        return;
    }
    
    showLoader(true);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/save-reading`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: tg.initDataUnsafe.user?.id,
                question: state.question,
                cards: state.cards,
                interpretation: state.interpretation
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Расклад сохранен в истории!');
            loadHistory(); // Обновляем историю
        } else {
            showNotification('Ошибка при сохранении.');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Ошибка соединения.');
    } finally {
        showLoader(false);
    }
}

// Загрузить историю
async function loadHistory() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/history?user_id=${tg.initDataUnsafe.user?.id}`);
        const data = await response.json();
        
        if (data.success) {
            state.history = data.history;
            renderHistory();
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Отобразить историю
function renderHistory() {
    if (!state.history.length) {
        elements.historyList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #a9a9a9;">
                <i class="fas fa-history" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>История гаданий пуста</p>
                <p style="font-size: 14px; margin-top: 10px;">Начните гадание, чтобы сохранить результаты</p>
            </div>
        `;
        return;
    }
    
    elements.historyList.innerHTML = state.history.map((item, index) => `
        <div class="history-item" onclick="viewHistoryReading(${index})">
            <div class="history-date">
                <i class="far fa-calendar"></i> ${new Date(item.date).toLocaleDateString('ru-RU')}
                <i class="far fa-clock" style="margin-left: 15px;"></i> ${new Date(item.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div class="history-question">
                ${item.question.length > 100 ? item.question.substring(0, 100) + '...' : item.question}
            </div>
            <div class="history-cards">
                ${item.cards.map(card => `
                    <span class="history-card">${card.name}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Просмотр сохраненного расклада
function viewHistoryReading(index) {
    const reading = state.history[index];
    state.question = reading.question;
    state.cards = reading.cards;
    state.interpretation = reading.interpretation;
    
    elements.currentQuestion.textContent = `Вопрос: "${reading.question}"`;
    renderCards();
    showScreen('cards');
}

// Показать экран
function showScreen(screenName) {
    // Скрыть все экраны
    elements.screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать нужный экран
    document.getElementById(`${screenName}-screen`).classList.add('active');
    
    // Обновить активную кнопку навигации
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screenName);
    });
}

// Показать лоадер
function showLoader(show) {
    elements.loader.classList.toggle('active', show);
}

// Показать уведомление
function showNotification(message) {
    tg.showPopup({
        title: '🔮 Таро',
        message: message,
        buttons: [{ type: 'ok' }]
    });
}

// Глобальная функция для просмотра истории
window.viewHistoryReading = viewHistoryReading;

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);