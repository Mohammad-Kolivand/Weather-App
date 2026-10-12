const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const weatherInfo = (code) => {
  if (code === 0) return { main: "Clear sky", icon: "01" };
  if ([1, 2, 3].includes(code)) return { main: "Partly cloudy", icon: "02" };
  if ([45, 48].includes(code)) return { main: "Fog", icon: "50" };
  if ([51, 53, 55, 56, 57].includes(code)) return { main: "Drizzle", icon: "09" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { main: "Rain", icon: "10" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { main: "Snow", icon: "13" };
  if ([95, 96, 99].includes(code)) return { main: "Thunderstorm", icon: "11" };
  return { main: "Unknown", icon: "03" };
};

const resolveLocation = async (data) => {
  if (typeof data !== "string") {
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      name: "Your location",
      country: "",
    };
  }

  const query = data.trim();
  if (!query) throw new Error("Please enter a city name.");

  const response = await fetch(
    `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  );
  if (!response.ok) throw new Error("Could not search for this city. Please try again.");
  const result = await response.json();
  const place = result.results?.[0];

  if (!place) throw new Error("City not found. Check the spelling and try again.");

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    country: place.country_code || place.country || "",
  };
};

const getWeatherData = async (type, data) => {
  try {
    const location = await resolveLocation(data);
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: "7",
    });

    const response = await fetch(`${WEATHER_URL}?${params.toString()}`);
    if (!response.ok) throw new Error("Weather data is temporarily unavailable.");
    const result = await response.json();

    if (type === "current") {
      const info = weatherInfo(result.current.weather_code);
      return {
        name: location.name,
        sys: { country: location.country },
        weather: [{ ...info, description: info.main }],
        main: {
          temp: result.current.temperature_2m,
          feels_like: result.current.apparent_temperature,
          humidity: result.current.relative_humidity_2m,
        },
        wind: { speed: result.current.wind_speed_10m },
        is_day: result.current.is_day,
      };
    }

    return result.daily.time.map((date, index) => {
      const info = weatherInfo(result.daily.weather_code[index]);
      return {
        date,
        temp_max: result.daily.temperature_2m_max[index],
        temp_min: result.daily.temperature_2m_min[index],
        weather: [{ ...info, description: info.main }],
      };
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "An unexpected error occurred.");
  }
};

export default getWeatherData;
