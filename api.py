# api.py - FastAPI бэкенд
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import random
from datetime import datetime
import sqlite3

app = FastAPI()

# CORS
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

# Загрузка карт Таро из вашего файла
with open('file_ids.json', 'r', encoding='utf-8') as f:
    FILE_IDS = json.load(f)

# Список всех карт (78 штук)
TAROT_CARDS = [
    {"id": i, "name": name, "file_id": file_id}
    for i, (name, file_id) in enumerate(FILE_IDS.items())
]

# База данных для хранения истории
def init_db():
    conn = sqlite3.connect('tarot_history.db')
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

init_db()

@app.post("/api/draw-cards")
async def draw_cards(request: DrawRequest):
    """Выбрать случайные карты"""
    try:
        # Выбираем случайные карты
        selected_cards = random.sample(TAROT_CARDS, min(request.count, len(TAROT_CARDS)))
        
        # Добавляем ориентацию
        result_cards = []
        for card in selected_cards:
            orientation = random.choice(["upright", "reversed"])
            result_cards.append({
                "name": card["name"],
                "file_id": card["file_id"],
                "orientation": orientation,
                "meaning": get_card_meaning(card["name"], orientation)
            })
        
        # Генерируем ID расклада
        reading_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
        
        return {
            "success": True,
            "reading_id": reading_id,
            "cards": result_cards,
            "question": request.question
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interpret")
async def interpret_reading(request: dict):
    """Получить интерпретацию расклада"""
    try:
        # Здесь можно подключить вашу логику из utils.py
        # Пока вернем базовую интерпретацию
        
        reading_id = request.get("reading_id")
        user_id = request.get("user_id")
        
        if not reading_id:
            raise HTTPException(status_code=400, detail="No reading_id provided")
        
        interpretation = generate_interpretation(reading_id)
        
        return {
            "success": True,
            "interpretation": interpretation,
            "reading_id": reading_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save-reading")
async def save_reading(request: SaveRequest):
    """Сохранить расклад в историю"""
    try:
        conn = sqlite3.connect('tarot_history.db')
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
        conn.close()
        
        return {"success": True, "message": "Reading saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(user_id: int):
    """Получить историю гаданий"""
    try:
        conn = sqlite3.connect('tarot_history.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM readings 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "id": row["id"],
                "question": row["question"],
                "cards": json.loads(row["cards"]),
                "interpretation": row["interpretation"],
                "date": row["created_at"]
            })
        
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_card_meaning(card_name: str, orientation: str) -> str:
    """Получить значение карты (упрощенная версия)"""
    # Здесь можно использовать вашу логику из utils.py
    # Пока возвращаем базовые значения
    
    meanings = {
        "upright": [
            "Положительное развитие ситуации",
            "Новые возможности",
            "Гармония и баланс",
            "Успех в начинаниях",
            "Духовный рост"
        ],
        "reversed": [
            "Препятствия на пути",
            "Необходимость переосмысления",
            "Внутренние сомнения",
            "Временные трудности",
            "Урок, который нужно усвоить"
        ]
    }
    
    return random.choice(meanings[orientation])

def generate_interpretation(reading_id: str) -> str:
    """Сгенерировать интерпретацию (можно заменить на вызов вашего AI)"""
    interpretations = [
        "Карты указывают на важные перемены в вашей жизни. Будьте готовы к новым возможностям.",
        "Расклад показывает необходимость внутренней работы. Уделите время самоанализу.",
        "Ситуация развивается благоприятно. Доверяйте своей интуиции и двигайтесь вперед.",
        "Карты советуют проявить терпение. Самые лучшие результаты приходят со временем.",
        "Этот расклад говорит о необходимости баланса. Найдите гармонию между разными сферами жизни."
    ]
    
    return random.choice(interpretations)

@app.get("/")
async def root():
    return {"status": "Tarot Web App API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)