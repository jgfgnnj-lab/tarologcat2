// crypto-utils.js - ВЕРСИЯ БЕЗ ASYNC ДЛЯ СТАРЫХ БРАУЗЕРОВ
const CryptoUtils = {
    apiUrl: 'https://tarocatapi.ru/api/game_result',
    // Генерация подписи (без async)
    generateHash: function(data) {
        return new Promise(function(resolve, reject) {
            try {
                var signString = data.user_id + ':' + data.game + ':' + data.score + ':' + data.completed;
                console.log('Строка для подписи:', signString);
                
                // Получаем токен из Vercel
                var BOT_TOKEN = process.env.BOT_TOKEN;
                
                if (!BOT_TOKEN) {
                    console.error('❌ BOT_TOKEN не найден');
                    resolve('test_hash_' + Date.now());
                    return;
                }
                
                // Используем Web Crypto API
                var encoder = new TextEncoder();
                var dataBytes = encoder.encode(signString);
                
                crypto.subtle.digest('SHA-256', encoder.encode(BOT_TOKEN))
                    .then(function(tokenHash) {
                        return crypto.subtle.importKey('raw', tokenHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
                    })
                    .then(function(key) {
                        return crypto.subtle.sign('HMAC', key, dataBytes);
                    })
                    .then(function(signature) {
                        var hash = Array.from(new Uint8Array(signature))
                            .map(function(b) { return b.toString(16).padStart(2, '0'); })
                            .join('');
                        console.log('✅ Сгенерированный hash:', hash);
                        resolve(hash);
                    })
                    .catch(function(error) {
                        console.error('❌ Ошибка:', error);
                        resolve('test_hash_' + Date.now());
                    });
                    
            } catch (error) {
                console.error('❌ Ошибка:', error);
                resolve('test_hash_' + Date.now());
            }
        });
    },

    // Отправка результата (без async)
    sendResult: function(userId, gameName, score, completed) {
        var apiUrl = this.apiUrl;
        console.log('📤 sendResult вызван:', {userId, gameName, score, completed});
        
        var self = this;
        var gameData = {
            user_id: userId,
            game: gameName,
            score: score,
            completed: completed
        };
        
        // Генерируем hash
        this.generateHash(gameData)
            .then(function(hash) {
                gameData.hash = hash;
                console.log('Данные для отправки:', gameData);
                
                return fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gameData)
                });
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                console.log('✅ Ответ сервера:', result);
                self.showNotification(result.message, result.paws_added > 0 ? 'success' : 'info');
            })
            .catch(function(error) {
                console.error('❌ Ошибка отправки:', error);
                self.showNotification('Ошибка соединения с сервером', 'error');
            });
    },

    // Показать уведомление
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
    },

    // Тестовая функция
    test: function() {
        console.log('🧪 Тестирование...');
        this.sendResult(5176634459, 'memory', 42, true);
    }
};

// Делаем доступным глобально
window.CryptoUtils = CryptoUtils;
console.log('✅ CryptoUtils загружен');
