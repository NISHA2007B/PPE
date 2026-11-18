import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Spinner from "./Spinner";
import Toast from "./Toast";
import { getViolation, updateViolationStatus } from "../api/api";

// ASSUMED video speed, used to turn a frame number into a time like 00:42
const FPS = 30;

const formatTime = (frame) => {
  const totalSeconds = Math.floor((frame || 0) / FPS);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Status badge (shown next to the title)
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

// One row in the details card: label on the left, value on the right
function Row({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function ReviewScreen() {
  const { id } = useParams();
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  const loadViolation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getViolation(id);
      setViolation(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolation();
  }, [id]);

  // Confirm / Reject: update the screen first, save to server, revert if it fails
  const changeStatus = async (newStatus) => {
    const oldStatus = violation.status;
    setViolation((prev) => ({ ...prev, status: newStatus })); // instant update

    try {
      await updateViolationStatus(violation.id, newStatus);
    } catch (err) {
      setViolation((prev) => ({ ...prev, status: oldStatus })); // revert
      setToast(`Could not save: ${err.message}`);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
          <span>Could not load violation: {error}</span>
          <button
            onClick={loadViolation}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { missing_ppe, confidence, snapshot_path, clip_path, status, track_id, frame_number, zone } =
    violation;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <Link to="/violations" className="text-sm text-blue-700 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-medium">Review violation</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Clip (or the snapshot if there is no clip yet) */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {clip_path ? (
          <video src={clip_path} controls className="w-full bg-[#45483f] max-h-96" />
        ) : (
          <img
            src={snapshot_path}
            alt="Snapshot"
            className="w-full bg-[#45483f] max-h-96 object-contain"
          />
        )}
        <p className="px-4 py-3 text-slate-500">
          {clip_path ? "5 s clip around the event" : "No clip yet. Showing the snapshot."}
        </p>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-2 divide-y divide-slate-100">
        <Row label="Worker" value={`ID ${track_id}`} />
        {zone && <Row label="Zone" value={capitalize(zone)} />}
        <Row label="Time" value={formatTime(frame_number)} />
        <Row
          label="Missing"
          value={capitalize(missing_ppe.join(", "))}
          valueClass="text-red-800"
        />
        <Row label="Confidence" value={`${(confidence * 100).toFixed(0)}%`} />
      </div>

      {/* Confirm / Reject */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => changeStatus("confirmed")}
          disabled={status !== "pending"}
          className="py-4 rounded-2xl bg-green-100 text-green-800 border border-green-300 text-lg font-medium hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-100"
        >
          ✓ Confirm
        </button>
        <button
          onClick={() => changeStatus("rejected")}
          disabled={status !== "pending"}
          className="py-4 rounded-2xl bg-red-100 text-red-800 border border-red-300 text-lg font-medium hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
        >
          ✕ Reject
        </button>
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}