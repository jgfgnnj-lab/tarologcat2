// crypto-utils.js
const CryptoUtils = {
    apiUrl: import.meta.env.VITE_API_URL || 'https://tarocatapi.ru/api/game_result',
    signApiUrl: '/api/sign',  // локальный эндпоинт в Vercel

    // Получение подписи с сервера
    getSignature: async function(userId, gameName, score, completed) {
        try {
            const response = await fetch(this.signApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    game: gameName,
                    score: score,
                    completed: completed
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get signature');
            }

            const data = await response.json();
            return data.hash;
            
        } catch (error) {
            console.error('❌ Error getting signature:', error);
            throw error;
        }
    },

    // Отправка результата
    sendResult: async function(userId, gameName, score, completed) {
        console.log('📤 sendResult:', {userId, gameName, score, completed});
        
        try {
            // 1. Получаем подпись с сервера
            const hash = await this.getSignature(userId, gameName, score, completed);
            
            // 2. Отправляем результат
            const gameData = {
                user_id: userId,
                game: gameName,
                score: score,
                completed: completed,
                hash: hash
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });

            const result = await response.json();
            console.log('✅ Ответ сервера:', result);
            
            this.showNotification(result.message, result.paws_added > 0 ? 'success' : 'info');
            return result;

        } catch (error) {
            console.error('❌ Ошибка:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
            throw error;
        }
    },

    // Показать уведомление (без изменений)
    showNotification: function(message, type) {
        type = type || 'info';
        var colors = {
            success: '#4CAF50',
            info: '#2196F3',
            error: '#f44336',
            warning: '#ff9800'
        };
        
        var notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(function() {
            notif.remove();
        }, 3000);
    }
};

window.CryptoUtils = CryptoUtils;
console.log('✅ CryptoUtils загружен (с серверной подписью)');

// Делаем доступным глобально
window.CryptoUtils = CryptoUtils;
console.log('✅ CryptoUtils загружен');
