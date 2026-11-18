import { dummyViolations } from "../data/dummyViolations";

// Backend address (Person C's Flask server)
const BASE_URL = "http://localhost:5000";

// true = dummy data, false = real backend
const USE_DUMMY = true;

// Testing only: true makes every confirm/reject FAIL, so you can see the revert + error toast
const SIMULATE_FAIL = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Turn { video_id: 1, status: "" } into "video_id=1" (empty filters are skipped)
function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  return params.toString();
}

// Save a Blob as a file in the browser
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------- Dummy videos ----------
// Extra fields (progress, frame, total_frames, workers, violations, error) are
// ASSUMED. Ask Person C to return them from GET /videos.
const dummyVideos = [
  { id: 1, filename: "site_cam1.mp4", status: "done", uploaded_at: "2026-11-11T09:00:00", workers: 24 },
  { id: 2, filename: "welding_area.mp4", status: "done", uploaded_at: "2026-11-11T10:00:00", workers: 18 },
  { id: 3, filename: "site_cam2.mp4", status: "processing", uploaded_at: "2026-11-18T09:30:00", progress: 63, frame: 1890, total_frames: 3000 },
  { id: 4, filename: "night_shift.mov", status: "failed", uploaded_at: "2026-11-18T09:35:00", error: "This format isn't supported. Upload an MP4 or AVI file." },
];

// Add the violation count of finished dummy videos
function withCounts(video) {
  if (video.status !== "done") return { ...video };
  return {
    ...video,
    violations: dummyViolations.filter((v) => v.video_id === video.id).length,
  };
}

// ---------- Dummy rules (zone -> required PPE) ----------
let dummyRules = {
  zone_welding: ["helmet", "goggles", "gloves"],
  zone_general: ["helmet", "vest"],
};

// ---------- Dummy detection settings ----------
let dummySettings = { confidence_threshold: 0.5, min_frames: 15 };

// ---------- Stats ----------
// ASSUMED endpoint: GET /stats -> { workers_seen: 42 }  (confirm with Person C)
export async function getStats() {
  if (USE_DUMMY) {
    await wait(400);
    return { workers_seen: 42 };
  }

  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// ---------- Violations ----------
// filters example: { video_id: 1, status: "pending", from: "2026-11-01", to: "2026-11-30" }
export async function getViolations(filters = {}) {
  if (USE_DUMMY) {
    await wait(800);
    return dummyViolations.filter((v) => {
      if (filters.video_id && v.video_id !== Number(filters.video_id)) return false;
      if (filters.status && v.status !== filters.status) return false;
      // created_at looks like "2026-11-11T09:15:00", first 10 characters = the date
      const day = v.created_at.slice(0, 10);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      return true;
    });
  }

  const res = await fetch(`${BASE_URL}/violations?${buildQuery(filters)}`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// Get ONE violation by id
export async function getViolation(id) {
  if (USE_DUMMY) {
    await wait(500);
    const found = dummyViolations.find((v) => v.id === Number(id));
    if (!found) throw new Error("Violation not found");
    return { ...found };
  }

  const res = await fetch(`${BASE_URL}/violations/${id}`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// Confirm or reject a violation. newStatus = "confirmed" or "rejected"
export async function updateViolationStatus(id, newStatus) {
  if (USE_DUMMY) {
    await wait(500);
    if (SIMULATE_FAIL) throw new Error("Server error (500)");
    return { id, status: newStatus };
  }

  const res = await fetch(`${BASE_URL}/violations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// Download all violations (with the current filters) as a CSV file
export async function exportCsv(filters = {}) {
  let blob;

  if (USE_DUMMY) {
    // Build the CSV in the browser from the dummy data
    const rows = await getViolations(filters);
    const header = "id,video_id,track_id,frame_number,missing_ppe,confidence,status,created_at";
    const lines = rows.map((v) =>
      [
        v.id,
        v.video_id,
        v.track_id,
        v.frame_number,
        `"${v.missing_ppe.join(";")}"`,
        v.confidence,
        v.status,
        v.created_at,
      ].join(",")
    );
    blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  } else {
    const res = await fetch(`${BASE_URL}/export/csv?${buildQuery(filters)}`);
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    blob = await res.blob();
  }

  downloadBlob(blob, "violations.csv");
}

// Download the PDF report (made by Person E's backend code).
// ASSUMED endpoint: GET /report/pdf  -> confirm the real URL with Person E.
export async function downloadReport(filters = {}) {
  if (USE_DUMMY) {
    await wait(500);
    throw new Error("PDF report works only with the real backend");
  }

  const res = await fetch(`${BASE_URL}/report/pdf?${buildQuery(filters)}`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  downloadBlob(await res.blob(), "violations-report.pdf");
}

// ---------- Videos ----------
export async function getVideos() {
  if (USE_DUMMY) {
    await wait(800);
    return dummyVideos.map(withCounts);
  }

  const res = await fetch(`${BASE_URL}/videos`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// Current state of ONE video. Returns the whole video object
// ({ id, status, progress, frame, total_frames, workers, violations, error })
export async function getVideoStatus(id) {
  if (USE_DUMMY) {
    await wait(300);
    const video = dummyVideos.find((v) => v.id === id);
    if (!video) return { id, status: "failed", error: "Video not found" };

    // Fake progress: each poll (3 seconds) moves a processing video forward
    if (video.status === "uploaded") {
      video.status = "processing";
      video.progress = 0;
      video.frame = 0;
      video.total_frames = video.total_frames || 3000;
    } else if (video.status === "processing") {
      video.progress = Math.min(100, (video.progress || 0) + 20);
      video.frame = Math.round((video.total_frames * video.progress) / 100);
      if (video.progress >= 100) {
        video.status = "done";
        video.workers = 12;
      }
    }
    return withCounts(video);
  }

  const res = await fetch(`${BASE_URL}/videos/${id}/status`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  const data = await res.json();
  return { id, ...data };
}

// Upload a video. onProgress(percent) is called while uploading.
// ASSUMED: form fields are "video" and "zone" -> confirm with Person C.
// Response: { id, status }
export function uploadVideo(file, zone, onProgress = () => {}) {
  // Dummy mode: fake a progress bar, then add the video to the dummy list
  if (USE_DUMMY) {
    return new Promise((resolve) => {
      let percent = 0;
      const timer = setInterval(() => {
        percent += 20;
        onProgress(Math.min(percent, 100));
        if (percent >= 100) {
          clearInterval(timer);
          const video = {
            id: dummyVideos.length + 1,
            filename: file.name,
            status: "uploaded",
            zone,
            uploaded_at: new Date().toISOString().slice(0, 19),
          };
          dummyVideos.push(video);
          resolve({ id: video.id, status: video.status });
        }
      }, 300);
    });
  }

  // Real mode: XMLHttpRequest, because fetch cannot report upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        // Show the backend's message if it sent one
        let message = `Server error (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.error || body.message) message = body.error || body.message;
        } catch {
          // keep the default message
        }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Cannot reach the server. Is the backend running?"));

    const form = new FormData();
    form.append("video", file);
    form.append("zone", zone);
    xhr.send(form);
  });
}

// ---------- Rules ----------
// Returns { zone_welding: ["helmet", ...], zone_general: [...] }
export async function getRules() {
  if (USE_DUMMY) {
    await wait(500);
    return JSON.parse(JSON.stringify(dummyRules));
  }

  const res = await fetch(`${BASE_URL}/rules`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// Save the rules (same shape as getRules)
export async function saveRules(rules) {
  if (USE_DUMMY) {
    await wait(500);
    dummyRules = JSON.parse(JSON.stringify(rules));
    return dummyRules;
  }

  const res = await fetch(`${BASE_URL}/rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rules),
  });
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

// ---------- Detection settings ----------
// ASSUMED endpoints: GET /settings and PUT /settings (confirm with Person B / C)
// Shape: { confidence_threshold: 0.5, min_frames: 15 }
export async function getSettings() {
  if (USE_DUMMY) {
    await wait(300);
    return { ...dummySettings };
  }

  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}

export async function saveSettings(settings) {
  if (USE_DUMMY) {
    await wait(300);
    dummySettings = { ...settings };
    return { ...dummySettings };
  }

  const res = await fetch(`${BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Server error (${res.status})`);
  return res.json();
}