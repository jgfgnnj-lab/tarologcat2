// api/sign.js
import crypto from 'crypto';

export default async function handler(req, res) {
    // Только POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { user_id, game, score, completed } = req.body;
        
        // Валидация
        if (!user_id || !game || score === undefined || completed === undefined) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        // Создаем строку для подписи
        const signString = `${user_id}:${game}:${score}:${completed}`;
        
        // Получаем токен из переменных окружения Vercel (НЕ НА КЛИЕНТЕ!)
        const BOT_TOKEN = process.env.BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            console.error('BOT_TOKEN not set');
            return res.status(500).json({ error: 'Server config error' });
        }

        // Создаем HMAC-SHA256 подпись
        const hmac = crypto.createHmac('sha256', BOT_TOKEN);
        hmac.update(signString);
        const hash = hmac.digest('hex');

        // Возвращаем подпись
        res.status(200).json({ 
            hash,
            // Можно вернуть и другие данные если нужно
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Sign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
