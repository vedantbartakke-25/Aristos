import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { DebateProvider } from "./context/DebateContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MLAgentResults from "./pages/MLAgentResults";
import AIAgentChat from "./pages/AIAgentChat";

export default function App() {
  return (
    <LanguageProvider>
      <DebateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/results" element={<MLAgentResults />} />
            <Route path="/ai-agent" element={<AIAgentChat />} />
          </Routes>
        </BrowserRouter>
      </DebateProvider>
    </LanguageProvider>
  );
}
