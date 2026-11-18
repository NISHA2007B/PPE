import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ViolationCard from "./ViolationCard";
import SnapshotViewer from "./SnapshotViewer";
import FilterBar from "./FilterBar";
import Spinner from "./Spinner";
import Toast from "./Toast";
import {
  getViolations,
  getVideos,
  getStats,
  updateViolationStatus,
  exportCsv,
  downloadReport,
} from "../api/api";
import { getSeverity, severityRank } from "../utils/severity";

// Status pills above the list
const pills = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected", label: "Rejected" },
];

// One number card
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-slate-600">{label}</p>
      <p className={`text-4xl font-medium mt-1 ${color}`}>{value}</p>
    </div>
  );
}

// Small icons for the bottom buttons
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export default function ViolationsList() {
  const [violations, setViolations] = useState([]); // everything loaded (before the status pill)
  const [videos, setVideos] = useState([]);         // for the video dropdown
  const [workersSeen, setWorkersSeen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Everything is stored in the URL, e.g. /violations?video_id=1&status=pending&sort=severity
  const [searchParams, setSearchParams] = useSearchParams();

  // These 3 go to the server. The status pill is applied in the browser.
  const filters = {
    video_id: searchParams.get("video_id") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
  };
  const filterKey = JSON.stringify(filters); // changes only when these filters change
  const hasServerFilters = Object.values(filters).some((value) => value);
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";

  // Set one URL value (empty value removes it)
  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  // Remove the video and date filters (status and sort stay)
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    ["video_id", "from", "to"].forEach((key) => next.delete(key));
    setSearchParams(next);
  };

  const loadViolations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getViolations(filters);
      setViolations(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Load on page open, and again whenever video / date filters change
  useEffect(() => {
    loadViolations();
  }, [filterKey]);

  // Load the video list and the stats once. If they fail, the page still works.
  useEffect(() => {
    getVideos()
      .then(setVideos)
      .catch(() => {});
    getStats()
      .then((data) => setWorkersSeen(data.workers_seen))
      .catch(() => setWorkersSeen(null));
  }, []);

  // ----- Numbers for the cards -----
  // Rejected = false alarm, so it is not counted as a violation
  const counted = violations.filter((v) => v.status !== "rejected");
  const flaggedWorkers = new Set(counted.map((v) => `${v.video_id}-${v.track_id}`)).size;
  const pending = violations.filter((v) => v.status === "pending").length;

  // Total workers is for ALL videos, so it only makes sense without video/date filters
  const canShowWorkers = !hasServerFilters && workersSeen > 0;
  const compliance = canShowWorkers
    ? Math.max(0, Math.round(((workersSeen - flaggedWorkers) / workersSeen) * 100))
    : null;

  // ----- List: status pill, then sort -----
  const visible = violations
    .filter((v) => !status || v.status === status)
    .sort((a, b) => {
      if (sort === "severity") {
        const diff = severityRank[getSeverity(b)] - severityRank[getSeverity(a)];
        if (diff !== 0) return diff;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Change one violation's status in local state
  const updateStatus = (id, newStatus) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  // Confirm / Reject: update the screen first, then tell the server.
  // If the server fails, go back to the old status and show an error.
  const changeStatus = async (id, newStatus) => {
    const oldStatus = violations.find((v) => v.id === id)?.status;
    updateStatus(id, newStatus); // instant update

    try {
      await updateViolationStatus(id, newStatus);
    } catch (err) {
      updateStatus(id, oldStatus); // revert
      setToast(`Could not save: ${err.message}`);
    }
  };

  // Export and report follow the video, date AND status pill
  const exportFilters = { ...filters, status };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv(exportFilters);
    } catch (err) {
      setToast(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      await downloadReport(exportFilters);
    } catch (err) {
      setToast(`Report failed: ${err.message}`);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2">
        <StatCard
          label="Workers seen"
          value={canShowWorkers ? workersSeen : "—"}
          color="text-slate-900"
        />
        <StatCard
          label="Compliance"
          value={compliance === null ? "—" : `${compliance}%`}
          color="text-green-700"
        />
        <StatCard
          label="Violations"
          value={loading ? "—" : counted.length}
          color="text-red-800"
        />
        <StatCard
          label="Pending review"
          value={loading ? "—" : pending}
          color="text-amber-700"
        />
      </div>

      {/* Status pills + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => (
            <button
              key={p.key}
              onClick={() => setParam("status", p.key)}
              className={`px-5 py-2 rounded-full border text-base ${
                status === p.key
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="text-sm text-slate-600 flex items-center gap-2">
          Sort by
          <select
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="severity">Severity (High first)</option>
          </select>
        </label>
      </div>

      <FilterBar
        filters={filters}
        videos={videos}
        onChange={setParam}
        onClear={clearFilters}
      />

      {/* 1. Loading */}
      {loading && <Spinner />}

      {/* 2. Error with Retry */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
          <span>Could not load violations: {error}</span>
          <button
            onClick={loadViolations}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty */}
      {!loading && !error && visible.length === 0 && (
        <p className="text-center text-slate-500 py-12">
          {violations.length === 0
            ? "No violations found"
            : `No ${status} violations`}
        </p>
      )}

      {/* 4. Cards */}
      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((v) => (
            <ViolationCard
              key={v.id}
              violation={v}
              onView={setSelected}
              onConfirm={(id) => changeStatus(id, "confirmed")}
              onReject={(id) => changeStatus(id, "rejected")}
            />
          ))}
        </div>
      )}

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl py-3 text-base hover:bg-slate-50 disabled:opacity-50"
        >
          <DownloadIcon />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
        <button
          onClick={handleReport}
          disabled={reporting}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl py-3 text-base hover:bg-slate-50 disabled:opacity-50"
        >
          <DocIcon />
          {reporting ? "Preparing..." : "PDF report"}
        </button>
      </div>

      <SnapshotViewer violation={selected} onClose={() => setSelected(null)} />
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}