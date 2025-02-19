export function GradientCircle({ value = '', size = 200, strokeWidth = 1 }) {
  const radius = (size - strokeWidth) / 2; // Calculate radius based on size and stroke width
  const center = size / 2; // Center of the circle

  return (
    <svg viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="circular-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34EDB3" />
          <stop offset="100%" stopColor="#00D1FF" />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#circular-gradient)"
        strokeWidth="1"
      />
      <text x={center} y={center} fill="#ffffff" fontSize="36" textAnchor="middle">
        {value}
      </text>
      <text x={center} y={center + 30} fill="#9999ac" fontSize="18" textAnchor="middle">
        APR
      </text>
    </svg>
  );
}
