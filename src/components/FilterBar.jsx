// Filter bar: video, date range, and a Clear button.
// (Status is now chosen with the pills on the dashboard.)
// It does not fetch anything. It only tells the parent what changed.
//   filters  = { video_id, from, to }
//   videos   = list of videos for the dropdown
//   onChange = (key, value) => ...
//   onClear  = () => ...
export default function FilterBar({ filters, videos, onChange, onClear }) {
  const inputClass =
    "border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-brand";

  // Show the Clear button only when at least one filter is active
  const hasFilters = Object.values(filters).some((value) => value);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
      {/* Video */}
      <label className="text-sm text-slate-600">
        Video
        <select
          className={`${inputClass} mt-1`}
          value={filters.video_id}
          onChange={(e) => onChange("video_id", e.target.value)}
        >
          <option value="">All videos</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.filename}
            </option>
          ))}
        </select>
      </label>

      {/* From date */}
      <label className="text-sm text-slate-600">
        From
        <input
          type="date"
          className={`${inputClass} mt-1`}
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => onChange("from", e.target.value)}
        />
      </label>

      {/* To date */}
      <label className="text-sm text-slate-600">
        To
        <input
          type="date"
          className={`${inputClass} mt-1`}
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => onChange("to", e.target.value)}
        />
      </label>

      {/* Clear */}
      <button
        onClick={onClear}
        disabled={!hasFilters}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Clear filters
      </button>
    </div>
  );
}