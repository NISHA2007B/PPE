import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Spinner from "./Spinner";
import { getViolations, getVideos } from "../api/api";

// Colors for the "By missing PPE" bars
const ppeColors = {
  helmet: "#e5484d",
  vest: "#f0a030",
  gloves: "#3b82d6",
  goggles: "#14b8a6",
  boots: "#8b5cf6",
};

const BAR_COLOR = "#86b6e8"; // normal bars
const PEAK_COLOR = "#e5484d"; // the busiest bar

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Turn a created_at string into a bucket key and a label.
// created_at looks like "2026-11-11T09:15:00"
function bucketOf(createdAt, group) {
  if (group === "day") {
    const day = createdAt.slice(0, 10); // 2026-11-11
    return { key: day, label: day };
  }
  const hour = createdAt.slice(0, 13); // 2026-11-11T09
  return { key: hour, label: `${createdAt.slice(5, 10)} ${createdAt.slice(11, 13)}:00` };
}

// Count violations per bucket, oldest first
function buildChartData(violations, group) {
  const buckets = {};
  violations.forEach((v) => {
    const { key, label } = bucketOf(v.created_at, group);
    if (!buckets[key]) buckets[key] = { key, label, count: 0 };
    buckets[key].count += 1;
  });
  return Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
}

export default function TimelineView() {
  const [violations, setViolations] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoId, setVideoId] = useState("");   // "" = all videos
  const [group, setGroup] = useState("hour");   // "hour" or "day"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getViolations({ video_id: videoId });
      // Rejected = false alarm, so it is not counted (same as the dashboard)
      setViolations(data.filter((v) => v.status !== "rejected"));
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Reload when the video filter changes
  useEffect(() => {
    loadData();
  }, [videoId]);

  // Video list for the dropdown (once)
  useEffect(() => {
    getVideos()
      .then(setVideos)
      .catch(() => {});
  }, []);

  const chartData = buildChartData(violations, group);

  // The busiest bucket is shown in red
  const peak = chartData.reduce((best, d) => (d.count > best ? d.count : best), 0);
  const peakKey = chartData.find((d) => d.count === peak)?.key;

  // Count by missing PPE type, most common first
  const byType = {};
  violations.forEach((v) => {
    v.missing_ppe.forEach((item) => {
      byType[item] = (byType[item] || 0) + 1;
    });
  });
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = typeRows.length ? typeRows[0][1] : 1;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h2 className="text-2xl font-medium">Insights</h2>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-end gap-4">
        <label className="text-sm text-slate-600">
          Video
          <select
            className="block mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          >
            <option value="">All videos</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.filename}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm text-slate-600 mb-1">Group by</p>
          <div className="flex gap-2">
            {["hour", "day"].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`px-4 py-2 rounded-full border text-sm capitalize ${
                  group === g
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Loading */}
      {loading && <Spinner />}

      {/* 2. Error with Retry */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
          <span>Could not load data: {error}</span>
          <button
            onClick={loadData}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty */}
      {!loading && !error && chartData.length === 0 && (
        <p className="text-center text-slate-500 py-12">No violations to show</p>
      )}

      {/* 4. Charts */}
      {!loading && !error && chartData.length > 0 && (
        <>
          {/* Violations over time */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-medium mb-3">Violations over time</h3>
            {/* ResponsiveContainer needs a parent with a fixed height */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#e2e2de" }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <Tooltip cursor={{ fill: "#f4f4f1" }} />
                  <Bar dataKey="count" name="Violations" radius={[6, 6, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.key} fill={d.key === peakKey ? PEAK_COLOR : BAR_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By missing PPE */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-lg font-medium mb-4">By missing PPE</h3>
            <div className="space-y-3">
              {typeRows.map(([item, count]) => (
                <div key={item} className="flex items-center gap-4">
                  <span className="w-20">{capitalize(item)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${(count / maxType) * 100}%`,
                        backgroundColor: ppeColors[item] || "#64748b",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}