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

  const handleSubmit = (formData) => {
    const data = generateMockResults(formData);
    setResults(data);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
