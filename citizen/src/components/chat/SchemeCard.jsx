export function SchemeCard({ data }) {
  let schemeData = {};
  try {
    schemeData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Failed to parse scheme data:', e);
    return null;
  }

  return (
    <div className="rounded-lg border border-line bg-paper shadow-sm overflow-hidden my-2 max-w-sm">
      <div className="bg-forest px-4 py-3 text-white">
        <h3 className="font-semibold text-lg leading-tight">{schemeData.name || 'Government Scheme'}</h3>
        {schemeData.sector && <span className="text-xs opacity-80 uppercase tracking-wide">{schemeData.sector}</span>}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <p className="text-sm text-ink-2">{schemeData.description}</p>
        
        {schemeData.benefits && (
          <div className="bg-sand px-3 py-2 rounded text-sm text-ink-2 border border-line">
            <strong className="text-ink text-xs uppercase tracking-wider block mb-1">Benefits</strong>
            {schemeData.benefits}
          </div>
        )}

        <button className="mt-2 w-full py-2 bg-ocean text-white rounded font-medium hover:bg-ocean/90 transition-colors">
          Check Eligibility & Apply
        </button>
      </div>
    </div>
  );
}
