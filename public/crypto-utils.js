// crypto-utils.js
const CryptoUtils = {
    // Получаем токен из глобальной переменной (её задаст Vercel)
    getBotToken() {
        // Пробуем получить из разных мест
        return window.BOT_TOKEN || 
               import.meta.env?.BOT_TOKEN || 
               process.env?.BOT_TOKEN || 
               '';
    },

    async signData(data) {
        const secret = this.getBotToken();
        
        if (!secret) {
            console.error('BOT_TOKEN not found');
            return 'test_hash'; // Для теста возвращаем заглушку
        }
        
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signString = `${data.user_id}:${data.game}:${data.score}:${data.completed}`;
        console.log('Sign string:', signString);
        
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signString)
        );
        
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
            
            gameData.hash = await this.signData(gameData);
            
            const response = await fetch('http://5.42.106.152:8000/api/game_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
            
            const result = await response.json();
            console.log('Server response:', result);
            
            if (result.paws_added > 0) {
                this.showNotification(result.message);
            }
            
            return result;
        } catch (e) {
            console.error('Error:', e);
        }
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white; padding: 15px 25px; border-radius: 10px;
            z-index: 9999; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;
        notif.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
            <span>🐾</span> <span>${message}</span>
        </div>`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);

window.CryptoUtils = CryptoUtils;
console.log('CryptoUtils loaded');
