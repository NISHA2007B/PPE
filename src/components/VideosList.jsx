import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";
import { getVideos, getVideoStatus } from "../api/api";

// Poll every 3 seconds (3000 ms)
const POLL_INTERVAL = 3000;

// Status badge styles and labels
const badgeStyles = {
  uploaded: "bg-slate-100 text-slate-600",
  processing: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const badgeLabels = {
  uploaded: "Uploaded",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

// 1890 -> "1,890"
const number = (n) => Number(n || 0).toLocaleString();

// One video card
function VideoCard({ video }) {
  const { filename, status, progress, frame, total_frames, workers, violations, error, uploaded_at } =
    video;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-4 space-y-3 ${
        status === "failed" ? "border border-red-200" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-medium truncate">{filename}</p>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${badgeStyles[status] || badgeStyles.uploaded}`}
        >
          {badgeLabels[status] || status}
        </span>
      </div>

      {/* Waiting to start */}
      {status === "uploaded" && (
        <p className="text-slate-500 text-sm">
          Uploaded {new Date(uploaded_at).toLocaleString()}. Waiting to start...
        </p>
      )}

      {/* Processing: blue progress bar */}
      {status === "processing" && (
        <div>
          <div className="bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
          <p className="text-slate-500 mt-2">
            {progress || 0}%
            {total_frames ? ` · frame ${number(frame)} of ${number(total_frames)}` : ""}
          </p>
        </div>
      )}

      {/* Done: counts and a link */}
      {status === "done" && (
        <>
          <p className="text-slate-500">
            {workers !== undefined ? `${number(workers)} workers · ` : ""}
            {number(violations)} violations
          </p>
          <Link
            to={`/violations?video_id=${video.id}`}
            className="block text-center border border-slate-200 rounded-xl py-3 text-base hover:bg-slate-50"
          >
            View violations
          </Link>
        </>
      )}

      {/* Failed: the reason */}
      {status === "failed" && (
        <p className="text-slate-600">{error || "Processing failed. Please upload again."}</p>
      )}
    </div>
  );
}

export default function VideosList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always holds the latest videos, so the timer never reads old data
  const videosRef = useRef([]);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Load the video list
  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVideos();
      setVideos(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Polling: every 3 seconds, ask the API for videos that are not finished yet
  useEffect(() => {
    const timer = setInterval(async () => {
      const unfinished = videosRef.current.filter(
        (v) => v.status !== "done" && v.status !== "failed"
      );
      if (unfinished.length === 0) return; // nothing to check

      // A failed request returns null, so one bad call does not break the rest
      const results = await Promise.all(
        unfinished.map((v) => getVideoStatus(v.id).catch(() => null))
      );

      // Merge the new info into the matching videos
      setVideos((prev) =>
        prev.map((v) => {
          const r = results.find((x) => x && x.id === v.id);
          return r ? { ...v, ...r } : v;
        })
      );
    }, POLL_INTERVAL);

    // Cleanup: stop the timer when leaving this page
    return () => clearInterval(timer);
  }, []);

  // Newest upload first
  const sorted = [...videos].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">Videos</h2>
        <Link
          to="/upload"
          className="bg-black text-white px-5 py-2 rounded-xl text-sm hover:bg-slate-800"
        >
          + Upload video
        </Link>
      </div>

      {/* 1. Loading */}
      {loading && <Spinner />}

      {/* 2. Error with Retry */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
          <span>Could not load videos: {error}</span>
          <button
            onClick={loadVideos}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty */}
      {!loading && !error && videos.length === 0 && (
        <p className="text-center text-slate-500 py-12">No videos uploaded yet</p>
      )}

      {/* 4. Cards */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}