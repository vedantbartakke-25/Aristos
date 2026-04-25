export default function FinalOutput({ t, recommendation }) {
  if (!recommendation) return null;

  const riskConfig = {
    low: {
      label: t.lowRisk,
      color: "text-green-700",
      bg: "bg-green-100",
      icon: (
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    moderate: {
      label: t.moderateRisk,
      color: "text-amber-700",
      bg: "bg-amber-100",
      icon: (
        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M12 2l10 18H2L12 2z" />
        </svg>
      ),
    },
    high: {
      label: t.highRisk,
      color: "text-red-700",
      bg: "bg-red-100",
      icon: (
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const risk = riskConfig[recommendation.riskLevel] || riskConfig.low;

  return (
    <section id="final-output" className="fade-in-up" style={{ animationDelay: "0.3s" }}>
      <div className="bg-white rounded-2xl shadow-xl shadow-green-200/50 border-2 border-green-400 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t.finalRecommendation}</h2>
        </div>
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-500 mb-2">{t.topRecommendedCrops}</p>
          <div className="flex flex-wrap gap-3">
            {recommendation.topCrops.map((crop, i) => (
              <div key={crop} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                <span className="font-bold text-green-800 text-lg">{crop}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">{t.explanation}</p>
          <p className="text-gray-700 leading-relaxed">{recommendation.explanation}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-500">{t.riskLevel}:</p>
          <div className={`flex items-center gap-1.5 ${risk.bg} px-3 py-1.5 rounded-full`}>
            {risk.icon}
            <span className={`font-semibold text-sm ${risk.color}`}>{risk.label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
