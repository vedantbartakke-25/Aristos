import { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import Navbar from "../components/Navbar";
import InputForm from "../components/InputForm";
import MLResults from "../components/MLResults";
import AgentPanel from "../components/AgentPanel";
import FinalOutput from "../components/FinalOutput";
import RejectionPanel from "../components/RejectionPanel";
import SMSButton from "../components/SMSButton";
import { generateMockResults } from "../data/mockData";

export default function Home() {
  const { t } = useLanguage();
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Prepare the payload for the backend
      const payload = {
        N: parseFloat(formData.soil?.nitrogen) || 0,
        P: parseFloat(formData.soil?.phosphorus) || 0,
        K: parseFloat(formData.soil?.potassium) || 0,
        temperature: parseFloat(formData.weather?.temperature) || 0,
        humidity: parseFloat(formData.weather?.humidity) || 0,
        ph: parseFloat(formData.soil?.ph) || 0,
        rainfall: parseFloat(formData.weather?.rainfall) || 0,
        soil_type: "clay", // Defaulting as model expects this
        water_availability: formData.water || "medium",
        season: formData.season || "kharif"
      };

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ML predictions");
      }

      const backendData = await response.json();
      
      // Get base mock data for other sections
      const mockData = generateMockResults(formData);
      
      // Merge backend ML results with mock data for other panels
      setResults({
        ...mockData,
        mlResults: backendData.results
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error("Backend Error:", err);
      setError("Could not connect to the backend ML model. Showing simulated results instead.");
      // Fallback to mock data if backend fails
      const data = generateMockResults(formData);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero text */}
        <div className="text-center pt-2 pb-2">
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            {t.heroText}
          </p>
        </div>

        {/* Input Form */}
        <InputForm t={t} onSubmit={handleSubmit} />

        {/* Error Alert */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 fade-in-up">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-amber-800 font-medium">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div ref={resultsRef} className="space-y-8">
            <MLResults t={t} results={results.mlResults} />
            <AgentPanel t={t} agents={results.agents} />
            <FinalOutput t={t} recommendation={results.recommendation} />
            <RejectionPanel t={t} rejectedCrops={results.rejectedCrops} />
            <SMSButton t={t} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-gray-400">
          {t.appName} &copy; 2026 | Ministry of Agriculture & Farmers Welfare, Government of India
        </footer>
      </main>
    </div>
  );
}
