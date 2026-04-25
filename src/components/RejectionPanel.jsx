export default function RejectionPanel({ t, rejectedCrops }) {
  if (!rejectedCrops || rejectedCrops.length === 0) return null;

  return (
    <section id="rejection-panel" className="fade-in-up" style={{ animationDelay: "0.4s" }}>
      <div className="bg-white rounded-2xl shadow-lg shadow-green-100/50 border border-green-50 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t.rejectedCrops}</h2>
        </div>
        <div className="space-y-3">
          {rejectedCrops.map((crop) => (
            <div key={crop.name} className="flex items-start gap-3 bg-red-50/60 border border-red-100 rounded-xl p-3.5">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <span className="font-semibold text-gray-800">{crop.name}</span>
                <p className="text-sm text-gray-500 mt-0.5">{t.reason}: {crop.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
