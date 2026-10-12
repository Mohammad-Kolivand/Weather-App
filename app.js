import { getWeekDay } from "./utils/customeDate.js";
import getWeatherData from "./utils/httpReq.js";
import { removeModal, showModal } from "./utils/modal.js";

const searchInput = document.querySelector("#city-search");
const searchForm = document.querySelector("#search-form");
const searchButton = document.querySelector("#search-button");
const weatherContainer = document.getElementById("weather");
const forecastContainer = document.getElementById("forecast");
const locationButton = document.getElementById("location");

const setLoading = (isLoading) => {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading…" : "Search";
  searchButton.setAttribute("aria-busy", String(isLoading));
};

const renderCurrentWeather = (data) => {
  if (!data) return;

  const icon = data.weather[0].icon;
  weatherContainer.innerHTML = `
    <div class="current-heading">
      <div>
        <p class="eyebrow">CURRENT WEATHER</p>
        <h1>${data.name}${data.sys.country ? `, ${data.sys.country}` : ""}</h1>
        <p class="condition">${data.weather[0].main}</p>
      </div>
      <img class="current-icon" alt="${data.weather[0].description}" src="https://openweathermap.org/img/wn/${icon}d@2x.png" />
    </div>
    <div class="temperature-row">
      <p class="temperature">${Math.round(data.main.temp)}<span>°C</span></p>
      <p class="feels-like">Feels like ${Math.round(data.main.feels_like)}°</p>
    </div>
    <div class="weather-details">
      <article class="detail-card">
        <span class="detail-symbol" aria-hidden="true">💧</span>
        <div><p>Humidity</p><strong>${data.main.humidity}%</strong></div>
      </article>
      <article class="detail-card">
        <span class="detail-symbol" aria-hidden="true">💨</span>
        <div><p>Wind speed</p><strong>${data.wind.speed} km/h</strong></div>
      </article>
    </div>
  `;
};

const renderForecastWeather = (forecast) => {
  if (!Array.isArray(forecast)) return;
  forecastContainer.innerHTML = forecast.map((day, index) => `
    <article class="forecast-card ${index === 0 ? "today" : ""}">
      <h3>${index === 0 ? "Today" : getWeekDay(day.date + "T12:00:00")}</h3>
      <img alt="${day.weather[0].description}" src="https://openweathermap.org/img/wn/${day.weather[0].icon}d@2x.png" />
      <p class="forecast-condition">${day.weather[0].main}</p>
      <p class="forecast-temperatures"><strong>${Math.round(day.temp_max)}°</strong><span>${Math.round(day.temp_min)}°</span></p>
    </article>
  `).join("");
};

const loadWeather = async (location) => {
  setLoading(true);
  weatherContainer.innerHTML = '<div class="loading-state"><span class="loader" aria-hidden="true"></span><p>Getting weather data…</p></div>';
  forecastContainer.innerHTML = "";

  try {
    const [currentData, forecastData] = await Promise.all([
      getWeatherData("current", location),
      getWeatherData("forecast", location),
    ]);
    renderCurrentWeather(currentData);
    renderForecastWeather(forecastData);
  } catch (error) {
    weatherContainer.innerHTML = '<div class="empty-state"><span aria-hidden="true">🌦️</span><p>We couldn’t load the weather.</p><small>Try another city or check your connection.</small></div>';
    showModal(error.message);
  } finally {
    setLoading(false);
  }
};

const searchHandler = (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();
  if (!cityName) {
    showModal("Please enter a city name.");
    searchInput.focus();
    return;
  }
  loadWeather(cityName);
};

const locationHandler = () => {
  if (!navigator.geolocation) {
    showModal("Your browser does not support location services.");
    return;
  }

  locationButton.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationButton.disabled = false;
      loadWeather({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      locationButton.disabled = false;
      showModal(error.code === 1 ? "Location permission was denied." : "Could not get your location. Please try again.");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
};

searchForm.addEventListener("submit", searchHandler);
locationButton.addEventListener("click", locationHandler);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") removeModal();
});

loadWeather("Tehran");
