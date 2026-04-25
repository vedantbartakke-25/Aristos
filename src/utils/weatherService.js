/**
 * Weather Service for OpenWeather API integration
 */

const API_KEY = "42b53d711d6c73e5527022b402de96e7"; // Replace with your actual API key
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Fetch live weather data for a given location string
 * @param {string} location - City/Location name
 * @returns {Promise<Object>} - Formatted weather data
 */
export async function fetchLiveWeather(location) {
  if (!location) return null;

  try {
    // 1. Get current weather by city name
    // We append ",IN" to target India specifically if not provided
    const query = location.includes(",") ? location : `${location},IN`;
    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 2. Format the data to match the project's requirements
    // OpenWeather provides 'temp', 'humidity', and sometimes 'rain'
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      rainfall: data.rain ? (data.rain["1h"] || data.rain["3h"] || 0) : 0,
      zone: "Live Data", // Could be mapped from coordinates if needed
      season: getSeasonFromMonth(), // Calculate season locally
      isLive: true
    };
  } catch (error) {
    console.error("Failed to fetch live weather:", error);
    return null; // Fallback to mock data handled in component
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
