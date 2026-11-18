import { useEffect } from "react";
import { getSeverity, severityStyles } from "../utils/severity";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Popup that shows the big snapshot of one violation.
// Closes on the Esc key, a click outside the box, or the X button.
export default function SnapshotViewer({ violation, onClose }) {
  // Listen for the Esc key while the popup is open
  useEffect(() => {
    if (!violation) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Cleanup: remove the listener when the popup closes
    return () => window.removeEventListener("keydown", handleKey);
  }, [violation, onClose]);

  // Nothing selected = nothing to show
  if (!violation) return null;

  const severity = getSeverity(violation);

  return (
    // Dark background. Clicking it closes the popup
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      {/* stopPropagation: clicking inside the box should NOT close it */}
      <div
        className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h3 className="text-lg font-medium">
            Worker {violation.track_id}
            {violation.zone ? ` · ${capitalize(violation.zone)}` : ""}
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${severityStyles[severity]}`}
            >
              {severity}
            </span>
            <button
              onClick={onClose}
              className="text-2xl leading-none px-2 text-slate-400 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <img
          src={violation.snapshot_path}
          alt={`Violation ${violation.id}`}
          className="w-full max-h-[65vh] object-contain bg-[#45483f]"
        />

        <div className="px-5 py-4 text-slate-600">
          Missing: {violation.missing_ppe.map(capitalize).join(", ")} · Frame{" "}
          {violation.frame_number} · Confidence {(violation.confidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}