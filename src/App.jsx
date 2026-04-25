import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import InputForm from "./components/InputForm";
import MLResults from "./components/MLResults";
import AgentPanel from "./components/AgentPanel";
import FinalOutput from "./components/FinalOutput";
import RejectionPanel from "./components/RejectionPanel";
import SMSButton from "./components/SMSButton";
import translations from "./i18n/translations";
import { generateMockResults } from "./data/mockData";

export default function App() {
  const [lang, setLang] = useState("EN");
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  const t = translations[lang];

  const handleSubmit = (formData) => {
    const data = generateMockResults(formData);
    setResults(data);
    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
      <Navbar lang={lang} setLang={setLang} t={t} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero text */}
        <div className="text-center pt-2 pb-2">
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            {lang === "HI"
              ? "अपना स्थान साझा करें, और मिट्टी व मौसम के आंकड़ों के आधार पर AI-संचालित फसल सिफारिशें स्वचालित रूप से प्राप्त करें"
              : lang === "MR"
              ? "तुमचे ठिकाण शेअर करा, आणि मातीच्या व हवामानाच्या आधारे AI-चालित पीक शिफारशी आपोआप मिळवा"
              : "Share your location and get AI-powered crop recommendations automatically based on soil and weather data"}
          </p>
        </div>

        {/* Input Form */}
        <InputForm t={t} onSubmit={handleSubmit} />

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
          Smart Crop Advisor &copy; 2026 | Ministry of Agriculture & Farmers Welfare, Government of India
        </footer>
      </main>
    </div>
  );
}
