export default function MLResults({ t, results }) {
  if (!results || results.length === 0) return null;

  const getBarColor = (score) => {
    if (score >= 90) return "from-green-400 to-green-500";
    if (score >= 80) return "from-emerald-400 to-emerald-500";
    if (score >= 70) return "from-yellow-400 to-amber-500";
    return "from-orange-400 to-orange-500";
  };

  const getBgColor = (score) => {
    if (score >= 90) return "bg-green-50";
    if (score >= 80) return "bg-emerald-50";
    if (score >= 70) return "bg-yellow-50";
    return "bg-orange-50";
  };

  return (
    <section id="ml-results" className="fade-in-up" style={{ animationDelay: "0.1s" }}>
      <div className="bg-white rounded-2xl shadow-lg shadow-green-100/50 border border-green-50 p-6 sm:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t.mlResults}</h2>
        </div>

        {/* Crop Bars */}
        <div className="space-y-4">
          {results.map((crop, index) => (
            <div key={crop.name} className={`${getBgColor(crop.score)} rounded-xl p-4 transition-all hover:scale-[1.01]`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-800">{crop.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{crop.score}%</span>
              </div>
              <div className="w-full bg-gray-200/60 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getBarColor(crop.score)} animate-fill`}
                  style={{ width: `${crop.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
