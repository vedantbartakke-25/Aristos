// Mock data to simulate weather, soil, and ML predictions

// Simulated weather data by location
const weatherByLocation = {
  "Nashik, Maharashtra": { temperature: 32, humidity: 68, rainfall: 145, season: "kharif", zone: "Western Plateau" },
  "Pune, Maharashtra": { temperature: 30, humidity: 62, rainfall: 120, season: "kharif", zone: "Western Ghats" },
  "Nagpur, Maharashtra": { temperature: 35, humidity: 55, rainfall: 110, season: "kharif", zone: "Vidarbha" },
  "Aurangabad, Maharashtra": { temperature: 34, humidity: 50, rainfall: 90, season: "kharif", zone: "Marathwada" },
  "Indore, Madhya Pradesh": { temperature: 33, humidity: 58, rainfall: 105, season: "kharif", zone: "Malwa Plateau" },
  "Bhopal, Madhya Pradesh": { temperature: 34, humidity: 60, rainfall: 115, season: "kharif", zone: "Central India" },
  "Varanasi, Uttar Pradesh": { temperature: 36, humidity: 72, rainfall: 100, season: "kharif", zone: "Indo-Gangetic Plain" },
  "Lucknow, Uttar Pradesh": { temperature: 35, humidity: 70, rainfall: 95, season: "kharif", zone: "Indo-Gangetic Plain" },
  "Jaipur, Rajasthan": { temperature: 38, humidity: 35, rainfall: 55, season: "kharif", zone: "Arid Western" },
  "Hyderabad, Telangana": { temperature: 34, humidity: 65, rainfall: 130, season: "kharif", zone: "Deccan Plateau" },
};

// Default/fallback weather
const defaultWeather = { temperature: 33, humidity: 60, rainfall: 100, season: "kharif", zone: "General" };

// Simulated Soil Health Card data by location
const soilByLocation = {
  "Nashik, Maharashtra": { nitrogen: 62, phosphorus: 38, potassium: 45, ph: 6.8 },
  "Pune, Maharashtra": { nitrogen: 55, phosphorus: 42, potassium: 50, ph: 6.5 },
  "Nagpur, Maharashtra": { nitrogen: 48, phosphorus: 35, potassium: 40, ph: 7.2 },
  "Aurangabad, Maharashtra": { nitrogen: 42, phosphorus: 30, potassium: 38, ph: 7.5 },
  "Indore, Madhya Pradesh": { nitrogen: 58, phosphorus: 44, potassium: 52, ph: 6.9 },
  "Bhopal, Madhya Pradesh": { nitrogen: 52, phosphorus: 40, potassium: 48, ph: 7.0 },
  "Varanasi, Uttar Pradesh": { nitrogen: 65, phosphorus: 50, potassium: 55, ph: 7.1 },
  "Lucknow, Uttar Pradesh": { nitrogen: 60, phosphorus: 46, potassium: 52, ph: 7.0 },
  "Jaipur, Rajasthan": { nitrogen: 35, phosphorus: 25, potassium: 30, ph: 8.1 },
  "Hyderabad, Telangana": { nitrogen: 50, phosphorus: 36, potassium: 42, ph: 6.6 },
};

const defaultSoil = { nitrogen: 50, phosphorus: 38, potassium: 42, ph: 6.8 };

/**
 * Get simulated weather for a location string
 */
export function getWeatherForLocation(location) {
  if (!location) return defaultWeather;
  const key = Object.keys(weatherByLocation).find(
    (k) => location.toLowerCase().includes(k.split(",")[0].toLowerCase())
  );
  return key ? weatherByLocation[key] : defaultWeather;
}

/**
 * Get simulated soil health card data for a location string
 */
export function getSoilForLocation(location) {
  if (!location) return defaultSoil;
  const key = Object.keys(soilByLocation).find(
    (k) => location.toLowerCase().includes(k.split(",")[0].toLowerCase())
  );
  return key ? soilByLocation[key] : defaultSoil;
}

/**
 * Determine season from month
 */
export function getSeasonFromMonth() {
  const month = new Date().getMonth(); // 0-11
  // Kharif: June-October (5-9), Rabi: November-March (10-2)
  if (month >= 5 && month <= 9) return "kharif";
  if (month >= 10 || month <= 2) return "rabi";
  return "kharif"; // default (summer/transition)
}

/**
 * Generate mock ML results based on form + weather + soil
 */
export function generateMockResults(formData) {
  const season = formData.season || "kharif";
  const isKharif = season === "kharif";
  const water = formData.water;

  const kharifCrops = [
    { name: "Soybean", score: 92 },
    { name: "Maize", score: 87 },
    { name: "Cotton", score: 81 },
    { name: "Paddy (Rice)", score: 74 },
  ];

  const rabiCrops = [
    { name: "Wheat", score: 94 },
    { name: "Chickpea (Gram)", score: 89 },
    { name: "Mustard", score: 83 },
    { name: "Sunflower", score: 71 },
  ];

  const crops = isKharif ? kharifCrops : rabiCrops;

  // Adjust scores based on water availability
  const waterMultiplier = water === "high" ? 1.02 : water === "low" ? 0.95 : 1;
  const adjustedCrops = crops.map((c) => ({
    ...c,
    score: Math.min(99, Math.round(c.score * waterMultiplier)),
  }));

  return {
    mlResults: adjustedCrops,
    agents: {
      farmer: isKharif
        ? "Based on local soil quality and historical data, soybean and maize have shown consistent yields in this region during Kharif season."
        : "Wheat and chickpea are traditionally strong crops in this region during Rabi season, aligning with local farming expertise.",
      market: isKharif
        ? "Current MSP for soybean is favorable. Market demand for cotton has slight uncertainty due to global trends."
        : "Wheat prices remain stable with government procurement support. Mustard demand is rising in urban markets.",
      consumer: isKharif
        ? "Soybean and maize offer high nutritional value. Increasing consumer demand for protein-rich crops supports soybean."
        : "Wheat is a dietary staple with guaranteed demand. Chickpea provides essential protein for regional diet patterns.",
    },
    recommendation: {
      topCrops: isKharif
        ? ["Soybean", "Maize"]
        : ["Wheat", "Chickpea (Gram)"],
      explanation: isKharif
        ? `Soybean is the best fit for your soil profile (N: ${formData.soil?.nitrogen || 50} kg/ha) with ${water} water availability across ${formData.landSize || "your"} acres. Maize is a strong secondary option with good market returns.`
        : `Wheat is ideal for Rabi season given your soil conditions (pH: ${formData.soil?.ph || 6.8}) and ${water} water availability. Chickpea complements well as a rotation crop.`,
      riskLevel: water === "low" ? "moderate" : "low",
    },
    rejectedCrops: isKharif
      ? [
          { name: "Sugarcane", reason: "Requires very high water; not suitable for current availability." },
          { name: "Banana", reason: "Needs tropical climate conditions and consistent irrigation." },
        ]
      : [
          { name: "Paddy (Rice)", reason: "Not suitable for Rabi season; requires standing water." },
          { name: "Jute", reason: "Requires warm, humid conditions not available in Rabi." },
        ],
  };
}
