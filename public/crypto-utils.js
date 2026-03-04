// crypto-utils.js
const CryptoUtils = {
    async sendResult(userId, gameName, score, completed) {
        try {
            console.log('Sending result:', {userId, gameName, score, completed});
            
            const gameData = {
                user_id: userId,
                game: gameName,
                score: score,
                completed: completed,
                hash: 'test' // Простая заглушка
            };
            
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
        } catch (e) {
            console.error('Error:', e);
        }
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: #4CAF50; color: white; padding: 15px;
            border-radius: 10px; z-index: 9999;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};

window.CryptoUtils = CryptoUtils;
