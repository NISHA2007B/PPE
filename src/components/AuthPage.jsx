import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const roles = ["Safety officer", "Supervisor", "Site manager"];

const inputClass =
  "w-full border border-slate-200 rounded-xl px-4 py-3 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: roles[0],
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? Go to the dashboard.
  if (user) return <Navigate to="/violations" replace />;

  const isRegister = mode === "register";

  const setField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const switchMode = () => {
    setError("");
    setMode(isRegister ? "login" : "register");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Simple checks before sending
    if (isRegister && !form.name.trim()) return setError("Please enter your full name");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (isRegister && form.password !== form.confirm) return setError("Passwords do not match");

    setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login(form);
      navigate("/violations");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="hazard-stripe" />

      <div className="max-w-md mx-auto px-4 py-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={72} />
          <h1 className="text-3xl font-semibold mt-4">SafeSight</h1>
          <p className="text-slate-600 mt-1">
            {isRegister ? "Create your officer account" : "Sign in to review PPE alerts"}
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          {isRegister && (
            <label className="block text-sm text-slate-700">
              Full name
              <input
                className={`${inputClass} mt-1`}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </label>
          )}

          <label className="block text-sm text-slate-700">
            Email
            <input
              type="email"
              className={`${inputClass} mt-1`}
              placeholder="officer@company.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </label>

          {isRegister && (
            <label className="block text-sm text-slate-700">
              Role
              <select
                className={`${inputClass} mt-1`}
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm text-slate-700">
            Password
            <input
              type="password"
              className={`${inputClass} mt-1`}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
            />
          </label>

          {isRegister && (
            <label className="block text-sm text-slate-700">
              Confirm password
              <input
                type="password"
                className={`${inputClass} mt-1`}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
              />
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Switch between sign in and register */}
        <p className="text-center text-sm text-slate-600 mt-4">
          {isRegister ? "Already registered? " : "New here? "}
          <button type="button" onClick={switchMode} className="text-blue-700 underline">
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}