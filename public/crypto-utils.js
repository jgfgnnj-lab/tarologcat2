// crypto-utils.js
const CryptoUtils = {
    // Генерация подписи (hash)
    async generateHash(data) {
        try {
            const signString = `${data.user_id}:${data.game}:${data.score}:${data.completed}`;
            console.log('Строка для подписи:', signString);
            
            // Берем токен из переменных окружения Vercel (просто BOT_TOKEN)
            const BOT_TOKEN = process.env.BOT_TOKEN;
            
            if (!BOT_TOKEN) {
                console.error('❌ BOT_TOKEN не найден в Vercel!');
                return "test_hash_" + Date.now();
            }
            
            console.log('✅ Токен получен из Vercel');
            
            // Кодируем
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(signString);
            
            // SHA256 от токена
            const tokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(BOT_TOKEN));
            
            // HMAC ключ
            const key = await crypto.subtle.importKey(
                'raw', 
                tokenHash, 
                { name: 'HMAC', hash: 'SHA-256' }, 
                false, 
                ['sign']
            );
            
            // Создаем подпись
            const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
            
            // В hex
            const hash = Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            console.log('✅ Сгенерированный hash:', hash);
            return hash;
            
        } catch (error) {
            console.error('❌ Ошибка генерации hash:', error);
            return "test_hash_" + Date.now();
        }
    }

    // Отправка результата игры
    async sendResult(userId, gameName, score, completed) {
        try {
            console.log('📤 Отправка результата:', {userId, gameName, score, completed});
            
            // Создаем данные для отправки
            const gameData = {
                user_id: userId,
                game: gameName,
                score: score,
                completed: completed
            };
            
            // Генерируем hash
            const hash = await this.generateHash(gameData);
            
            if (!hash) {
                throw new Error('Не удалось сгенерировать hash');
            }
            
            // Добавляем hash в данные
            gameData.hash = hash;
            
            
            const apiUrl = 'http://5.42.106.152:8000/api/game_result'; 
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Request-ID': `${userId}-${Date.now()}` // Для отслеживания запросов
                },
                body: JSON.stringify(gameData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Ответ сервера:', result);
            
            // Показываем уведомление
            this.showNotification(result.message, result.paws_added > 0 ? 'success' : 'info');
            
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
            return null;
        }
    },

    // Показать уведомление
    showNotification(message, type = 'info') {
        const colors = {
            success: '#4CAF50',
            info: '#2196F3',
            error: '#f44336',
            warning: '#ff9800'
        };
        
        const notif = document.createElement('div');
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
            animation: slideIn 0.3s ease;
        `;
        
        // Добавляем анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        notif.textContent = message;
        document.body.appendChild(notif);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            notif.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    },

    // Вспомогательная функция для тестирования
    async testConnection() {
        try {
            const response = await fetch('http://5.42.106.152:8000/api/health');
            const data = await response.json();
            console.log('✅ Сервер доступен:', data);
            return true;
        } catch (error) {
            console.error('❌ Сервер недоступен:', error);
            return false;
        }
    }
};

// Для использования в браузере
window.CryptoUtils = CryptoUtils;

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}
