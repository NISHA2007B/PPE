// SafeSight logo: orange rounded square with a helmet icon
export default function Logo({ size = 40 }) {
  return (
    <div
      className="bg-brand rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.6}
        height={size * 0.6}
        fill="none"
        stroke="#111111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Helmet dome */}
        <path d="M4 17a8 8 0 0 1 8-9h1a7 7 0 0 1 7 7v2z" />
        {/* Brim */}
        <path d="M3 17h18" />
        {/* Ridge */}
        <path d="M12 8v4h8" />
      </svg>
    </div>
  );
}