import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useDebate } from "../context/DebateContext";
import Navbar from "../components/Navbar";

export default function MLAgentResults() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Shared debate state (persists across navigation)
  const debate = useDebate();

  // Get results from navigation state OR from saved context
  const navState = location.state || {};
  const results = navState.results || debate.resultsData?.results || [];
  const formData = navState.formData || debate.resultsData?.formData || {};

  // Save results to context on first load
  useEffect(() => {
    if (navState.results && navState.results.length > 0) {
      debate.setResultsData({ results: navState.results, formData: navState.formData });
    }
  }, []);

  // Timer for estimated time
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let interval;
    if (debate.debateStatus === "running" && debate.debateStartTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - debate.debateStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [debate.debateStatus, debate.debateStartTime]);

  const ESTIMATED_TOTAL_SECONDS = 120; // ~2 minutes for full debate + final output
  const remaining = Math.max(0, ESTIMATED_TOTAL_SECONDS - elapsed);
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Connect WebSocket only once (check if already connected)
  useEffect(() => {
    if (debate.wsRef.current && debate.wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://localhost:8000/ws");
    debate.wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "phase_start") debate.setDebateStatus("running");
        if (data.event === "agent_log" && data.text) {
          debate.setDebateMessages((prev) => [...prev, data]);
          if (data.sender && data.sender !== "System") {
            debate.setAgentSummaries((prev) => ({
              ...prev,
              [data.sender]: [...(prev[data.sender] || []), { text: data.text, crop: data.crop || null }],
            }));
          }
        }
        if (data.event === "pipeline_end") debate.setDebateStatus("complete");
      } catch (e) {}
    };

    ws.onclose = () => {
      if (debate.debateStatus === "running") debate.setDebateStatus("complete");
    };

    return () => {};
  }, []);

  // When debate completes, fetch final output from Ollama
  useEffect(() => {
    if (debate.debateStatus === "complete" && !debate.finalOutput && !debate.finalOutputLoading) {
      fetchFinalOutput();
    }
  }, [debate.debateStatus]);

  const fetchFinalOutput = async () => {
    debate.setFinalOutputLoading(true);
    try {
      const top3 = results.slice(0, 3).map(c => ({ crop_name: c.name, score: c.score }));
      const insights = {};
      for (const agent of ["Farmer", "Trader", "Analyst"]) {
        insights[agent] = (debate.agentSummaries[agent] || []).map(m => m.text).slice(0, 2);
      }
      const res = await fetch("http://localhost:8000/final-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top3, agent_insights: insights }),
      });
      const data = await res.json();
      if (data.status === "success") debate.setFinalOutput(data.data);
    } catch (err) {
      console.error("Failed to fetch final output:", err);
    } finally {
      debate.setFinalOutputLoading(false);
    }
  };

  const startDebate = async () => {
    debate.setDebateStatus("running");
    debate.setDebateMessages([]);
    debate.setAgentSummaries({ Farmer: [], Trader: [], Analyst: [] });
    debate.setFinalOutput(null);
    debate.setDebateStartTime(Date.now());
    setElapsed(0);
    try {
      await fetch("http://localhost:8000/run", { method: "POST" });
    } catch (err) {
      console.error("Failed to start debate:", err);
      debate.setDebateStatus("idle");
    }
  };

  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No results found</h2>
          <button onClick={() => navigate("/home")} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Go Back</button>
        </div>
      </div>
    );
  }

  const top3 = results.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-24", "h-32", "h-20"];
  const podiumColors = ["bg-gradient-to-t from-gray-300 to-gray-200", "bg-gradient-to-t from-yellow-400 to-yellow-300", "bg-gradient-to-t from-amber-600 to-amber-500"];
  const podiumLabels = ["2", "1", "3"];
  const cropEmojis = ["🌿", "🌾", "🌱"];

  const getAgentIcon = (n) => n === "Farmer" ? "🌾" : n === "Trader" ? "📈" : "🔬";

  // Count how many agents have responded
  const agentsDone = ["Farmer", "Trader", "Analyst"].filter(a => (debate.agentSummaries[a] || []).length > 0).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F9F5" }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🌱 Crop Recommendations</h1>
          <button onClick={() => navigate("/home")} className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
        </div>

        {/* Debate Controls */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI Expert Debate</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Our AI agents search the internet for real-time data and debate the best crop for you.</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {debate.debateStatus === "idle" && (
              <button onClick={startDebate} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">🚀 Start AI Expert Debate</button>
            )}
            {debate.debateStatus === "running" && (
              <div className="flex items-center gap-4">
                <div className="px-6 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-semibold flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Debating... ({agentsDone}/3 agents)
                </div>
                <div className="text-sm text-gray-500 font-mono">
                  ⏱ {formatTime(elapsed)} elapsed
                  <span className="text-gray-400"> · ~{formatTime(remaining)} remaining</span>
                </div>
              </div>
            )}
            {debate.debateStatus === "complete" && (
              <div className="px-8 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Debate Complete! ({formatTime(elapsed)})
              </div>
            )}
            <button onClick={() => navigate("/ai-agent", { state: { results, formData } })} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200">💬 Open Live Chat</button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/*  FINAL OUTPUT — Generated by Ollama           */}
        {/* ═══════════════════════════════════════════════ */}
        {(debate.debateStatus === "complete" || debate.debateStatus === "running") && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden fade-in-up">
            <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-lg">📊</div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">FINAL OUTPUT</h2>
                <p className="text-emerald-100 text-xs">(TOP 3)</p>
              </div>
              {(debate.finalOutputLoading || debate.debateStatus === "running") && (
                <div className="ml-auto text-sm font-mono text-emerald-100 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Est. ~{formatTime(remaining)} remaining
                </div>
              )}
            </div>

            {(debate.finalOutputLoading || debate.debateStatus === "running") ? (
              <div className="p-8 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <svg className="animate-spin h-20 w-20 text-emerald-200" viewBox="0 0 24 24">
                    <circle className="opacity-40" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path className="opacity-90" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" d="M12 2a10 10 0 019.95 9" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {Math.min(99, Math.round((elapsed / ESTIMATED_TOTAL_SECONDS) * 100))}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Generating Final Output...</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  AI is synthesizing the agent debate into a final advisory report.
                </p>
                {/* Progress steps */}
                <div className="max-w-xs mx-auto space-y-2 text-left">
                  <div className={`flex items-center gap-2 text-sm ${agentsDone >= 1 ? "text-green-600" : "text-gray-400"}`}>
                    {agentsDone >= 1 ? "✅" : "⏳"} Farmer analysis
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${agentsDone >= 2 ? "text-green-600" : "text-gray-400"}`}>
                    {agentsDone >= 2 ? "✅" : "⏳"} Trader analysis
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${agentsDone >= 3 ? "text-green-600" : "text-gray-400"}`}>
                    {agentsDone >= 3 ? "✅" : "⏳"} Analyst analysis
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${debate.debateStatus === "complete" ? "text-green-600" : "text-gray-400"}`}>
                    {debate.debateStatus === "complete" ? "✅" : "⏳"} Cross-critique debate
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${debate.finalOutput ? "text-green-600" : "text-gray-400"}`}>
                    {debate.finalOutput ? "✅" : "⏳"} Final report generation
                  </div>
                </div>
              </div>
            ) : debate.finalOutput ? (
              <div className="p-6 sm:p-8 space-y-8">
                {/* ── Podium ── */}
                <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 pb-2">
                  {podiumOrder.map((crop, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                      <span className="text-3xl">{cropEmojis[i]}</span>
                      <p className="text-xs font-bold text-gray-700 text-center leading-tight truncate w-full">{crop?.name}</p>
                      <div className={`w-full ${podiumHeights[i]} ${podiumColors[i]} rounded-t-xl flex items-start justify-center pt-3 shadow-inner`}>
                        <span className="font-extrabold text-2xl text-white/90 drop-shadow">{podiumLabels[i]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Top 3 List ── */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900">🏆 Top 3 Recommended Crops</h3>
                  {top3.map((crop, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : "bg-amber-600"}`}>{i + 1}</div>
                      <span className="font-semibold text-gray-800">{crop.name}</span>
                      <span className="ml-auto text-sm font-bold text-emerald-600">{crop.score}%</span>
                    </div>
                  ))}
                </div>

                {/* ── Explanation (from Ollama) ── */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">📝 Explanation <span className="text-xs font-normal text-gray-400">(Why selected)</span></h3>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                    {debate.finalOutput.explanation}
                  </div>
                </div>

                {/* ── Actionable Advice (from Ollama) ── */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">🌿 Actionable Advice <span className="text-xs font-normal text-gray-400">(Fertilizer, Timing, Irrigation, etc.)</span></h3>
                  {debate.finalOutput.actionable_advice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-sky-700">🧪 Fertilizer</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{debate.finalOutput.actionable_advice.fertilizer}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-emerald-700">📅 Sowing Timing</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{debate.finalOutput.actionable_advice.sowing_timing}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-blue-700">💧 Irrigation</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{debate.finalOutput.actionable_advice.irrigation}</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-rose-700">📊 Market Timing</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{debate.finalOutput.actionable_advice.market_timing}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Carbon Credit Score (from Ollama) ── */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-gray-900">🌍 Carbon Credit Score <span className="text-xs font-normal text-gray-400">(Optional)</span></h3>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                    {(debate.finalOutput.carbon_credit || []).map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 w-28 truncate">{c.crop_name}</span>
                        <div className="flex-1 bg-white/60 rounded-full h-3 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 animate-fill" style={{ width: `${(c.score_out_of_10 || 0) * 10}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">{c.score_out_of_10}/10</span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 italic">{(debate.finalOutput.carbon_credit || [])[0]?.note || "Higher scores indicate better carbon sequestration potential."}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <p>Could not generate final output.</p>
                <button onClick={fetchFinalOutput} className="mt-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200">Retry</button>
              </div>
            )}
          </div>
        )}

        <footer className="text-center py-6 text-xs text-gray-400">
          {t.appName} &copy; 2026 | Ministry of Agriculture & Farmers Welfare, Government of India
        </footer>
      </main>
    </div>
  );
}
