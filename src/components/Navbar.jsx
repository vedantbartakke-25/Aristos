import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  useEffect(() => {
    // We attach the init function globally
    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,ta,te,kn,gu,bn,pa",
            // Using literal 1 for SIMPLE layout to prevent undefined enum errors
            layout: 1, 
          },
          "google_translate_element"
        );
      } catch (err) {
        console.error("Google Translate Init Error:", err);
      }
    };

    const scriptId = "google-translate-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // Script is already in the document. We need to manually initialize it
      // if we've navigated to this component and it remounted.
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        // Clear any broken half-rendered content
        const el = document.getElementById("google_translate_element");
        if (el) el.innerHTML = "";
        window.googleTranslateElementInit();
      }
    } else {
      // Inject the script
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">{t.appName}</h1>
        </div>

        {/* Right side: Google Translate + Logout */}
        <div className="flex items-center gap-3">
          {/* Google Translate Widget */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="google_translate_element"
              className="text-xs font-semibold text-gray-500 hidden sm:block"
            >
              {/* Globe icon */}
              <svg
                className="w-4 h-4 inline-block mr-1 -mt-0.5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Select Language
            </label>
            <div id="google_translate_element" className="google-translate-container"></div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t.logout}
          </button>
        </div>
      </div>
    </nav>
  );
}
