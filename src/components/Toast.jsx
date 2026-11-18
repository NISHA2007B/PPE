import { useEffect } from "react";

// Small message at the bottom of the screen. Hides itself after 3 seconds.
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-black text-white px-5 py-3 rounded-2xl shadow-lg z-50 text-center border-l-4 border-red-500"
    >
      {message}
    </div>
  );
}