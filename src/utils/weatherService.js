/**
 * Weather Service for OpenWeather API integration
 */

const API_KEY = "42b53d711d6c73e5527022b402de96e7";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/reverse";

/**
 * Fetch live weather data for a given location string
 * @param {string} location - City/Location name
 * @returns {Promise<Object>} - Formatted weather data
 */
export async function fetchLiveWeather(location) {
  if (!location) return null;

  try {
    const query = location.includes(",") ? location : `${location},IN`;
    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      rainfall: data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0,
      zone: data.name || "Live Data",
      season: getSeasonFromMonth(),
      isLive: true,
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "",
      windSpeed: data.wind?.speed || 0,
      feelsLike: Math.round(data.main.feels_like),
    };
  } catch (error) {
    console.error("Failed to fetch live weather:", error);
    return null;
  }
}

/**
 * Fetch live weather using latitude and longitude directly
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Formatted weather data
 */
export async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      rainfall: data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0,
      zone: data.name || "Live Data",
      season: getSeasonFromMonth(),
      isLive: true,
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "",
      windSpeed: data.wind?.speed || 0,
      feelsLike: Math.round(data.main.feels_like),
    };
  } catch (error) {
    console.error("Failed to fetch weather by coords:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get a city, state name
 * Uses OpenWeather's reverse geocoding API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} - "City, State" string
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `${GEO_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const place = data[0];
      const city = place.name || "Unknown";
      const state = place.state || "";
      return state ? `${city}, ${state}` : city;
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Determine season from month
 */
function getSeasonFromMonth() {
  const month = new Date().getMonth(); // 0-11
  // Kharif: June-October (5-9), Rabi: November-March (10-2)
  if (month >= 5 && month <= 9) return "kharif";
  if (month >= 10 || month <= 2) return "rabi";
  return "kharif"; // default
}
