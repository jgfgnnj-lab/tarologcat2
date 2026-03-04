// crypto-utils.js
const CryptoUtils = {
    async signData(data) {
        // Получаем токен из переменной окружения Vercel
        const secret = import.meta.env.BOT_TOKEN || '';
        
        if (!secret) {
            console.error('BOT_TOKEN not found in env');
            return '';
        }
        
        const encoder = new TextEncoder();
        
        // Импортируем ключ
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        // Создаем строку для подписи
        const signString = `${data.user_id}:${data.game}:${data.score}:${data.completed}`;
        console.log('Sign string:', signString);
        
        // Подписываем
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signString)
        );
        
        // Конвертируем в hex
        const hash = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        console.log('Generated hash:', hash);
        return hash;
    },

    async sendResult(userId, gameName, score, completed) {
        try {
            console.log('Sending result:', {userId, gameName, score, completed});
            
            const gameData = {
                user_id: userId,
                game: gameName,
                score: score,
                completed: completed
            };
            
            // Создаем подпись
            gameData.hash = await this.signData(gameData);
            
            if (!gameData.hash) {
                console.error('Failed to generate hash');
                return;
            }
            
            // Отправляем на сервер
            const response = await fetch('http://5.42.106.152:8000/api/game_result', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(gameData)
            });
            
            const result = await response.json();
            console.log('Server response:', result);
            
            if (result.paws_added > 0) {
                this.showNotification(result.message);
            }
            
            return result;
        } catch (e) {
            console.error('Error in sendResult:', e);
        }
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;
        notif.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>🐾</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
};

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

window.CryptoUtils = CryptoUtils;
console.log('CryptoUtils loaded');
