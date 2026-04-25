import { createContext, useContext, useState, useRef } from "react";

const DebateContext = createContext();

export function DebateProvider({ children }) {
  const [debateStatus, setDebateStatus] = useState("idle"); // idle | running | complete
  const [debateMessages, setDebateMessages] = useState([]);
  const [agentSummaries, setAgentSummaries] = useState({ Farmer: [], Trader: [], Analyst: [] });
  const [finalOutput, setFinalOutput] = useState(null);
  const [finalOutputLoading, setFinalOutputLoading] = useState(false);
  const [debateStartTime, setDebateStartTime] = useState(null);
  const [resultsData, setResultsData] = useState(null); // { results, formData }
  const wsRef = useRef(null);

  const reset = () => {
    setDebateStatus("idle");
    setDebateMessages([]);
    setAgentSummaries({ Farmer: [], Trader: [], Analyst: [] });
    setFinalOutput(null);
    setFinalOutputLoading(false);
    setDebateStartTime(null);
    setResultsData(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <DebateContext.Provider value={{
      debateStatus, setDebateStatus,
      debateMessages, setDebateMessages,
      agentSummaries, setAgentSummaries,
      finalOutput, setFinalOutput,
      finalOutputLoading, setFinalOutputLoading,
      debateStartTime, setDebateStartTime,
      resultsData, setResultsData,
      wsRef,
      reset,
    }}>
      {children}
    </DebateContext.Provider>
  );
}

export function useDebate() {
  const context = useContext(DebateContext);
  if (!context) throw new Error("useDebate must be used within DebateProvider");
  return context;
}
