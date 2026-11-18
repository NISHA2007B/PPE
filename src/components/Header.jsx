import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

// Nav links shown in the header
const links = [
  { to: "/violations", label: "Dashboard" },
  { to: "/upload", label: "Upload" },
  { to: "/videos", label: "Videos" },
  { to: "/timeline", label: "Insights" },
  { to: "/rules", label: "Rules" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile menu

  // Active link = black pill, others = plain text
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-full text-sm font-medium ${
      isActive ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <header>
      {/* Yellow-black stripe */}
      <div className="hazard-stripe" />

      <div className="bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="text-lg font-semibold">SafeSight</span>
          </div>

          {/* Desktop menu */}
          <nav className="hidden md:flex gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* User + sign out (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-brand flex items-center justify-center font-semibold">
              {initial}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm border border-slate-300 rounded-full px-4 py-2 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden px-3 py-2 rounded-xl bg-slate-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden px-4 pb-4 space-y-3">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm border border-slate-300 rounded-full px-4 py-2 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}