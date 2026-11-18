import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import AuthPage from "./components/AuthPage";
import UploadPage from "./components/UploadPage";
import VideosList from "./components/VideosList";
import ViolationsList from "./components/ViolationsList";
import ReviewScreen from "./components/ReviewScreen";
import RulesSettings from "./components/RulesSettings";
import TimelineView from "./components/TimelineView";

// Pages inside here need a signed-in user. Otherwise go to /login.
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/violations" replace />} />
            <Route path="/violations" element={<ViolationsList />} />
            <Route path="/violations/:id" element={<ReviewScreen />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/videos" element={<VideosList />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/rules" element={<RulesSettings />} />
          </Route>

          {/* Unknown address */}
          <Route path="*" element={<Navigate to="/violations" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}