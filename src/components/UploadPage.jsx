import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../api/api";

// Limits (change if your team decides differently)
const MAX_SIZE_MB = 200;
const ALLOWED_EXTENSIONS = ["mp4", "avi", "jpg", "jpeg", "png"];

// Site zone choices
const zones = [
  { key: "welding", label: "Welding" },
  { key: "general", label: "General" },
  { key: "custom", label: "Custom" },
];

// Check the file before uploading. Returns an error message, or "" if fine.
function validateFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "This format isn't supported. Upload an MP4 or AVI file.";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File is too big. Maximum size is ${MAX_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return "";
}

// Cloud upload icon
function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#1d4f91" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18a5 5 0 0 1-.5-9.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z" />
      <path d="M12 21v-8M9 15l3-3 3 3" />
    </svg>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [zone, setZone] = useState("welding");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Called when a file is picked or dropped
  const chooseFile = (picked) => {
    if (!picked) return;
    const problem = validateFile(picked);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setError("");
    setProgress(0);
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");
    try {
      await uploadVideo(file, zone, setProgress);
      navigate("/videos"); // the Videos page shows the processing status
    } catch (err) {
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  };

  const sizeMb = file ? (file.size / (1024 * 1024)).toFixed(0) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h2 className="text-2xl font-medium">Upload video</h2>

      {/* Drop zone: drag a file here, or use the Browse button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) chooseFile(e.dataTransfer.files[0]);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center bg-white ${
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
        } ${uploading ? "opacity-60" : ""}`}
      >
        <div className="flex justify-center">
          <CloudIcon />
        </div>
        <p className="text-xl font-medium mt-3">Drop a video or image here</p>
        <p className="text-slate-500 mt-1">
          MP4, AVI, JPG or PNG, up to {MAX_SIZE_MB} MB
        </p>
        <button
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          className="mt-4 border border-slate-300 rounded-xl px-6 py-2 text-base hover:bg-slate-50 disabled:opacity-50"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.avi,.jpg,.jpeg,.png,video/*,image/*"
          className="hidden"
          onChange={(e) => {
            chooseFile(e.target.files[0]);
            e.target.value = ""; // lets you pick the same file again
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          {error}
        </div>
      )}

      {/* Selected file + progress bar */}
      {file && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium truncate">{file.name}</p>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-slate-500">{sizeMb} MB</span>
              {!uploading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="bg-slate-100 rounded-full h-2 mt-3">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {uploading && (
            <p className="text-sm text-slate-500 mt-1">Uploading... {progress}%</p>
          )}
        </div>
      )}

      {/* Site zone pills */}
      <div>
        <p className="text-slate-600 mb-2">Site zone</p>
        <div className="flex flex-wrap gap-2">
          {zones.map((z) => (
            <button
              key={z.key}
              onClick={() => setZone(z.key)}
              disabled={uploading}
              className={`px-5 py-2 rounded-full border text-base ${
                zone === z.key
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start analysis */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M7 5l12 7-12 7z" />
        </svg>
        {uploading ? "Uploading..." : "Start analysis"}
      </button>
    </div>
  );
}