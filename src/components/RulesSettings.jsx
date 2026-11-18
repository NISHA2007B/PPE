import { useState, useEffect } from "react";
import Spinner from "./Spinner";
import { getRules, saveRules, getSettings, saveSettings } from "../api/api";

// All PPE items an officer can require
const ppeItems = ["helmet", "goggles", "vest", "gloves", "boots"];

// Nice names for the zone keys (unknown zones fall back to a cleaned-up key)
const zoneLabels = {
  zone_welding: "Welding zone",
  zone_general: "General zone",
};

const zoneName = (key) =>
  zoneLabels[key] ||
  key.replace(/^zone_/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) + " zone";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function RulesSettings() {
  const [rules, setRules] = useState({});               // what is on the screen now
  const [savedRules, setSavedRules] = useState({});     // what is saved on the server
  const [settings, setSettings] = useState(null);       // { confidence_threshold, min_frames }
  const [savedSettings, setSavedSettings] = useState(null);
  const [settingsOk, setSettingsOk] = useState(false);  // false = server has no /settings yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);         // { type: "success" | "error", text }

  // Load rules (required) and detection settings (optional)
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRules();
      setRules(data);
      setSavedRules(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
      return;
    }

    try {
      const s = await getSettings();
      setSettings(s);
      setSavedSettings(s);
      setSettingsOk(true);
    } catch {
      setSettingsOk(false); // the sliders card is hidden, rules still work
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Tick / untick one PPE item in one zone
  const toggleItem = (zone, item) => {
    setMessage(null);
    setRules((prev) => {
      const current = prev[zone] || [];
      const updated = current.includes(item)
        ? current.filter((x) => x !== item) // remove
        : [...current, item];               // add
      return { ...prev, [zone]: updated };
    });
  };

  const changeSetting = (key, value) => {
    setMessage(null);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // True when the screen is different from what is saved
  const hasChanges =
    JSON.stringify(rules) !== JSON.stringify(savedRules) ||
    (settingsOk && JSON.stringify(settings) !== JSON.stringify(savedSettings));

  // Save rules first, then settings
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveRules(rules);
      setSavedRules(rules);
      if (settingsOk) {
        await saveSettings(settings);
        setSavedSettings(settings);
      }
      setMessage({ type: "success", text: "Rules saved ✓" });
    } catch (err) {
      setMessage({ type: "error", text: `Could not save: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const percent = settings ? Math.round(settings.confidence_threshold * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-medium">Rules</h2>

      {/* 1. Loading */}
      {loading && <Spinner />}

      {/* 2. Error with Retry */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
          <span>Could not load rules: {error}</span>
          <button
            onClick={loadAll}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty */}
      {!loading && !error && Object.keys(rules).length === 0 && (
        <p className="text-center text-slate-500 py-12">No zones configured</p>
      )}

      {/* 4. Zones, settings, save */}
      {!loading && !error && Object.keys(rules).length > 0 && (
        <>
          {/* One card per zone, PPE items as pills */}
          {Object.keys(rules).map((zone) => (
            <div key={zone} className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-lg font-medium mb-3">{zoneName(zone)}</h3>
              <div className="flex flex-wrap gap-2">
                {ppeItems.map((item) => {
                  const on = (rules[zone] || []).includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleItem(zone, item)}
                      aria-pressed={on}
                      className={`px-5 py-2 rounded-full border text-base ${
                        on
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {capitalize(item)}
                    </button>
                  );
                })}
              </div>

              {/* Warning when nothing is required */}
              {(rules[zone] || []).length === 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  No PPE selected: nothing will be flagged in this zone.
                </p>
              )}
            </div>
          ))}

          {/* Sliders (only when the server supports /settings) */}
          {settingsOk && settings && (
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="confidence" className="text-lg">
                    Confidence threshold
                  </label>
                  <span className="text-lg font-medium">{percent}%</span>
                </div>
                <input
                  id="confidence"
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={percent}
                  onChange={(e) => changeSetting("confidence_threshold", Number(e.target.value) / 100)}
                  className="w-full mt-3 accent-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="frames" className="text-lg">
                    Frames before flagging
                  </label>
                  <span className="text-lg font-medium">{settings.min_frames}</span>
                </div>
                <input
                  id="frames"
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={settings.min_frames}
                  onChange={(e) => changeSetting("min_frames", Number(e.target.value))}
                  className="w-full mt-3 accent-black"
                />
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save rules"}
          </button>

          {hasChanges && !message && (
            <p className="text-sm text-amber-600 text-center">Unsaved changes</p>
          )}
          {message && (
            <p
              className={`text-sm text-center ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}