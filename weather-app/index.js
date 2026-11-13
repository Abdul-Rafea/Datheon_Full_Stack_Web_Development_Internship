// DOM Elements
const searchInput = document.getElementById('weather-search-input');
const searchButton = document.getElementById('weather-search-button');
const errorBanner = document.getElementById('weather-error-banner');
const spinnerContainer = document.getElementById('weather-spinner-container');
const dashboard = document.getElementById('weather-dashboard');
const weatherPage = document.getElementById('weather-page');

const locationHeading = document.getElementById('weather-location-heading');
const conditionText = document.getElementById('weather-condition-text');
const tempDisplay = document.getElementById('weather-temp-display');
const humidityValue = document.getElementById('weather-humidity-value');
const windValue = document.getElementById('weather-wind-value');
const pressureValue = document.getElementById('weather-pressure-value');
const forecastContainer = document.getElementById('weather-forecast-container');

// Helper function to display custom messages without alert()
function showError(message) {
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
    spinnerContainer.style.display = 'none';
    dashboard.style.display = 'none';
}

function hideError() {
    errorBanner.style.display = 'none';
}

// Map WMO weather codes to condition descriptions and icons
function getWeatherDetails(code) {
    // WMO Weather interpretation codes (Open-Meteo standard)
    if (code === 0) return { text: 'Clear Sky', icon: '☀️', theme: 'sunny' };
    if ([1, 2].includes(code)) return { text: 'Partly Cloudy', icon: '⛅', theme: 'cloudy' };
    if (code === 3) return { text: 'Overcast', icon: '☁️', theme: 'cloudy' };
    if ([45, 48].includes(code)) return { text: 'Foggy', icon: '🌫️', theme: 'cloudy' };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: 'Rainy', icon: '🌧️', theme: 'rainy' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'Snowy', icon: '❄️', theme: 'cloudy' };
    if ([95, 96, 99].includes(code)) return { text: 'Thunderstorm', icon: '⚡', theme: 'rainy' };
    return { text: 'Fair Weather', icon: '🌤️', theme: 'sunny' };
}

// Update dynamic background gradient based on condition
function updateTheme(themeType) {
    if (themeType === 'sunny') {
        weatherPage.style.background = 'var(--bg-sunny)';
    } else if (themeType === 'rainy') {
        weatherPage.style.background = 'var(--bg-rainy)';
    } else {
        weatherPage.style.background = 'var(--bg-cloudy)';
    }
}

// Format day name from date string
function formatDayName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Asynchronous function to fetch weather telemetry
async function fetchWeatherData(cityName) {
    if (!cityName.trim()) {
        showError('Please enter a valid city name.');
        return;
    }

    hideError();
    spinnerContainer.style.display = 'flex';
    dashboard.style.display = 'none';

    try {
        // Step 1: Geocoding API to retrieve coordinates for city name
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        
        if (!geoResponse.ok) {
            throw new Error('Network connection error while fetching location.');
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`City "${cityName}" not found. Please verify the spelling and try again.`);
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country, admin1 } = location;
        const displayName = `${name}${admin1 ? ', ' + admin1 : ''}${country ? ' (' + country + ')' : ''}`;

        // Step 2: Weather API to fetch real-time telemetry and 5-day forecast
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);

        if (!weatherResponse.ok) {
            throw new Error('Failed to retrieve meteorological telemetry data.');
        }

        const weatherData = await weatherResponse.json();

        // Populate Current Weather
        locationHeading.textContent = displayName;
        const currentCondition = getWeatherDetails(weatherData.current.weather_code);
        conditionText.textContent = currentCondition.text;
        tempDisplay.textContent = `${Math.round(weatherData.current.temperature_2m)}°C`;
        humidityValue.textContent = `${weatherData.current.relative_humidity_2m}%`;
        windValue.textContent = `${weatherData.current.wind_speed_10m} km/h`;
        pressureValue.textContent = `${weatherData.current.surface_pressure} hPa`;

        updateTheme(currentCondition.theme);

        // Populate 5-Day Forecast using Array.map()
        const daily = weatherData.daily;
        const forecastDays = daily.time.slice(1, 6); // Get next 5 days

        const forecastHTMLCards = forecastDays.map((dateStr, index) => {
            const dayIndex = index + 1; // offset by 1 for daily data
            const code = daily.weather_code[dayIndex];
            const details = getWeatherDetails(code);
            const maxTemp = Math.round(daily.temperature_2m_max[dayIndex]);
            const minTemp = Math.round(daily.temperature_2m_min[dayIndex]);
            const dayName = formatDayName(dateStr);

            return `
                <div class="weather-forecast-card">
                    <span class="weather-forecast-day">${dayName}</span>
                    <span class="weather-forecast-icon">${details.icon}</span>
                    <div class="weather-forecast-temps">
                        <span class="weather-forecast-max">${maxTemp}°</span>
                        <span class="weather-forecast-min">${minTemp}°</span>
                    </div>
                </div>
            `;
        }).join('');

        forecastContainer.innerHTML = forecastHTMLCards;

        // Show dashboard and hide spinner
        spinnerContainer.style.display = 'none';
        dashboard.style.display = 'flex';

    } catch (error) {
        showError(error.message || 'An unexpected error occurred while processing your request.');
    }
}

// Event Listeners
searchButton.addEventListener('click', () => {
    fetchWeatherData(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeatherData(searchInput.value);
    }
});

// Load default city on startup
window.addEventListener('load', () => {
    searchInput.value = 'London';
    fetchWeatherData('London');
});