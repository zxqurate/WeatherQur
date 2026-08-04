#!/bin/bash
# Скрипт для проверки активации API ключа OpenWeatherMap

API_KEY="ae1606cb487fe23cb6ee96d355edf4e1"
URL="https://api.openweathermap.org/data/2.5/weather?q=London&appid=${API_KEY}&units=metric"

echo "🔍 Проверка активации API ключа OpenWeatherMap..."
echo "⏰ Время начала: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

while true; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Ключ активирован! ($(date '+%H:%M:%S'))"
        echo "📊 Тестовый ответ:"
        echo "$BODY" | head -n 3
        echo ""
        echo "🎉 Можете обновить страницу http://localhost:8000 и тестировать!"
        exit 0
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "⏳ $(date '+%H:%M:%S') - Ключ еще не активирован, ожидаем..."
    else
        echo "⚠️  $(date '+%H:%M:%S') - Неожиданный код ответа: $HTTP_CODE"
    fi

    sleep 60  # Проверка каждую минуту
done
