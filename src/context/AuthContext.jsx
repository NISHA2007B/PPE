import { createContext, useContext, useState } from "react";

// IMPORTANT: this is a DEMO login that lives only in this browser.
// Your backend has no login endpoint yet, so this is NOT real security.
// Passwords are never stored. When Person C adds real auth, only this file changes.

const AuthContext = createContext(null);

const USER_KEY = "safesight_user";   // the signed-in user
const USERS_KEY = "safesight_users"; // everyone who registered (no passwords)

// localStorage can fail (private mode etc.), so every access is wrapped
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson(USER_KEY, null));

  // Create an account and sign in
  const register = async ({ name, email, role, password }) => {
    if (password.length < 8) throw new Error("Password must be at least 8 characters");

    const key = email.trim().toLowerCase();
    const users = readJson(USERS_KEY, []);
    if (users.some((u) => u.email === key)) {
      throw new Error("An account with this email already exists");
    }

    const newUser = { name: name.trim(), email: key, role };
    writeJson(USERS_KEY, [...users, newUser]);
    writeJson(USER_KEY, newUser);
    setUser(newUser);
  };

  // Sign in (demo: email must be registered, password at least 8 characters)
  const login = async ({ email, password }) => {
    const key = email.trim().toLowerCase();
    const found = readJson(USERS_KEY, []).find((u) => u.email === key);
    if (!found || password.length < 8) throw new Error("Wrong email or password");

    writeJson(USER_KEY, found);
    setUser(found);
  };

  const logout = () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use inside any component: const { user, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}