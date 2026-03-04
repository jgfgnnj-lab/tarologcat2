// crypto-utils.js
const CryptoUtils = {
    async signData(data) {
        // Получаем токен бота из переменной окружения Vercel
        // На Vercel создайте переменную VITE_BOT_TOKEN с вашим токеном
        const secret = import.meta.env.BOT_TOKEN || '';
        
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signString = `${data.user_id}:${data.game}:${data.score}:${data.completed}`;
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signString));
        
        // Конвертируем в hex
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    async sendResult(userId, gameName, score, completed) {
        try {
            const gameData = {
                user_id: userId,
                game: gameName,
                score: score,
                completed: completed
            };
            
            // Создаем подпись
            gameData.hash = await this.signData(gameData);
            
            // Отправляем на ваш сервер
            const response = await fetch('http://5.42.106.152:8000/api/game_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
            
            const result = await response.json();
            
            if (result.paws_added > 0) {
                this.showNotification(result.message);
            }
        } catch (e) {
            console.error('Ошибка:', e);
        }
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #4CAF50;
            color: white; padding: 15px; border-radius: 10px; z-index: 9999;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};

window.CryptoUtils = CryptoUtils;
