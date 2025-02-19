import { intlFormat } from 'date-fns';
import React from 'react';

// Quadratic Debt Decay Function: Calculates current debt at a given timestamp
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const calculateLoanQuadraticDecay = (
  timestamp: number,
  initialLoan: number,
  totalTime: number
): number => {
  // Ensure timestamp does not exceed totalTime
  const clampedTime = Math.min(timestamp, totalTime);

  // Quadratic decay formula: y = initialLoan * (1 - (t / totalTime)²)
  const normalizedTime = clampedTime / totalTime; // Scales time from 0 to 1
  return initialLoan * (1 - Math.pow(normalizedTime, 2)); // Quadratic decay
};

// Linear Debt Decay Function: Calculates current debt at a given timestamp
const calculateLoan = (timestamp: number, initialLoan: number, totalTime: number): number => {
  // Ensure timestamp does not exceed totalTime
  const clampedTime = Math.min(timestamp, totalTime);

  // Linear decay formula: y = initialLoan * (1 - (t / totalTime))
  const normalizedTime = clampedTime / totalTime; // Scales time from 0 to 1
  return initialLoan * (1 - normalizedTime); // Linear decay
};

/**
 * @param loan Initial loan
 * @param time Total duration in time units to reduce debt to 0
 * @param pointsCount Number of points for the chart (resolution)
 * @constructor
 */

export function LoanChart({
  loan,
  startTime,
  duration,
  pointsCount,
}: {
  loan: number;
  startTime: number;
  duration: number;
  pointsCount: number;
}) {
  // Input values
  const initialDebtBalance = -loan; // Initial debt (negative)

  // Generate the points for the chart line
  const POINTS = React.useMemo(() => {
    const points = [];
    const interval = duration / pointsCount; // Time interval between points

    for (let i = 0; i <= pointsCount; i++) {
      const x = (1000 / pointsCount) * i; // Scale X values to fit within the SVG width (300px)
      const timestamp = interval * i; // Current time
      const value = calculateLoan(timestamp, initialDebtBalance, duration);
      const y = (value / initialDebtBalance) * 300; // Scale Y values for SVG
      points.push({ x, y, value, time: timestamp + startTime });
    }

    return points;
  }, [duration, initialDebtBalance, pointsCount, startTime]);

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
    (x: number): { y: number; value: number; time: number } => {
      for (let i = 0; i < POINTS.length - 1; i++) {
        const { x: x1, y: y1 } = POINTS[i];
        const { x: x2, y: y2 } = POINTS[i + 1];
        if (x >= x1 && x <= x2) {
          // Perform linear interpolation to find the Y-value
          const t = (x - x1) / (x2 - x1); // Ratio between x1 and x2
          return { y: y1 + t * (y2 - y1), value: POINTS[i + 1].value, time: POINTS[i + 1].time }; // Interpolated Y-value
        }
      }
      return { y: 0, value: POINTS[0].value, time: POINTS[0].time }; // Return 0 if x is out of bounds (failsafe)
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
            ${Math.abs(getPoint(hoverX).value).toFixed(1)},{' '}
            {intlFormat(new Date(getPoint(hoverX).time * 1000), {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            })}
          </text>
        </>
      )}
      <line x1="0" y1="0" x2="1030" y2="0" stroke="#2d2d38" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="330" stroke="#fff" strokeWidth="1" strokeDasharray="5" />
      <text x="0" y="-15" fill="#9999ac" fontSize="20" textAnchor="start">
        {intlFormat(new Date(startTime * 1000), {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        })}
      </text>
      <text x="1000" y="-15" fill="#9999ac" fontSize="20" textAnchor="end">
        {intlFormat(new Date((startTime + duration) * 1000), {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        })}
      </text>
      <text x="-10" y="10" fill="#9999ac" fontSize="20" textAnchor="end">
        {loan ? `$${Number(0).toFixed(1)}` : '0%'}
      </text>
      <text x="-15" y="305" fill="#9999ac" fontSize="20" textAnchor="end">
        {loan ? `$${loan.toFixed(1)}` : '100%'}
      </text>
    </svg>
  );
}
