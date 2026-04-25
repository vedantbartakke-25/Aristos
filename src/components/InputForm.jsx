import { useState, useEffect, useCallback, useRef } from "react";
import {
  getWeatherForLocation,
  getSoilForLocation,
  getSeasonFromMonth,
} from "../data/mockData";
import { parseSoilHealthCardPDF } from "../utils/pdfParser";

const LOCATIONS = [
  "Nashik, Maharashtra",
  "Pune, Maharashtra",
  "Nagpur, Maharashtra",
  "Aurangabad, Maharashtra",
  "Indore, Madhya Pradesh",
  "Bhopal, Madhya Pradesh",
  "Varanasi, Uttar Pradesh",
  "Lucknow, Uttar Pradesh",
  "Jaipur, Rajasthan",
  "Hyderabad, Telangana",
];

export default function InputForm({ t, onSubmit }) {
  const [location, setLocation] = useState("");
  const [locationAuto, setLocationAuto] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [landSize, setLandSize] = useState("");
  const [landUnit, setLandUnit] = useState("acres");
  const [water, setWater] = useState("medium");
  const [weather, setWeather] = useState(null);
  const [soil, setSoil] = useState(null);
  const [season, setSeason] = useState(getSeasonFromMonth());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soil source: "auto" (simulated) or "pdf" (uploaded)
  const [soilSource, setSoilSource] = useState("auto");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const fileInputRef = useRef(null);

  // Update weather + soil when location changes
  const updateLocationData = useCallback((loc) => {
    if (loc && loc.trim().length > 2) {
      const w = getWeatherForLocation(loc);
      setWeather(w);
      setSeason(w.season || getSeasonFromMonth());
      // Only set auto soil if we're in auto mode
      if (soilSource === "auto") {
        const s = getSoilForLocation(loc);
        setSoil(s);
      }
    }
  }, [soilSource]);

  useEffect(() => {
    if (location) {
      const timer = setTimeout(() => updateLocationData(location), 300);
      return () => clearTimeout(timer);
    }
  }, [location, updateLocationData]);

  // When switching back to auto mode, reload simulated soil
  // When switching to PDF mode, clear soil until a PDF is uploaded
  useEffect(() => {
    if (soilSource === "auto" && location) {
      const s = getSoilForLocation(location);
      setSoil(s);
      setPdfFile(null);
      setPdfFileName("");
      setPdfError("");
    } else if (soilSource === "pdf" && !pdfFileName) {
      setSoil(null);
    }
  }, [soilSource, location]);

  // Auto-detect location via browser geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const simulatedCity = "Nashik, Maharashtra";
        setLocation(simulatedCity);
        setLocationAuto(true);
        updateLocationData(simulatedCity);
        setDetectingLocation(false);
      },
      () => {
        const fallback = "Pune, Maharashtra";
        setLocation(fallback);
        setLocationAuto(true);
        updateLocationData(fallback);
        setDetectingLocation(false);
      },
      { timeout: 5000 }
    );
  };

  // Handle PDF file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setPdfError(t.pdfInvalidType || "Please upload a valid PDF file.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPdfError(t.pdfTooLarge || "File size must be under 10 MB.");
      return;
    }

    setPdfFile(file);
    setPdfFileName(file.name);
    setPdfError("");
    setPdfParsing(true);

    try {
      const result = await parseSoilHealthCardPDF(file);

      if (result.parsed) {
        // Use parsed values, fall back to defaults for any missing ones
        setSoil({
          nitrogen: result.nitrogen ?? "--",
          phosphorus: result.phosphorus ?? "--",
          potassium: result.potassium ?? "--",
          ph: result.ph ?? "--",
        });
        setPdfError("");
      } else {
        // Could not parse — show warning but still allow user to proceed
        setPdfError(t.pdfParseWarning || "Could not extract soil values from this PDF. Values may appear as '--'. You can switch to simulated data.");
        setSoil({
          nitrogen: result.nitrogen ?? "--",
          phosphorus: result.phosphorus ?? "--",
          potassium: result.potassium ?? "--",
          ph: result.ph ?? "--",
        });
      }
    } catch (err) {
      setPdfError(t.pdfParseError || "Error reading PDF file. Please try again or use simulated data.");
      setSoil(null);
    } finally {
      setPdfParsing(false);
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setPdfFileName("");
    setPdfError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Reload simulated data
    if (location) {
      const s = getSoilForLocation(location);
      setSoil(s);
    } else {
      setSoil(null);
    }
    setSoilSource("auto");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    onSubmit({
      location,
      season,
      water,
      landSize: landSize ? parseFloat(landSize) : 0,
      landUnit,
      soil,
      weather,
    });
    setIsSubmitting(false);
  };

  return (
    <section id="input-form" className="fade-in-up">
      <div className="bg-white rounded-2xl shadow-lg shadow-green-100/50 border border-green-50 p-6 sm:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t.enterFarmDetails}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Location ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.location}</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  list="locations-list"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLocationAuto(false);
                  }}
                  placeholder={t.locationPlaceholder}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                  required
                />
                <datalist id="locations-list">
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium hover:bg-green-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <svg className={`w-4 h-4 ${detectingLocation ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">
                  {detectingLocation ? t.detecting : t.detectLocation}
                </span>
              </button>
            </div>
            {locationAuto && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t.locationDetected}
              </p>
            )}
          </div>

          {/* ── Section 2: Weather & Crop Zone (Read-only) ── */}
          {weather && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">{t.weatherAndZone}</span>
                </div>
                <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full font-medium">{t.autoFetchedNote}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <WeatherCard label={t.temperature} value={`${weather.temperature} C`} />
                <WeatherCard label={t.humidity} value={`${weather.humidity}%`} />
                <WeatherCard label={t.rainfall} value={`${weather.rainfall}`} />
                <WeatherCard label={t.cropZone} value={weather.zone} small />
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{t.season}:</span>
                <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {season === "kharif" ? t.kharif : t.rabi}
                </span>
              </div>
            </div>
          )}

          {/* ── Section 3: Land Size & Water ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.landSize}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder={t.landSizePlaceholder}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                  required
                />
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
                >
                  <option value="acres">{t.acres}</option>
                  <option value="hectares">{t.hectares}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.waterAvailability}</label>
              <select
                value={water}
                onChange={(e) => setWater(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition cursor-pointer"
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
              </select>
            </div>
          </div>

          {/* ── Section 4: Soil Health Card ── */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-5">
            {/* Header with toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">{t.soilHealthCard}</span>
              </div>
            </div>

            {/* Source Toggle: Auto / Upload PDF */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSoilSource("auto")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                  soilSource === "auto"
                    ? "border-amber-400 bg-amber-100 text-amber-800"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {t.soilAutoLabel || "Use Simulated Data"}
              </button>
              <button
                type="button"
                onClick={() => setSoilSource("pdf")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  soilSource === "pdf"
                    ? "border-amber-400 bg-amber-100 text-amber-800"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t.soilUploadLabel || "Upload Soil Health Card (PDF)"}
              </button>
            </div>

            {/* PDF Upload Area (shown when soilSource === "pdf") */}
            {soilSource === "pdf" && (
              <div className="mb-4">
                {!pdfFileName ? (
                  /* Drop zone / file picker */
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 rounded-xl p-6 cursor-pointer hover:bg-amber-50 transition-all">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">
                      {t.pdfDropzoneText || "Click to upload Soil Health Card PDF"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.pdfDropzoneHint || "PDF format, max 10 MB"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  /* File uploaded - show filename + remove */
                  <div className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 18h10V6H7v12zM14 0v2h5v2H5V2h5V0h4z" />
                        <path d="M5 4h14l-1 16H6L5 4zm2 2l.9 12h8.2l.9-12H7z" />
                      </svg>
                      {/* PDF icon */}
                      <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px] sm:max-w-none">{pdfFileName}</p>
                        {pdfParsing && <p className="text-xs text-amber-600">{t.pdfParsing || "Extracting soil data..."}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                      title="Remove file"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Error/Warning */}
                {pdfError && (
                  <p className="text-xs text-red-600 mt-2 flex items-start gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {pdfError}
                  </p>
                )}
              </div>
            )}

            {/* Soil Values Display */}
            {soil && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <SoilCard label={t.nitrogen} value={soil.nitrogen} unit={t.kgPerHa} color="green" />
                  <SoilCard label={t.phosphorus} value={soil.phosphorus} unit={t.kgPerHa} color="blue" />
                  <SoilCard label={t.potassium} value={soil.potassium} unit={t.kgPerHa} color="purple" />
                  <SoilCard label={t.ph} value={soil.ph} unit="" color="amber" />
                </div>

                <p className="text-xs text-green-700 flex items-center gap-1.5 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                  <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {soilSource === "pdf"
                    ? (t.soilPdfLoaded || "Soil data extracted from uploaded PDF")
                    : t.soilHealthLoaded}
                </p>
              </>
            )}

            {/* Show placeholder when PDF mode but no file yet */}
            {!soil && soilSource === "pdf" && !pdfFileName && (
              <p className="text-xs text-gray-400 text-center py-2">
                {t.soilUploadPrompt || "Upload a Soil Health Card PDF to load soil data"}
              </p>
            )}
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={isSubmitting || !location || !landSize}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t.getRecommendation}
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ── Sub-components ── */

function WeatherCard({ label, value, small }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-blue-50">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-bold text-gray-800 ${small ? "text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function SoilCard({ label, value, unit, color }) {
  const colorMap = {
    green: "border-green-200 bg-green-50/50",
    blue: "border-blue-200 bg-blue-50/50",
    purple: "border-purple-200 bg-purple-50/50",
    amber: "border-amber-200 bg-amber-50/50",
  };
  const textMap = {
    green: "text-green-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
  };

  return (
    <div className={`rounded-lg p-3 border ${colorMap[color]}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${textMap[color]}`}>
        {value} {unit && <span className="font-normal text-xs text-gray-400">{unit}</span>}
      </p>
    </div>
  );
}
