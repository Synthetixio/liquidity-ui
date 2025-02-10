import React from 'react';

// Quadratic Debt Decay Function: Calculates current debt at a given timestamp
const calculateLoan = (timestamp: number, initialLoan: number, totalTime: number): number => {
  // Ensure timestamp does not exceed totalTime
  const clampedTime = Math.min(timestamp, totalTime);

  // Quadratic decay formula: y = initialLoan * (1 - (t / totalTime)²)
  const normalizedTime = clampedTime / totalTime; // Scales time from 0 to 1
  return initialLoan * (1 - Math.pow(normalizedTime, 2)); // Quadratic decay
};

export function LoanChart() {
  // Input values
  const LOAN = -500; // Initial debt (negative)
  const TIME = 1000; // Total duration in time units to reduce debt to 0
  const COUNT = 50; // Number of points for the chart (resolution)

  // Generate the points for the chart line
  const POINTS = React.useMemo(() => {
    const points = [];
    const interval = TIME / COUNT; // Time interval between points

    for (let i = 0; i <= COUNT; i++) {
      const x = (1000 / COUNT) * i; // Scale X values to fit within the SVG width (300px)
      const timestamp = interval * i; // Current time
      const value = calculateLoan(timestamp, LOAN, TIME);
      const y = (value / LOAN) * 300; // Scale Y values for SVG
      points.push({ x, y, value });
    }

    return points;
  }, [LOAN]);

  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const handleMouseMove = (event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    const rectElement = event.target as SVGRectElement;
    if (rectElement) {
      const rect = rectElement.getBoundingClientRect();
      // Calculate the normalized X value relative to the SVG's viewBox
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 1000; // Scale X to viewBox scale (0 to 1000)
      setHoverX(normalizedX);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null); // Clear the hoverX when the mouse leaves the chart
  };

  // Helper: Find Y for a given X by interpolating the `POINTS_ARR`
  const getPoint = React.useCallback(
    (x: number): { y: number; value: number } => {
      for (let i = 0; i < POINTS.length - 1; i++) {
        const { x: x1, y: y1 } = POINTS[i];
        const { x: x2, y: y2 } = POINTS[i + 1];
        if (x >= x1 && x <= x2) {
          // Perform linear interpolation to find the Y-value
          const t = (x - x1) / (x2 - x1); // Ratio between x1 and x2
          return { y: y1 + t * (y2 - y1), value: POINTS[i + 1].value }; // Interpolated Y-value
        }
      }
      return { y: 0, value: POINTS[0].value }; // Return 0 if x is out of bounds (failsafe)
    },
    [POINTS]
  );

  return (
    <svg viewBox="-70 -70 1100 400" className="chart">
      <rect
        x="0"
        y="0"
        width="1000"
        height="300"
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <polyline
        fill="none"
        stroke="#9999ac"
        strokeWidth="2"
        points={POINTS.map(({ x, y }) => `${x},${y}`).join(' ')}
      />
      <circle cx={POINTS[0].x} cy={POINTS[0].y} r="8" fill="#9999ac" />

      {/* End of the chart (last point) */}
      <circle
        cx={POINTS[POINTS.length - 1].x}
        cy={POINTS[POINTS.length - 1].y}
        r="8"
        fill="#9999ac"
      />

      {hoverX !== null && (
        <>
          <line
            x1={hoverX}
            y1="0"
            x2={hoverX}
            y2="300"
            stroke="#aaa"
            strokeWidth="1"
            strokeDasharray="4" // Dashed line
          />
          <circle cx={hoverX} cy={getPoint(hoverX).y} r="8" fill="#9999ac" />

          <text
            x={hoverX + 20}
            y={getPoint(hoverX).y + 20}
            fill="#9999ac"
            fontSize="20"
            textAnchor="start"
          >
            {Math.round(getPoint(hoverX).value)}
          </text>
        </>
      )}
      <line x1="0" y1="0" x2="1030" y2="0" stroke="#2d2d38" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="330" stroke="#fff" strokeWidth="1" strokeDasharray="5" />
      <text x="0" y="-15" fill="#9999ac" fontSize="20" textAnchor="start">
        Now
      </text>
      <text x="1000" y="-15" fill="#9999ac" fontSize="20" textAnchor="end">
        End
      </text>
      <text x="-10" y="20" fill="#9999ac" fontSize="20" textAnchor="end">
        0%
      </text>
      <text x="-10" y="300" fill="#9999ac" fontSize="20" textAnchor="end">
        100%
      </text>
    </svg>
  );
}
