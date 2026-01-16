// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// База данных карт Таро
const tarotCards = [
    { id: 0, name: "Шут", meaning: "Начало, невинность, спонтанность", reversed: "Безрассудство, риск" },
    { id: 1, name: "Маг", meaning: "Воля, мастерство, концентрация", reversed: "Манипуляции, слабость" },
    { id: 2, name: "Верховная Жрица", meaning: "Интуиция, тайны, подсознание", reversed: "Скрытые мотивы, игнорирование интуиции" },
    { id: 3, name: "Императрица", meaning: "Изобилие, природа, плодородие", reversed: "Зависимость, бездействие" },
    { id: 4, name: "Император", meaning: "Власть, структура, контроль", reversed: "Тирания, жесткость" },
    // ... добавьте больше карт
];

let currentSpread = 1;
let drawnCards = [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadCardLibrary();
    updateUserInfo();
});

// Выбор расклада
function selectSpread(spread) {
    currentSpread = spread;
    document.querySelectorAll('.spread-option').forEach(opt => {
        opt.style.borderColor = 'transparent';
    });
    event.currentTarget.style.borderColor = '#ff6b6b';
}

// Вытягивание карт
function drawCards() {
    const question = document.getElementById('questionInput').value;
    if (!question.trim() && currentSpread > 1) {
        alert('Пожалуйста, сформулируйте вопрос');
        return;
    }

    drawnCards = [];
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    // Выбор случайных карт
    for (let i = 0; i < (currentSpread === 'celtic' ? 10 : currentSpread); i++) {
        const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
        const isReversed = Math.random() > 0.5;
        drawnCards.push({ ...randomCard, reversed: isReversed });
        
        const cardElement = document.createElement('div');
        cardElement.className = `card ${isReversed ? 'reversed' : ''}`;
        cardElement.innerHTML = `
            <div class="card-name">${randomCard.name}</div>
            <div class="card-position">${isReversed ? 'Перевернута' : 'Прямая'}</div>
        `;
        cardElement.onclick = () => showCardDetails(randomCard, isReversed);
        container.appendChild(cardElement);
    }

    showInterpretation();
}

// Показать интерпретацию
function showInterpretation() {
    const interpretationDiv = document.getElementById('interpretation');
    let interpretation = '<h3>📜 Интерпретация:</h3>';
    
    drawnCards.forEach((card, index) => {
        interpretation += `
            <div class="card-interpretation">
                <strong>${index + 1}. ${card.name} (${card.reversed ? 'Перевернутая' : 'Прямая'})</strong><br>
                ${card.reversed ? card.reversedMeaning : card.meaning}
            </div>
        `;
    });

    // Общая интерпретация
    interpretation += '<div class="overall-reading"><strong>✨ Общий совет:</strong> ';
    
    if (currentSpread === 1) {
        interpretation += 'Сфокусируйтесь на одном аспекте вашей жизни.';
    } else if (currentSpread === 3) {
        interpretation += 'Прошлое влияет на настоящее, настоящее формирует будущее.';
    } else if (currentSpread === 'celtic') {
        interpretation += 'Этот расклад показывает полную картину ситуации.';
    }
    
    interpretation += '</div>';
    interpretationDiv.innerHTML = interpretation;
}

// Показать детали карты
function showCardDetails(card, isReversed) {
    const meaning = isReversed ? card.reversedMeaning : card.meaning;
    tg.showPopup({
        title: `${card.name} ${isReversed ? '(Перевернутая)' : '(Прямая)'}`,
        message: meaning,
        buttons: [{ type: 'close' }]
    });
}

// Сбросить карты
function resetCards() {
    drawnCards = [];
    document.getElementById('cardsContainer').innerHTML = '';
    document.getElementById('interpretation').innerHTML = '';
    document.getElementById('questionInput').value = '';
}

// Сохранить гадание
function saveReading() {
    if (drawnCards.length === 0) {
        alert('Сначала вытяните карты');
        return;
    }

    const readingData = {
        spread: currentSpread,
        cards: drawnCards,
        question: document.getElementById('questionInput').value,
        timestamp: new Date().toISOString()
    };

    // Отправка данных в бота
    tg.sendData(JSON.stringify(readingData));
    
    tg.showAlert('Гадание сохранено в вашей истории!');
}

// Загрузить библиотеку карт
function loadCardLibrary() {
    const cardList = document.getElementById('cardList');
    tarotCards.forEach(card => {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.innerHTML = `
            <strong>${card.name}</strong><br>
            <small>${card.meaning.substring(0, 50)}...</small>
        `;
        cardItem.onclick = () => showCardDetails(card, false);
        cardList.appendChild(cardItem);
    });
}

// Обновить информацию о пользователе
function updateUserInfo() {
    const user = tg.initDataUnsafe.user;
    if (user) {
        console.log('Пользователь:', user);
        // Можно отобразить информацию о пользователе
    }
}

// Отправка данных в Telegram
function sendToTelegram(data) {
    tg.sendData(JSON.stringify(data));
}

// Обработка кнопки "Назад" в Telegram
tg.BackButton.onClick(() => {
    tg.close();
});