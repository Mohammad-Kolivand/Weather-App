
import { createIcons, icons } from "lucide";

import { getWeekDay } from "./utils/customeDate.js";
import getWeatherData from "./utils/httpReq.js";
import { removeModal, showModal } from "./utils/modal.js";

const searchInput = document.querySelector("#city-search");
const searchForm = document.querySelector("#search-form");
const searchButton = document.querySelector("#search-button");
const weatherContainer = document.querySelector("#weather");
const forecastContainer = document.querySelector("#forecast");
const locationButton = document.querySelector("#location");

const renderIcons = () => {
  createIcons({ icons });
};

const setLoading = (isLoading) => {
  searchButton.disabled = isLoading;
  searchButton.innerHTML = isLoading
    ? 'Loading…'
    : 'Search <i data-lucide="arrow-up-right" aria-hidden="true"></i>';

  searchButton.setAttribute("aria-busy", String(isLoading));

  if (isLoading) {
    locationButton.disabled = true;
  } else {
    locationButton.disabled = false;
  }

  renderIcons();
};

// Map OpenWeather-style icon codes to Lucide icon names.
const getWeatherIcon = (iconCode = "", condition = "") => {
  const code = iconCode.slice(0, 2);
  const isNight = iconCode.endsWith("n");

  const iconsByCode = {
    "01": isNight ? "moon" : "sun",
    "02": isNight ? "cloud-moon" : "cloud-sun",
    "03": "cloud",
    "04": "cloudy",
    "09": "cloud-rain",
    "10": "cloud-rain",
    "11": "cloud-lightning",
    "13": "snowflake",
    "50": "cloud-fog",
  };

  if (iconsByCode[code]) {
    return iconsByCode[code];
  }

  const text = condition.toLowerCase();

  if (text.includes("thunder")) return "cloud-lightning";
  if (text.includes("snow")) return "snowflake";
  if (text.includes("rain")) return "cloud-rain";
  if (text.includes("drizzle")) return "cloud-drizzle";
  if (text.includes("fog") || text.includes("mist")) return "cloud-fog";
  if (text.includes("cloud")) return "cloud";
  if (text.includes("clear")) return isNight ? "moon" : "sun";

  return "cloud-sun";
};

const renderCurrentWeather = (data) => {
  if (!data?.weather?.[0] || !data?.main) return;

  const condition = data.weather[0].main;
  const iconName = getWeatherIcon(data.weather[0].icon, condition);
  const cityName = [data.name, data.sys?.country]
    .filter(Boolean)
    .join(", ");

  weatherContainer.innerHTML = `
    <div class="current-heading">
      <div>
        <p class="eyebrow">CURRENT WEATHER</p>
        <h2>${cityName}</h2>
        <p class="condition">${condition}</p>
      </div>

      <i
        class="current-icon"
        data-lucide="${iconName}"
        role="img"
        aria-label="${data.weather[0].description}"
      ></i>
    </div>

    <div class="temperature-row">
      <p class="temperature">
        ${Math.round(data.main.temp)}<span>°C</span>
      </p>

      <p class="feels-like">
        Feels like ${Math.round(data.main.feels_like)}°
      </p>
    </div>

    <div class="weather-details">
      <article class="detail-card">
        <i class="detail-symbol" data-lucide="droplets" aria-hidden="true"></i>
        <div>
          <p>Humidity</p>
          <h3>${data.main.humidity}%</h3>
        </div>
      </article>

      <article class="detail-card">
        <i class="detail-symbol" data-lucide="wind" aria-hidden="true"></i>
        <div>
          <p>Wind speed</p>
          <h3>${data.wind?.speed ?? "—"} km/h</h3>
        </div>
      </article>
    </div>
  `;

  weatherContainer.setAttribute("aria-busy", "false");
  renderIcons();
};

const renderForecastWeather = (forecast) => {
  if (!Array.isArray(forecast)) return;

  forecastContainer.innerHTML = forecast
    .map((day, index) => {
      const condition = day.weather?.[0]?.main ?? "Unknown";
      const description = day.weather?.[0]?.description ?? condition;
      const iconName = getWeatherIcon(day.weather?.[0]?.icon, condition);

      const dayName =
        index === 0
          ? "Today"
          : getWeekDay(`${day.date}T12:00:00`);

      return `
        <article class="forecast-card ${index === 0 ? "today" : ""}">
          <h3>${dayName}</h3>

          <i
            class="forecast-icon"
            data-lucide="${iconName}"
            role="img"
            aria-label="${description}"
          ></i>

          <p class="forecast-condition">${condition}</p>

          <p class="forecast-temperatures">
            <strong>${Math.round(day.temp_max)}°</strong>
            <span>${Math.round(day.temp_min)}°</span>
          </p>
        </article>
      `;
    })
    .join("");

  forecastContainer.setAttribute("aria-busy", "false");
  renderIcons();
};

const loadWeather = async (location) => {
  setLoading(true);

  weatherContainer.setAttribute("aria-busy", "true");
  forecastContainer.setAttribute("aria-busy", "true");

  weatherContainer.innerHTML = `
    <div class="loading-state">
      <span class="loader" aria-hidden="true"></span>
      <p>Getting weather data…</p>
    </div>
  `;

  forecastContainer.innerHTML = "";

  try {
    const [currentData, forecastData] = await Promise.all([
      getWeatherData("current", location),
      getWeatherData("forecast", location),
    ]);

    renderCurrentWeather(currentData);
    renderForecastWeather(forecastData);
  } catch (error) {
    weatherContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="cloud-rain" aria-hidden="true"></i>
        <p>We couldn't load the weather.</p>
        <small>Try another city or check your connection.</small>
      </div>
    `;

    forecastContainer.innerHTML = "";
    weatherContainer.setAttribute("aria-busy", "false");
    forecastContainer.setAttribute("aria-busy", "false");

    renderIcons();
    showModal(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
    weatherContainer.setAttribute("aria-busy", "false");
    forecastContainer.setAttribute("aria-busy", "false");
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
      loadWeather({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      locationButton.disabled = false;

      const message =
        error.code === 1
          ? "Location permission was denied."
          : "Could not get your location. Please try again.";

      showModal(message);
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    },
  );
};

searchForm.addEventListener("submit", searchHandler);
locationButton.addEventListener("click", locationHandler);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    removeModal();
  }
});

renderIcons();
loadWeather("Tehran");
