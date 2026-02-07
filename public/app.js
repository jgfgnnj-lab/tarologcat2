// ========== ФУНКЦИИ ДЛЯ ГЛАВНОГО МЕНЮ ==========
// Защита от повторного выполнения
if (window.appJsLoaded) {
    console.warn('app.js уже загружен, пропускаем повторную инициализацию');
    // Если функции уже определены, просто выходим
    if (window.showLandingPage && window.showTarotMode && window.showMemoryGameMode && window.showMazeMode) {
        throw new Error('app.js already loaded');
    }
}
window.appJsLoaded = true;

console.log('app.js загружается...');
// Глобальные переменные для управления режимами
let currentMode = 'landing'; // 'landing', 'tarot', 'memory'
let landingPage, tarotInterface, memoryGame, backButton;

// ========== КОНЕЦ ФУНКЦИЙ ДЛЯ МЕНЮ ==========

// Теперь обработчик DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Находим элементы на странице для меню
    landingPage = document.getElementById('landing-page');
    tarotInterface = document.getElementById('tarot-interface');
    memoryGame = document.getElementById('memory-game');
    backButton = document.getElementById('back-button');
    
    console.log('Элементы меню найдены:', {
        landingPage: !!landingPage,
        tarotInterface: !!tarotInterface,
        memoryGame: !!memoryGame,
        backButton: !!backButton
    });
    
    // Показываем главное меню
    showLandingPage();

    // Конфигурация
    const CONFIG = {
        API_URL: window.location.origin + '/api',
        CARDS_COUNT: 5,
        MAX_QUESTION_LENGTH: 500
    };

    // Инициализация Telegram Web App
    let tg = null;
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            tg.expand();
        } else {
            // Режим разработки/браузера
            console.log('Режим разработки - Telegram WebApp не найден');
            tg = {
                initDataUnsafe: {
                    user: { id: 123456789, first_name: "Тест", last_name: "Пользователь" }
                },
                showPopup: function(params) { alert(params.message); }
            };
        }
    } catch (error) {
        console.log('Ошибка инициализации Telegram:', error);
        tg = {
            initDataUnsafe: { user: { id: 0 } },
            showPopup: function(params) { alert(params.message); }
        };
    }

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
        console.log('Инициализация приложения');
        loadHistory();
        setupEventListeners();
        
        // Показываем главный экран гадания
        showScreen('question');
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        console.log('Настройка обработчиков событий');
        
        // Счетчик символов
        if (elements.questionInput) {
            elements.questionInput.addEventListener('input', updateCharCounter);
        }
        
        // Кнопка начала гадания
        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', startReading);
        }
        
        // Кнопки навигации
        if (elements.navBtns && elements.navBtns.length > 0) {
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
        }
        
        // Кнопки экрана карт
        if (elements.interpretBtn) {
            elements.interpretBtn.addEventListener('click', getInterpretation);
        }
        
        if (elements.saveBtn) {
            elements.saveBtn.addEventListener('click', saveReading);
        }
        
        if (elements.newReadingBtn) {
            elements.newReadingBtn.addEventListener('click', () => {
                state.cards = [];
                showScreen('question');
            });
        }
        
        // Кнопки назад
        if (elements.backToCards) {
            elements.backToCards.addEventListener('click', () => showScreen('cards'));
        }
        
        if (elements.backToMain) {
            elements.backToMain.addEventListener('click', () => showScreen('question'));
        }
        
        // Модальное окно
        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', () => {
                elements.cardModal.classList.remove('active');
            });
        }
        
        // Клик вне модального окна
        if (elements.cardModal) {
            elements.cardModal.addEventListener('click', (e) => {
                if (e.target === elements.cardModal) {
                    elements.cardModal.classList.remove('active');
                }
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                elements.cardModal.classList.remove('active');
            }
        });
    }

    // Обновление счетчика символов
    function updateCharCounter() {
        if (!elements.questionInput || !elements.charCount) return;
        
        const length = elements.questionInput.value.length;
        const remaining = CONFIG.MAX_QUESTION_LENGTH - length;
        elements.charCount.textContent = remaining;
        elements.charCount.style.color = remaining < 50 ? '#f72585' : '#a9a9a9';
    }

    // Начать гадание
    async function startReading() {
        if (!elements.questionInput) return;
        
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
            const response = await fetch(`${window.location.origin}/api/draw-cards`, {
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
                if (elements.currentQuestion) {
                    elements.currentQuestion.textContent = `Вопрос: "${state.question}"`;
                }
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

    // В функции renderCards():
    async function renderCards() {
        if (!elements.cardsContainer) return;
        
        elements.cardsContainer.innerHTML = '<div class="loading-cards">Загрузка карт...</div>';
        
        // Создаем элементы карт
        const cardsHTML = await Promise.all(state.cards.map(async (card, index) => {
            // Пытаемся получить изображение
            let imageHTML = '';
            
            if (card.image_url) {
                // Если есть прямой URL
                imageHTML = `
                    <div class="card-image" 
                         style="background-image: url('${card.image_url}');"
                         data-card="${card.name}">
                    </div>
                `;
            } else if (card.file_id) {
                // Если есть file_id, пробуем получить через API
                try {
                    const response = await fetch(`${CONFIG.API_URL}/get-photo?file_id=${card.file_id}`);
                    const data = await response.json();
                    
                    if (data.success && data.url) {
                        imageHTML = `
                            <div class="card-image" 
                                 style="background-image: url('${data.url}');"
                                 data-card="${card.name}">
                            </div>
                        `;
                    } else {
                        // Заглушка если не удалось получить
                        imageHTML = `
                            <div class="card-image no-image" data-card="${card.name}">
                                <div class="card-emoji">${getCardEmoji(card.name)}</div>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.error('Error loading image:', e);
                    imageHTML = `
                        <div class="card-image no-image" data-card="${card.name}">
                            <div class="card-emoji">${getCardEmoji(card.name)}</div>
                        </div>
                    `;
                }
            } else {
                // Нет данных об изображении
                imageHTML = `
                    <div class="card-image no-image" data-card="${card.name}">
                        <div class="card-emoji">${getCardEmoji(card.name)}</div>
                    </div>
                `;
            }
            
            return `
                <div class="card-item" data-index="${index}">
                    ${imageHTML}
                    <div class="card-info">
                        <div class="card-name">${card.name}</div>
                        <div class="card-position">
                            ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}
                        </div>
                    </div>
                </div>
            `;
        }));
        
        elements.cardsContainer.innerHTML = cardsHTML.join('');
        
        // Добавляем обработчики кликов
        document.querySelectorAll('.card-item').forEach((cardEl, index) => {
            cardEl.addEventListener('click', () => {
                showCardDetails(state.cards[index]);
            });
        });
    }

    // Функция для эмодзи-заглушек
    function getCardEmoji(cardName) {
        const emojiMap = {
            "Шут": "🎭", "Маг": "🧙", "Верховная Жрица": "👸",
            "Императрица": "👑", "Император": "🤴", "Иерофант": "🙏",
            "Влюбленные": "💑", "Колесница": "🛡️", "Сила": "💪",
            "Отшельник": "🧓", "Колесо Фортуны": "🎡", "Справедливость": "⚖️",
            "Повешенный": "🙃", "Смерть": "💀", "Умеренность": "⚗️",
            "Дьявол": "😈", "Башня": "🏰", "Звезда": "⭐",
            "Луна": "🌙", "Солнце": "☀️", "Суд": "📯", "Мир": "🌎"
        };
        
        // Ищем частичное совпадение
        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (cardName.includes(key)) return emoji;
        }
        
        return "🃏";
    }
    
    // Показать детали карты
    function showCardDetails(card) {
        if (!elements.modalBody || !elements.cardModal) return;
        
        const position = getPositionMeaning(state.cards.indexOf(card) + 1);
        
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
        if (!state.cards.length) {
            showNotification('Сначала начните гадание!');
            return;
        }
        
        showLoader(true);
        
        try {
            console.log('Запрос интерпретации для карт:', state.cards.length);
            
            const response = await fetch(CONFIG.API_URL + '/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cards: state.cards,
                    question: state.question,
                    reading_id: state.currentReadingId || 'temp_' + Date.now()
                })
            });
            
            console.log('Статус ответа интерпретации:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Получена интерпретация:', data);
            
            if (data.success) {
                state.interpretation = data.interpretation;
                renderInterpretation();
                showScreen('interpretation');
            } else {
                showNotification('Ошибка при получении интерпретации: ' + (data.detail || 'Неизвестная ошибка'));
            }
            
        } catch (error) {
            console.error('Ошибка получения интерпретации:', error);
            showNotification('Ошибка получения интерпретации. Показываю базовую версию...');
            // Fallback: генерируем базовую интерпретацию локально
            generateBasicInterpretation();
        } finally {
            showLoader(false);
        }
    }

    // Функция для генерации базовой интерпретации если API не работает
    function generateBasicInterpretation() {
        const cards = state.cards;
        const question = state.question;
        
        let interpretation = `🔮 *Интерпретация расклада:*\n\n`;
        interpretation += `📝 *Ваш вопрос:* ${question}\n\n`;
        
        const positions = [
            "События которые произойдут",
            "Возможные преграды", 
            "Источник неприятностей",
            "Рекомендации к действию",
            "Как будут развиваться события"
        ];
        
        cards.forEach((card, index) => {
            const position = positions[index] || `Позиция ${index + 1}`;
            const orientationIcon = card.orientation === 'upright' ? '🔼' : '🔽';
            
            interpretation += `**${position}:**\n`;
            interpretation += `• *Карта:* ${card.name} ${orientationIcon}\n`;
            interpretation += `• *Значение:* ${card.meaning || 'Нет описания'}\n\n`;
        });
        
        // Анализ
        const uprightCount = cards.filter(card => card.orientation === 'upright').length;
        const totalCards = cards.length;
        
        interpretation += "📊 *Общий анализ:*\n";
        
        if (uprightCount === totalCards) {
            interpretation += "Все карты прямые - очень благоприятный знак!\n";
        } else if (uprightCount >= totalCards / 2) {
            interpretation += "Большинство карт прямые - позитивная динамика.\n";
        } else {
            interpretation += "Много перевернутых карт - время для размышлений.\n";
        }
        
        interpretation += "\n💫 *Совет:* Доверьтесь своей интуиции.\n";
        interpretation += "\n✨ *Пусть звёзды благоволят вам!* ✨";
        
        state.interpretation = interpretation;
        renderInterpretation();
        showScreen('interpretation');
    }

    // Отобразить интерпретацию
    function renderInterpretation() {
        if (!elements.interpretationContent) return;
        
        elements.interpretationContent.innerHTML = `
            <div style="margin-bottom: 25px;">
                <h3 style="color: #4cc9f0; margin-bottom: 10px;">📝 Ваш вопрос:</h3>
                <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                    "${state.question}"
                </p>
            </div>
            
            <h3 style="color: #4cc9f0; margin-bottom: 15px;">🔮 Интерпретация карт:</h3>
            
            ${state.cards.map((card, index) => {
                const positions = [
                    "События которые произойдут",
                    "Возможные преграды", 
                    "Источник неприятностей",
                    "Рекомендации к действию",
                    "Как будут развиваться события"
                ];
                const position = positions[index] || `Позиция ${index + 1}`;
                
                return `
                    <div class="card-interpretation">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong style="color: #72efdd;">${index + 1}. ${card.name}</strong>
                            <span style="color: ${card.orientation === 'upright' ? '#4ade80' : '#f72585'}">
                                ${card.orientation === 'upright' ? '🔼 Прямая' : '🔽 Перевернутая'}
                            </span>
                        </div>
                        <div style="margin-bottom: 5px; font-size: 14px; color: #a9a9a9;">
                            <strong>Позиция:</strong> ${position}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Значение:</strong> ${card.meaning || 'Нет описания'}
                        </div>
                    </div>
                `;
            }).join('')}
            
            ${state.interpretation ? `
                <div style="margin-top: 25px; padding: 20px; background: rgba(76, 201, 240, 0.1); border-radius: 15px;">
                    <h4 style="color: #4cc9f0; margin-bottom: 10px;">✨ Полный анализ:</h4>
                    <p style="white-space: pre-line;">${state.interpretation}</p>
                </div>
            ` : ''}
            
            <div style="margin-top: 25px; text-align: center;">
                <button class="btn-success" onclick="saveReading()" style="width: 100%; padding: 15px;">
                    <i class="fas fa-save"></i> Сохранить расклад
                </button>
            </div>
        `;
        
        // Делаем кнопку сохранения рабочей
        setTimeout(() => {
            const saveButton = elements.interpretationContent.querySelector('.btn-success');
            if (saveButton) {
                saveButton.onclick = saveReading;
            }
        }, 100);
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
        if (!elements.historyList) return;
        
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
            <div class="history-item" data-index="${index}">
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
        
        // Добавляем обработчики кликов для элементов истории
        document.querySelectorAll('.history-item').forEach((itemEl, index) => {
            itemEl.addEventListener('click', () => {
                viewHistoryReading(index);
            });
        });
    }

    // Просмотр сохраненного расклада
    function viewHistoryReading(index) {
        const reading = state.history[index];
        state.question = reading.question;
        state.cards = reading.cards;
        state.interpretation = reading.interpretation;
        
        if (elements.currentQuestion) {
            elements.currentQuestion.textContent = `Вопрос: "${reading.question}"`;
        }
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
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Обновить активную кнопку навигации
        elements.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });
    }

    // Показать лоадер
    function showLoader(show) {
        if (elements.loader) {
            elements.loader.classList.toggle('active', show);
        }
    }

    // Показать уведомление
    function showNotification(message) {
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: '🔮 Таро',
                message: message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(message);
        }
    }
    
    // Делаем функции доступными глобально для HTML-обработчиков
    window.saveReading = saveReading;
    window.viewHistoryReading = viewHistoryReading;

    // Запуск приложения
    init();
});
