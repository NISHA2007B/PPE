import { Link } from "react-router-dom";
import { getSeverity, severityStyles } from "../utils/severity";

// Soft colors for each PPE chip
const chipColors = {
  helmet: "bg-red-100 text-red-700",
  vest: "bg-orange-100 text-orange-700",
  gloves: "bg-red-100 text-red-700",
  goggles: "bg-amber-100 text-amber-800",
  boots: "bg-purple-100 text-purple-700",
};

// Colors and labels for the status badge
const statusColors = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed ✓",
  rejected: "Rejected ✕",
};

// "welding" -> "Welding"
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function ViolationCard({ violation, onConfirm, onReject, onView }) {
  const { id, missing_ppe, confidence, snapshot_path, status, created_at, track_id, zone } =
    violation;

  const severity = getSeverity(violation);
  const percent = (confidence * 100).toFixed(0);
  const time = new Date(created_at).toLocaleString();

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Snapshot with the "ID 7 · 84%" tag */}
      <div className="relative bg-slate-700">
        <img
          src={snapshot_path}
          alt={`Violation ${id}`}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onView && onView(violation)}
        />
        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-md">
          ID {track_id} · {percent}%
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Worker + zone, severity badge */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-medium">
            Worker {track_id}
            {zone ? ` · ${capitalize(zone)}` : ""}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${severityStyles[severity]}`}
          >
            {severity}
          </span>
        </div>

        {/* Missing PPE chips */}
        <div className="flex flex-wrap gap-2">
          {missing_ppe.map((item) => (
            <span
              key={item}
              className={`px-3 py-1 rounded-full text-sm capitalize ${chipColors[item]}`}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Time + status */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{time}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        {/* Buttons: disabled once a decision is made */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onConfirm && onConfirm(id)}
            disabled={status !== "pending"}
            className="py-2 rounded-xl bg-green-100 text-green-800 border border-green-300 font-medium hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-100"
          >
            ✓ Confirm
          </button>
          <button
            onClick={() => onReject && onReject(id)}
            disabled={status !== "pending"}
            className="py-2 rounded-xl bg-red-100 text-red-800 border border-red-300 font-medium hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
          >
            ✕ Reject
          </button>
        </div>

        <Link
          to={`/violations/${id}`}
          className="block text-center text-sm text-blue-700 hover:underline"
        >
          Open review screen
        </Link>
      </div>
    </div>
  );
}