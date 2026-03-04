# telegram_notifier.py
from aiogram import Bot
from config import BOT_TOKEN
import asyncio
import logging

logger = logging.getLogger(__name__)

# Создаем отдельного бота для уведомлений
notification_bot = Bot(token=BOT_TOKEN)

async def send_notification(user_id: int, message: str):
    """Отправляет уведомление пользователю"""
    try:
        await notification_bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="Markdown"
        )
        logger.info(f"Уведомление отправлено пользователю {user_id}")
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления: {e}")

def notify_user(user_id: int, message: str):
    """Создает задачу для отправки уведомления"""
    asyncio.create_task(send_notification(user_id, message))