// Severity of each missing PPE item. Change here if your team decides differently.
const ppeSeverity = {
  helmet: "High",
  vest: "Medium",
  goggles: "Medium",
  gloves: "Low",
  boots: "Low",
};

// Higher number = more serious (used for sorting)
export const severityRank = { High: 3, Medium: 2, Low: 1 };

// Soft badge colors for each level
export const severityStyles = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-yellow-100 text-yellow-800",
};

// A violation's severity = the highest severity among its missing items
export function getSeverity(violation) {
  let best = "Low";
  (violation.missing_ppe || []).forEach((item) => {
    const level = ppeSeverity[item] || "Low";
    if (severityRank[level] > severityRank[best]) best = level;
  });
  return best;
}