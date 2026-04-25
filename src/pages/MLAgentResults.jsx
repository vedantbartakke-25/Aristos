import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import Navbar from "../components/Navbar";
import MLResults from "../components/MLResults";

export default function MLAgentResults() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { results, formData } = location.state || { results: [], formData: {} };

  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No results found</h2>
          <button 
            onClick={() => navigate("/home")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Crop Recommendations</h1>
          <button 
            onClick={() => navigate("/home")}
            className="text-emerald-600 font-medium hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Input
          </button>
        </div>

        <MLResults t={t} results={results} />

        <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Need expert advice?</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Our AI Farmer Agents (Trader, Analyst, and Agronomist) can debate these results based on real-time market trends and soil health.
            </p>
          </div>
          <button 
            onClick={() => navigate("/ai-agent", { state: { results, formData } })}
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mx-auto"
          >
            <span>Start AI Expert Debate</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <footer className="text-center py-6 text-xs text-gray-400">
          {t.appName} &copy; 2026 | Ministry of Agriculture & Farmers Welfare, Government of India
        </footer>
      </main>
    </div>
  );
}
