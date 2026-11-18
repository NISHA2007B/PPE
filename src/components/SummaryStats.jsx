import { getSeverity, severityStyles } from "../utils/severity";

// Small number card
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// Summary panel: totals, by status, by severity, by missing PPE type.
// It counts the violations it receives (so it follows the current filters).
export default function SummaryStats({ violations }) {
  const total = violations.length;

  // Count by status
  const byStatus = { pending: 0, confirmed: 0, rejected: 0 };
  // Count by severity
  const bySeverity = { High: 0, Medium: 0, Low: 0 };
  // Count by missing PPE type
  const byType = {};

  violations.forEach((v) => {
    if (byStatus[v.status] !== undefined) byStatus[v.status] += 1;
    bySeverity[getSeverity(v)] += 1;
    v.missing_ppe.forEach((item) => {
      byType[item] = (byType[item] || 0) + 1;
    });
  });

  // Most common missing item first
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = typeRows.length ? typeRows[0][1] : 1;

  return (
    <div className="mb-4 space-y-4">
      {/* Number cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total violations" value={total} color="text-slate-900" />
        <StatCard label="Pending" value={byStatus.pending} color="text-slate-600" />
        <StatCard label="Confirmed" value={byStatus.confirmed} color="text-green-600" />
        <StatCard label="Rejected" value={byStatus.rejected} color="text-red-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By severity */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">By severity</h3>
          <div className="flex gap-2 flex-wrap">
            {["High", "Medium", "Low"].map((level) => (
              <span
                key={level}
                className={`px-3 py-1 rounded-full text-sm font-medium ${severityStyles[level]}`}
              >
                {level}: {bySeverity[level]}
              </span>
            ))}
          </div>
        </div>

        {/* By missing PPE type (simple bars) */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">By missing PPE</h3>
          {typeRows.length === 0 ? (
            <p className="text-sm text-slate-500">No data</p>
          ) : (
            <div className="space-y-2">
              {typeRows.map(([item, count]) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="w-16 capitalize">{item}</span>
                  <div className="flex-1 bg-slate-100 rounded h-3">
                    <div
                      className="bg-blue-600 h-3 rounded"
                      style={{ width: `${(count / maxType) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}