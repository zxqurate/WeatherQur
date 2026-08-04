/* ===================================
   КОНФИГУРАЦИЯ API
   =================================== */
const API_CONFIG = {
    key: window.WEATHER_CONFIG?.apiKey || 'YOUR_API_KEY_HERE', // Ключ загружается из config.js
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    iconUrl: 'https://openweathermap.org/img/wn'
};

/* ===================================
   УПРАВЛЕНИЕ СОСТОЯНИЕМ ПРИЛОЖЕНИЯ
   =================================== */
const STATE = {
    currentUnit: 'metric', // 'metric' или 'imperial'
    currentWeatherData: null,
    searchHistory: JSON.parse(localStorage.getItem('weatherHistory')) || []
};

/* ===================================
   ЭЛЕМЕНТЫ DOM
   =================================== */
const DOM = {
    cityInput: document.getElementById('cityInput'),
    searchForm: document.getElementById('searchForm'),
    geolocationBtn: document.getElementById('geolocationBtn'),
    searchHistory: document.getElementById('searchHistory'),
    errorMessage: document.getElementById('errorMessage'),
    skeletonLoader: document.getElementById('skeletonLoader'),
    weatherCard: document.getElementById('weatherCard'),
    weatherEffects: document.getElementById('weatherEffects'),
    forecastSection: document.getElementById('forecastSection'),
    forecastGrid: document.getElementById('forecastGrid'),

    // Элементы карточки погоды
    cityName: document.getElementById('cityName'),
    weatherDate: document.getElementById('weatherDate'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),

    // Переключатель единиц
    unitButtons: document.querySelectorAll('.unit-btn')
};

/* ===================================
   УТИЛИТЫ
   =================================== */

// Debounce функция для оптимизации запросов
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Форматирование даты
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', options);
}

// Форматирование даты для прогноза (краткий формат)
function formatForecastDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('ru-RU', options);
}

// Конвертация температуры
function convertTemperature(tempCelsius, unit) {
    if (unit === 'imperial') {
        return Math.round((tempCelsius * 9/5) + 32);
    }
    return Math.round(tempCelsius);
}

// Получение символа единицы измерения
function getUnitSymbol(unit) {
    return unit === 'metric' ? '°C' : '°F';
}

// Получение единицы измерения скорости ветра
function getWindSpeedUnit(unit) {
    return unit === 'metric' ? 'м/с' : 'mph';
}

// Определение темы на основе погодных условий
function getWeatherTheme(weatherMain) {
    const main = weatherMain.toLowerCase();
    const themeMap = {
        'clear': 'clear',
        'clouds': 'clouds',
        'rain': 'rain',
        'drizzle': 'drizzle',
        'thunderstorm': 'thunderstorm',
        'snow': 'snow',
        'mist': 'mist',
        'fog': 'fog',
        'haze': 'haze',
        'smoke': 'mist',
        'dust': 'mist',
        'sand': 'mist',
        'ash': 'mist',
        'squall': 'rain',
        'tornado': 'thunderstorm'
    };
    return themeMap[main] || 'default';
}

/* ===================================
   API ФУНКЦИИ
   =================================== */

// Получение погоды по названию города
async function fetchWeatherByCity(city) {
    try {
        const url = `${API_CONFIG.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${API_CONFIG.key}&units=metric&lang=ru`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Город не найден. Проверьте правильность написания.');
            } else if (response.status === 401) {
                throw new Error('Ошибка API ключа. Проверьте конфигурацию.');
            } else {
                throw new Error('Не удалось загрузить данные о погоде.');
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

// Получение погоды по координатам
async function fetchWeatherByCoords(lat, lon) {
    try {
        const url = `${API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=metric&lang=ru`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Не удалось загрузить данные о погоде.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

// Получение прогноза на 5 дней
async function fetchForecast(city) {
    try {
        const url = `${API_CONFIG.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${API_CONFIG.key}&units=metric&lang=ru`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Не удалось загрузить прогноз погоды.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки прогноза:', error);
        return null;
    }
}

// Получение прогноза по координатам
async function fetchForecastByCoords(lat, lon) {
    try {
        const url = `${API_CONFIG.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_CONFIG.key}&units=metric&lang=ru`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Не удалось загрузить прогноз погоды.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки прогноза:', error);
        return null;
    }
}

/* ===================================
   ФУНКЦИИ ОТОБРАЖЕНИЯ
   =================================== */

// Показать состояние загрузки
function showLoading() {
    DOM.skeletonLoader.hidden = false;
    DOM.weatherCard.hidden = true;
    DOM.forecastSection.hidden = true;
    hideError();
}

// Скрыть состояние загрузки
function hideLoading() {
    DOM.skeletonLoader.hidden = true;
}

// Показать ошибку
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.classList.add('show');
    setTimeout(() => hideError(), 5000);
}

// Скрыть ошибку
function hideError() {
    DOM.errorMessage.classList.remove('show');
}

// Отображение основной карточки погоды
function renderWeather(data) {
    if (!data) return;

    // Сохраняем данные в состояние
    STATE.currentWeatherData = data;

    // Применяем тему на основе погодных условий
    const theme = getWeatherTheme(data.weather[0].main);
    document.body.className = `theme-${theme}`;

    // Заполняем данные
    DOM.cityName.textContent = `${data.name}, ${data.sys.country}`;
    DOM.weatherDate.textContent = formatDate(data.dt);
    DOM.weatherIcon.src = `${API_CONFIG.iconUrl}/${data.weather[0].icon}@2x.png`;
    DOM.weatherIcon.alt = data.weather[0].description;

    // Температура с учетом выбранной единицы измерения
    const temp = convertTemperature(data.main.temp, STATE.currentUnit);
    const feelsLike = convertTemperature(data.main.feels_like, STATE.currentUnit);
    const unit = getUnitSymbol(STATE.currentUnit);

    DOM.temperature.textContent = `${temp}${unit}`;
    DOM.weatherDescription.textContent = data.weather[0].description;
    DOM.feelsLike.textContent = `${feelsLike}${unit}`;
    DOM.humidity.textContent = `${data.main.humidity}%`;

    // Скорость ветра с учетом единиц измерения
    const windSpeed = STATE.currentUnit === 'imperial'
        ? Math.round(data.wind.speed * 2.237)
        : Math.round(data.wind.speed);
    DOM.windSpeed.textContent = `${windSpeed} ${getWindSpeedUnit(STATE.currentUnit)}`;

    // Показываем карточку
    hideLoading();
    DOM.weatherCard.hidden = false;

    // Добавляем город в историю
    addToHistory(data.name);
}

// Отображение прогноза на 5 дней
function renderForecast(data) {
    if (!data || !data.list) return;

    // Фильтруем данные - берем один прогноз в день (в полдень)
    const dailyForecasts = [];
    const processedDates = new Set();

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toDateString();

        // Берем прогноз на 12:00 или первый доступный для каждого дня
        if (!processedDates.has(dateString) && dailyForecasts.length < 5) {
            const hour = date.getHours();
            if (hour >= 11 && hour <= 15) {
                dailyForecasts.push(item);
                processedDates.add(dateString);
            }
        }
    });

    // Если не нашли прогнозов на полдень, берем первые 5 уникальных дней
    if (dailyForecasts.length === 0) {
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateString = date.toDateString();
            if (!processedDates.has(dateString) && dailyForecasts.length < 5) {
                dailyForecasts.push(item);
                processedDates.add(dateString);
            }
        });
    }

    // Очищаем предыдущий прогноз
    DOM.forecastGrid.innerHTML = '';

    // Генерируем карточки прогноза
    dailyForecasts.forEach(forecast => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';

        const temp = convertTemperature(forecast.main.temp, STATE.currentUnit);
        const unit = getUnitSymbol(STATE.currentUnit);

        forecastCard.innerHTML = `
            <div class="forecast-day">${formatForecastDate(forecast.dt)}</div>
            <img class="forecast-icon"
                 src="${API_CONFIG.iconUrl}/${forecast.weather[0].icon}@2x.png"
                 alt="${forecast.weather[0].description}">
            <div class="forecast-temp">${temp}${unit}</div>
        `;

        DOM.forecastGrid.appendChild(forecastCard);
    });

    // Показываем секцию прогноза
    DOM.forecastSection.hidden = false;
}

// Обновление температур при смене единиц измерения
function updateTemperatureDisplay() {
    if (!STATE.currentWeatherData) return;

    const data = STATE.currentWeatherData;
    const temp = convertTemperature(data.main.temp, STATE.currentUnit);
    const feelsLike = convertTemperature(data.main.feels_like, STATE.currentUnit);
    const unit = getUnitSymbol(STATE.currentUnit);

    DOM.temperature.textContent = `${temp}${unit}`;
    DOM.feelsLike.textContent = `${feelsLike}${unit}`;

    // Обновляем скорость ветра
    const windSpeed = STATE.currentUnit === 'imperial'
        ? Math.round(data.wind.speed * 2.237)
        : Math.round(data.wind.speed);
    DOM.windSpeed.textContent = `${windSpeed} ${getWindSpeedUnit(STATE.currentUnit)}`;

    // Обновляем прогноз если он загружен
    if (!DOM.forecastSection.hidden) {
        const forecastCards = DOM.forecastGrid.querySelectorAll('.forecast-card');
        forecastCards.forEach(card => {
            const tempElement = card.querySelector('.forecast-temp');
            const currentTemp = parseInt(tempElement.textContent);
            let newTemp;

            if (STATE.currentUnit === 'imperial') {
                // Конвертируем из Цельсия в Фаренгейт
                newTemp = Math.round((currentTemp * 9/5) + 32);
            } else {
                // Конвертируем из Фаренгейта в Цельсий
                newTemp = Math.round((currentTemp - 32) * 5/9);
            }

            tempElement.textContent = `${newTemp}${unit}`;
        });
    }
}

/* ===================================
   ИСТОРИЯ ПОИСКА
   =================================== */

// Добавление города в историю
function addToHistory(city) {
    // Удаляем дубликаты (регистронезависимо)
    const filteredHistory = STATE.searchHistory.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    // Добавляем новый город в начало
    STATE.searchHistory = [city, ...filteredHistory].slice(0, 5);

    // Сохраняем в localStorage
    localStorage.setItem('weatherHistory', JSON.stringify(STATE.searchHistory));

    // Обновляем отображение
    renderHistory();
}

// Отображение истории поиска
function renderHistory() {
    DOM.searchHistory.innerHTML = '';

    STATE.searchHistory.forEach(city => {
        const tag = document.createElement('button');
        tag.className = 'history-tag';
        tag.textContent = city;
        tag.setAttribute('aria-label', `Показать погоду в ${city}`);

        tag.addEventListener('click', () => {
            DOM.cityInput.value = city;
            handleSearch(city);
        });

        DOM.searchHistory.appendChild(tag);
    });
}

/* ===================================
   ОБРАБОТЧИКИ СОБЫТИЙ
   =================================== */

// Обработка поиска погоды
async function handleSearch(city) {
    if (!city || city.trim() === '') {
        showError('Пожалуйста, введите название города.');
        return;
    }

    showLoading();

    try {
        // Получаем текущую погоду
        const weatherData = await fetchWeatherByCity(city);
        renderWeather(weatherData);

        // Получаем прогноз
        const forecastData = await fetchForecast(city);
        if (forecastData) {
            renderForecast(forecastData);
        }
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Обработка геолокации
async function handleGeolocation() {
    if (!navigator.geolocation) {
        showError('Геолокация не поддерживается вашим браузером.');
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;

                // Получаем текущую погоду
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                renderWeather(weatherData);

                // Получаем прогноз
                const forecastData = await fetchForecastByCoords(latitude, longitude);
                if (forecastData) {
                    renderForecast(forecastData);
                }
            } catch (error) {
                hideLoading();
                showError(error.message);
            }
        },
        (error) => {
            hideLoading();
            let errorMessage = 'Не удалось определить ваше местоположение.';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Информация о местоположении недоступна.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Превышено время ожидания запроса геолокации.';
                    break;
            }

            showError(errorMessage);
        }
    );
}

// Переключение единиц измерения
function handleUnitToggle(unit) {
    if (STATE.currentUnit === unit) return;

    STATE.currentUnit = unit;

    // Обновляем активную кнопку
    DOM.unitButtons.forEach(btn => {
        if (btn.dataset.unit === unit) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Обновляем отображение температуры
    updateTemperatureDisplay();
}

/* ===================================
   ИНИЦИАЛИЗАЦИЯ
   =================================== */

function init() {
    // Рендерим историю поиска
    renderHistory();

    // Обработчик формы поиска
    DOM.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = DOM.cityInput.value.trim();
        handleSearch(city);
    });

    // Debounce для инпута (опционально, для автокомплита в будущем)
    const debouncedSearch = debounce((city) => {
        // Можно добавить автокомплит здесь
    }, 300);

    DOM.cityInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Обработчик кнопки геолокации
    DOM.geolocationBtn.addEventListener('click', handleGeolocation);

    // Обработчик переключения единиц
    DOM.unitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            handleUnitToggle(btn.dataset.unit);
        });
    });

    // Автоматический запрос погоды по геолокации при загрузке (опционально)
    // handleGeolocation();
}

// Запуск приложения после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
