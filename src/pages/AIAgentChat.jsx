import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import Navbar from "../components/Navbar";

export default function AIAgentChat() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { results, formData } = location.state || { results: [], formData: {} };
  
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Online");
  const [typingAgent, setTypingAgent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const outputRef = useRef(null);
  const wsRef = useRef(null);
  const messageQueueRef = useRef([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
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

    ws.onclose = () => addSystemMessage("Disconnected from server.");
    ws.onerror = () => addSystemMessage("Connection error.");

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { type: 'system', text }]);
  };

  const processQueue = async () => {
    if (isProcessing || messageQueueRef.current.length === 0) return;
    setIsProcessing(true);

    const data = messageQueueRef.current.shift();
    const displayName = data.sender || 'System';

    if (data.event === 'agent_dispatch') {
      setTypingAgent(displayName);
      setStatus(`${displayName.toLowerCase()} is thinking...`);
      setIsProcessing(false);
      processQueue();
      return;
    }

    if (data.event === 'agent_status') {
      setTypingAgent(null);
      setStatus("Online");
      setIsProcessing(false);
      processQueue();
      return;
    }

    if (displayName === 'System' || !data.text) {
      if (data.text) addSystemMessage(data.text);
      if (data.event === 'pipeline_end') {
        setIsRunning(false);
        setStatus("Pipeline complete");
      }
      setIsProcessing(false);
      processQueue();
      return;
    }

    // Agent message
    setTypingAgent(displayName);
    setStatus(`${displayName.toLowerCase()} is typing...`);
    await new Promise(r => setTimeout(r, 600));
    setTypingAgent(null);
    setStatus("Online");

    const isFarmer = displayName.includes('Farmer');
    const newMessage = {
      type: 'agent',
      sender: displayName,
      isFarmer,
      crop: data.crop,
      score: data.score,
      text: data.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Auto scroll
    if (outputRef.current) {
      setTimeout(() => {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }, 50);
    }

    await new Promise(r => setTimeout(r, 400));
    setIsProcessing(false);
    processQueue();
  };

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setMessages([]);
    addSystemMessage("Starting expert debate...");
    try {
      await fetch('http://localhost:8000/run', { method: 'POST' });
    } catch (err) {
      addSystemMessage('Error triggering pipeline: ' + err.message);
      setIsRunning(false);
    }
  };

  const getAgentColor = (name) => {
    if (name.includes('Trader')) return 'text-rose-600';
    if (name.includes('Analyst')) return 'text-amber-600';
    if (name.includes('Farmer')) return 'text-sky-600';
    return 'text-emerald-600';
  };

  return (
    <div className="flex flex-col h-screen bg-[#e0e0e0]">
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      <div className="flex-1 max-w-4xl w-full mx-auto bg-[#efeae2] relative shadow-2xl flex flex-col overflow-hidden border-x border-gray-300">
        {/* WhatsApp Style Header */}
        <div className="bg-[#008069] text-white p-3 flex items-center justify-between shadow-md z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-emerald-700 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🌱</div>
            <div>
              <h2 className="font-semibold text-base leading-tight">Agri-Advisor Group</h2>
              <p className="text-xs text-emerald-100 opacity-90">{status}</p>
            </div>
          </div>
          <button 
            onClick={runPipeline}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${isRunning ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-[#008069] hover:bg-emerald-50 active:scale-95 shadow-sm'}`}
          >
            {isRunning ? 'Running...' : 'Start Debate'}
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={outputRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-blend-multiply bg-[#efeae2]/95"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'system' ? 'justify-center' : (msg.isFarmer ? 'justify-end' : 'justify-start')} animate-fade-in`}>
              {msg.type === 'system' ? (
                <div className="bg-[#fff5c4] text-[#54656f] text-[12px] px-3 py-1 rounded-lg shadow-sm border border-yellow-100">
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm relative ${msg.isFarmer ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                  {!msg.isFarmer && (
                    <p className={`text-[13px] font-bold mb-0.5 ${getAgentColor(msg.sender)}`}>
                      {msg.sender}
                    </p>
                  )}
                  <div className="text-[14.5px] leading-relaxed text-[#111b21]">
                    {msg.crop && <p className="font-bold text-emerald-800">CROP: {msg.crop}</p>}
                    {msg.score && <p className="font-bold text-emerald-600">SCORE: {msg.score}/10</p>}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-1">{msg.timestamp}</p>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {typingAgent && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                </div>
                <span className="text-xs text-gray-400 italic">{typingAgent} is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
