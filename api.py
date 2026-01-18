from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json
import random
from datetime import datetime
import sqlite3
import os

app = FastAPI(title="Tarot Web App API")

# Разрешаем CORS для всех источников (в разработке)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class DrawRequest(BaseModel):
    question: str
    count: int = 5
    user_id: Optional[int] = None

class SaveRequest(BaseModel):
    user_id: int
    question: str
    cards: List[dict]
    interpretation: str = ""

# Инициализация базы данных
def init_db():
    # Vercel требует абсолютный путь
    db_path = "/tmp/tarot_history.db" if os.environ.get("VERCEL") else "tarot_history.db"
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            question TEXT,
            cards TEXT,
            interpretation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    return db_path

# Инициализируем БД при старте
DB_PATH = init_db()

# Загрузка карт Таро из вашего file_ids.json
def load_tarot_cards():
    try:
        # Пытаемся загрузить из разных мест
        possible_paths = [
            "utils/file_ids.json",
            "/tmp/file_ids.json",
            "file_ids.json"
        ]
        
        for path in possible_paths:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    file_ids = json.load(f)
                    print(f"✅ Загружено {len(file_ids)} карт из {path}")
                    
                    # Создаем полный список карт с их значениями
                    tarot_cards = []
                    for i, (name, file_id) in enumerate(file_ids.items()):
                        tarot_cards.append({
                            "id": i,
                            "name": name,
                            "file_id": file_id,
                            "meanings": {
                                "upright": get_card_meaning_by_name(name, "upright"),
                                "reversed": get_card_meaning_by_name(name, "reversed")
                            }
                        })
                    return tarot_cards
            except FileNotFoundError:
                continue
        
        # Если файл не найден, создаем демо-карты
        print("⚠️ file_ids.json не найден, создаем демо-карты")
        return create_demo_cards()
        
    except Exception as e:
        print(f"❌ Ошибка загрузки карт: {e}")
        return create_demo_cards()

def create_demo_cards():
    """Создание демо-карт если файл не найден"""
    demo_cards = []
    card_names = [
        "Шут", "Маг", "Верховная Жрица", "Императрица", "Император",
        "Иерофант", "Влюбленные", "Колесница", "Сила", "Отшельник"
    ]
    
    for i, name in enumerate(card_names):
        demo_cards.append({
            "id": i,
            "name": name,
            "file_id": f"demo_{i}",
            "meanings": {
                "upright": f"Прямое значение {name}",
                "reversed": f"Перевернутое значение {name}"
            }
        })
    
    return demo_cards

def get_card_meaning_by_name(card_name, orientation):
    """Получить значение карты по имени"""
    # Здесь можно добавить вашу логику из utils.py
    meanings = {
        "upright": [
            "Новые начинания", "Успех в делах", "Гармония", "Творческий подъем",
            "Финансовая удача", "Любовные отношения", "Духовный рост", "Карьерный рост"
        ],
        "reversed": [
            "Препятствия", "Задержки", "Конфликты", "Сомнения",
            "Финансовые трудности", "Эмоциональные переживания", "Застой", "Неопределенность"
        ]
    }
    
    # Более точные значения для некоторых карт
    specific_meanings = {
        "Шут": {
            "upright": "Начало нового пути, спонтанность, приключения",
            "reversed": "Безрассудство, риск, незрелость"
        },
        "Маг": {
            "upright": "Сила воли, мастерство, концентрация, новые возможности",
            "reversed": "Обман, манипуляции, слабость, нерешительность"
        },
        "Влюбленные": {
            "upright": "Любовь, гармония, партнерство, важный выбор",
            "reversed": "Разлад, конфликты, неверный выбор, дисбаланс"
        }
    }
    
    if card_name in specific_meanings:
        return specific_meanings[card_name][orientation]
    
    return random.choice(meanings[orientation])

# Загружаем карты при старте
TAROT_CARDS = load_tarot_cards()
print(f"🃏 Готово к работе: {len(TAROT_CARDS)} карт Таро")

# API Endpoints
@app.get("/")
async def root():
    return {"status": "Tarot Web App API is running", "cards_count": len(TAROT_CARDS)}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "tarot-web-app",
        "cards_available": len(TAROT_CARDS),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/draw-cards")
async def draw_cards(request: DrawRequest):
    """Выбрать случайные карты для гадания"""
    try:
        if not request.question or len(request.question.strip()) < 3:
            raise HTTPException(status_code=400, detail="Question must be at least 3 characters")
        
        count = min(request.count, 10)  # Ограничиваем максимум 10 карт
        if count > len(TAROT_CARDS):
            count = len(TAROT_CARDS)
        
        # Выбираем случайные карты
        selected_cards = random.sample(TAROT_CARDS, count)
        
        # Формируем ответ с ориентацией
        result_cards = []
        for card in selected_cards:
            orientation = random.choice(["upright", "reversed"])
            result_cards.append({
                "id": card["id"],
                "name": card["name"],
                "file_id": card["file_id"],
                "orientation": orientation,
                "meaning": card["meanings"][orientation],
                "position": len(result_cards) + 1
            })
        
        # Генерируем уникальный ID расклада
        reading_id = f"reading_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
        
        return {
            "success": True,
            "reading_id": reading_id,
            "cards": result_cards,
            "question": request.question,
            "cards_count": len(result_cards),
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error in draw_cards: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/interpret")
async def interpret_reading(request: dict):
    """Генерация интерпретации расклада"""
    try:
        cards = request.get("cards", [])
        question = request.get("question", "")
        
        if not cards:
            raise HTTPException(status_code=400, detail="No cards provided")
        
        # Генерируем интерпретацию на основе карт
        interpretation = generate_interpretation(cards, question)
        
        return {
            "success": True,
            "interpretation": interpretation,
            "cards_count": len(cards),
            "question": question
        }
        
    except Exception as e:
        print(f"❌ Error in interpret: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save-reading")
async def save_reading(request: SaveRequest):
    """Сохранение расклада в историю"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO readings (user_id, question, cards, interpretation)
            VALUES (?, ?, ?, ?)
        ''', (
            request.user_id,
            request.question,
            json.dumps(request.cards, ensure_ascii=False),
            request.interpretation
        ))
        
        conn.commit()
        reading_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True, 
            "message": "Reading saved successfully",
            "reading_id": reading_id,
            "saved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error saving reading: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(user_id: int):
    """Получение истории гаданий пользователя"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, question, cards, interpretation, created_at
            FROM readings 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            try:
                cards_data = json.loads(row["cards"])
            except:
                cards_data = []
            
            history.append({
                "id": row["id"],
                "question": row["question"],
                "cards": cards_data,
                "interpretation": row["interpretation"],
                "date": row["created_at"]
            })
        
        return {
            "success": True, 
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        print(f"❌ Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cards")
async def get_all_cards():
    """Получить список всех карт (для отладки)"""
    simplified_cards = [
        {"id": card["id"], "name": card["name"]}
        for card in TAROT_CARDS[:20]  # Первые 20 для примера
    ]
    
    return {
        "success": True,
        "total_cards": len(TAROT_CARDS),
        "cards": simplified_cards
    }

# Вспомогательные функции
def generate_interpretation(cards, question):
    """Генерация подробной интерпретации"""
    
    # Подсчитываем статистику
    upright_count = sum(1 for card in cards if card.get("orientation") == "upright")
    total_cards = len(cards)
    
    # Анализ по позициям
    position_meanings = [
        "События которые произойдут",
        "Возможные преграды", 
        "Источник неприятностей",
        "Рекомендации к действию",
        "Как будут развиваться события"
    ]
    
    interpretation = f"🔮 *Интерпретация расклада:*\n\n"
    interpretation += f"📝 *Ваш вопрос:* {question}\n\n"
    
    # Анализ каждой карты
    for i, card in enumerate(cards):
        position = position_meanings[i] if i < len(position_meanings) else f"Позиция {i+1}"
        orientation_icon = "🔼" if card.get("orientation") == "upright" else "🔽"
        
        interpretation += f"**{position}:**\n"
        interpretation += f"• *Карта:* {card['name']} {orientation_icon}\n"
        interpretation += f"• *Значение:* {card.get('meaning', 'Нет описания')}\n\n"
    
    # Общий анализ
    interpretation += "📊 *Общий анализ расклада:*\n"
    
    if upright_count == total_cards:
        interpretation += "• Все карты прямые - очень благоприятный знак!\n"
        interpretation += "• Ситуация развивается гармонично\n"
        interpretation += "• Смело действуйте в выбранном направлении\n"
    elif upright_count >= total_cards / 2:
        interpretation += "• Большинство карт прямые - позитивная динамика\n"
        interpretation += "• Есть небольшие препятствия, но они преодолимы\n"
        interpretation += "• Продолжайте движение вперед\n"
    else:
        interpretation += "• Много перевернутых карт - время для размышлений\n"
        interpretation += "• Возможны внутренние или внешние сложности\n"
        interpretation += "• Пересмотрите свой подход к ситуации\n"
    
    # Персональный совет
    interpretation += f"\n💫 *Персональный совет:*\n"
    
    advice_options = [
        "Доверьтесь своей интуиции в принятии решений",
        "Проявите терпение, важные результаты приходят со временем",
        "Будьте открыты к новым возможностям",
        "Сфокусируйтесь на главном, остальное приложится",
        "Коммуникация поможет решить многие вопросы",
        "Не бойтесь просить помощи у близких"
    ]
    
    interpretation += f"{random.choice(advice_options)}\n\n"
    interpretation += f"✨ *Пусть звёзды благоволят вам!* ✨"
    
    return interpretation

# Для локального запуска
if __name__ == "__main__":
    import uvicorn
    print("🚀 Запуск сервера Tarot Web App...")
    print(f"🃏 Доступно карт: {len(TAROT_CARDS)}")
    print("📡 Сервер запущен: http://localhost:8000")
    print("🔮 API доступен по: http://localhost:8000/api/draw-cards")
    uvicorn.run(app, host="0.0.0.0", port=8000)