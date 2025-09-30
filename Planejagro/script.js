let currentLocation = null;

// Função para obter localização do usuário
function getLocation() {
    if (!navigator.geolocation) {
        showError('Geolocalização não é suportada neste navegador.');
        return;
    }

    showLoading(true);
    hideError();

    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            fetchWeatherByCoords(currentLocation.latitude, currentLocation.longitude);
        },
        function(error) {
            showLoading(false);
            let errorMessage = 'Erro ao obter localização: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Permissão negada.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Localização indisponível.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Tempo esgotado.';
                    break;
                default:
                    errorMessage += 'Erro desconhecido.';
                    break;
            }
            showError(errorMessage);
        }
    );
}

// Função para buscar clima por cidade
function searchWeather() {
    const city = document.getElementById('location').value.trim();
    if (!city) {
        showError('Por favor, digite o nome da cidade.');
        return;
    }

    // Primeiro, obter coordenadas da cidade usando geocoding
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                fetchWeatherByCoords(result.latitude, result.longitude, result.name);
            } else {
                showError('Cidade não encontrada. Tente novamente.');
                showLoading(false);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar cidade:', error);
            showError('Erro ao buscar a cidade. Verifique sua conexão.');
            showLoading(false);
        });
}

// Função para buscar dados meteorológicos
function fetchWeatherByCoords(lat, lon, locationName = null) {
    showLoading(true);
    hideError();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,pressure_msl,weather_code&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            displayWeather(data, locationName);
        })
        .catch(error => {
            console.error('Erro ao buscar dados meteorológicos:', error);
            showError('Erro ao carregar dados meteorológicos. Verifique sua conexão.');
            showLoading(false);
        });
}

// Função para exibir dados meteorológicos
function displayWeather(data, locationName) {
    const current = data.current;
    const location = locationName || `Lat: ${data.latitude.toFixed(2)}, Lon: ${data.longitude.toFixed(2)}`;

    // Obter descrição do clima baseado no código
    const weatherDesc = getWeatherDescription(current.weather_code);

    document.getElementById('weatherLocation').textContent = location;
    document.getElementById('weatherTemp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('weatherDesc').textContent = weatherDesc;
    document.getElementById('weatherFeelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('weatherHumidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('weatherWind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('weatherPressure').textContent = `${Math.round(current.pressure_msl)} hPa`;

    document.getElementById('weatherCard').classList.add('show');
}

// Função para obter descrição do clima baseada no código
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Céu limpo',
        1: 'Principalmente limpo',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Neblina',
        48: 'Neblina com geada',
        51: 'Chuva leve',
        53: 'Chuva moderada',
        55: 'Chuva intensa',
        61: 'Chuva leve',
        63: 'Chuva moderada',
        65: 'Chuva intensa',
        71: 'Neve leve',
        73: 'Neve moderada',
        75: 'Neve intensa',
        77: 'Grãos de neve',
        80: 'Chuva fraca',
        81: 'Chuva moderada',
        82: 'Chuva forte',
        85: 'Neve fraca',
        86: 'Neve forte',
        95: 'Tempestade',
        96: 'Tempestade com granizo',
        99: 'Tempestade forte com granizo'
    };
    return weatherCodes[code] || 'Condições desconhecidas';
}

// Funções auxiliares para UI
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    document.getElementById('error').classList.remove('show');
}

// Permitir busca ao pressionar Enter
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('location').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
});
