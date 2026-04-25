import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useDebate } from "../context/DebateContext";
import Navbar from "../components/Navbar";

export default function AIAgentChat() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const debate = useDebate();

  const navState = location.state || {};
  const results = navState.results || debate.resultsData?.results || [];
  const formData = navState.formData || debate.resultsData?.formData || {};

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [typingAgent, setTypingAgent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const outputRef = useRef(null);
  const wsRef = useRef(null);
  const messageQueueRef = useRef([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("Online");
      addSystemMessage("Connected to AgriAdvisor network.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageQueueRef.current.push(data);
        processQueue();
      } catch (e) {
        addSystemMessage(event.data);
      }
    };

    ws.onclose = () => {
      setStatus("Offline");
      addSystemMessage("Disconnected from server.");
    };
    ws.onerror = () => addSystemMessage("Connection error.");

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  const addSystemMessage = (text) => {
    setMessages((prev) => [...prev, { type: "system", text }]);
  };

  const processQueue = async () => {
    if (isProcessing || messageQueueRef.current.length === 0) return;
    setIsProcessing(true);

    const data = messageQueueRef.current.shift();
    const displayName = data.sender || "System";

    if (data.event === "agent_dispatch") {
      setTypingAgent(displayName);
      setStatus(`${displayName} is thinking...`);
      setIsProcessing(false);
      processQueue();
      return;
    }

    if (data.event === "agent_status") {
      setTypingAgent(null);
      setStatus("Online");
      setIsProcessing(false);
      processQueue();
      return;
    }

    if (displayName === "System" || !data.text) {
      if (data.text) addSystemMessage(data.text);
      if (data.event === "pipeline_end") {
        setIsRunning(false);
        setStatus("Debate complete");
      }
      setIsProcessing(false);
      processQueue();
      return;
    }

    setTypingAgent(displayName);
    setStatus(`${displayName} is typing...`);
    await new Promise((r) => setTimeout(r, 400));
    setTypingAgent(null);
    setStatus("Online");

    setMessages((prev) => [
      ...prev,
      {
        type: "agent",
        sender: displayName,
        crop: data.crop,
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    if (outputRef.current) {
      setTimeout(() => { outputRef.current.scrollTop = outputRef.current.scrollHeight; }, 50);
    }

    await new Promise((r) => setTimeout(r, 300));
    setIsProcessing(false);
    processQueue();
  };

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setMessages([]);
    addSystemMessage("Starting expert debate...");
    try {
      await fetch("http://localhost:8000/run", { method: "POST" });
    } catch (err) {
      addSystemMessage("Error triggering pipeline: " + err.message);
      setIsRunning(false);
    }
  };

  const getAgentStyle = (name) => {
    if (name.includes("Farmer")) return { icon: "🌾", color: "border-l-sky-500", bg: "bg-sky-50", label: "text-sky-700" };
    if (name.includes("Trader")) return { icon: "📈", color: "border-l-rose-500", bg: "bg-rose-50", label: "text-rose-700" };
    if (name.includes("Analyst")) return { icon: "🔬", color: "border-l-amber-500", bg: "bg-amber-50", label: "text-amber-700" };
    return { icon: "🤖", color: "border-l-gray-500", bg: "bg-gray-50", label: "text-gray-700" };
  };

  const statusDot = status === "Online" || status === "Debate complete" ? "bg-green-400" : status === "Offline" ? "bg-red-400" : "bg-amber-400 animate-pulse";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F9F5" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">🌱</div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">AI Expert Debate</h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            </div>
          </div>
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isRunning ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-95"}`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Running...
              </span>
            ) : "🚀 Start Debate"}
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: "500px" }}>
          <div
            ref={outputRef}
            className="flex-1 p-5 overflow-y-auto space-y-3"
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-gray-400 py-16">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">💬</div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-gray-300">Click "Start Debate" to begin the AI expert discussion</p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="fade-in-up" style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>
                {msg.type === "system" ? (
                  <div className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 text-xs px-4 py-1.5 rounded-full font-medium">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  (() => {
                    const style = getAgentStyle(msg.sender);
                    return (
                      <div className={`${style.bg} border border-gray-100 border-l-4 ${style.color} rounded-xl p-4 max-w-[90%]`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{style.icon}</span>
                          <span className={`font-bold text-sm ${style.label}`}>{msg.sender}</span>
                          {msg.crop && (
                            <span className="bg-white text-xs px-2 py-0.5 rounded-full border border-gray-200 font-medium text-gray-600">
                              🌱 {msg.crop}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-gray-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    );
                  })()
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {typingAgent && (
              <div className="fade-in-up">
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 inline-flex items-center gap-3 max-w-[300px]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{typingAgent} is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-2">
          Powered by Gemma3 · 3 Expert Agents · Real-time Internet Research
        </div>
      </main>
    </div>
  );
}
