import { useState } from "react";

const LANGUAGES = ["EN", "HI", "MR"];

export default function Navbar({ lang, setLang, t }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M15.91 11.672a3.99 3.99 0 00-1.582-1.582M12 8a4 4 0 110 8 4 4 0 010-8z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
            {t.appName}
          </h1>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-green-50 rounded-full p-1 border border-green-200">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                lang === l
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-green-700 hover:bg-green-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
