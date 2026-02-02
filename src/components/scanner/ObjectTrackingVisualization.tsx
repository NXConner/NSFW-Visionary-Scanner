import type { TrackedObject } from "@/hooks/useObjectTracking";

function colorForId(id: number): string {
  // Deterministic vibrant palette
  const hues = [200, 35, 120, 280, 160, 15, 235, 95];
  const h = hues[(id - 1) % hues.length];
  return `hsl(${h} 90% 60%)`;
}

export function ObjectTrackingVisualization(props: {
  tracks: TrackedObject[];
  selectedTrackId?: number | null;
  showTrails: boolean;
  showIds: boolean;
}) {
  const { tracks, selectedTrackId, showTrails, showIds } = props;
  if (!tracks.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {showTrails &&
          tracks.map(t => {
            const col = colorForId(t.trackId);
            const pts = t.history.map(p => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(" ");
            return (
              <polyline
                key={`trail-${t.trackId}`}
                points={pts}
                fill="none"
                stroke={col}
                strokeWidth={0.45}
                strokeOpacity={0.55}
              />
            );
          })}

        {tracks.map(t => {
          const col = colorForId(t.trackId);
          const isSelected = selectedTrackId != null && t.trackId === selectedTrackId;
          const cx = t.box.x + t.box.width / 2;
          const cy = t.box.y + t.box.height / 2;
          const vx = t.velocity.vx;
          const vy = t.velocity.vy;
          const speed = Math.min(10, Math.sqrt(vx * vx + vy * vy));
          const dx = speed > 0.3 ? (vx / Math.max(1, Math.abs(vx) + Math.abs(vy))) * 6 : 0;
          const dy = speed > 0.3 ? (vy / Math.max(1, Math.abs(vx) + Math.abs(vy))) * 6 : 0;

          return (
            <g key={`trk-${t.trackId}`}>
              {/* Velocity arrow */}
              {speed > 0.3 && (
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + dx}
                  y2={cy + dy}
                  stroke={col}
                  strokeWidth={0.6}
                  strokeOpacity={0.8}
                />
              )}

              {/* Center dot */}
              <circle cx={cx} cy={cy} r={0.8} fill={col} fillOpacity={0.8} />

              {/* ID label */}
              {showIds && (
                <text
                  x={t.box.x}
                  y={Math.max(2, t.box.y - 1)}
                  fontSize={2.6}
                  fill={col}
                  opacity={0.95}
                >
                  {`#${t.trackId}`}
                </text>
              )}

              {/* Selected emphasis */}
              {isSelected && (
                <rect
                  x={t.box.x}
                  y={t.box.y}
                  width={t.box.width}
                  height={t.box.height}
                  fill="none"
                  stroke={col}
                  strokeWidth={1.1}
                  strokeOpacity={0.95}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Boxes in HTML layer for crisp corners */}
      {tracks.map(t => {
        const col = colorForId(t.trackId);
        const isSelected = selectedTrackId != null && t.trackId === selectedTrackId;
        return (
          <div
            key={`box-${t.trackId}`}
            className="absolute rounded-lg"
            style={{
              left: `${t.box.x}%`,
              top: `${t.box.y}%`,
              width: `${t.box.width}%`,
              height: `${t.box.height}%`,
              border: `2px solid ${col}`,
              boxShadow: isSelected ? `0 0 16px ${col}45` : `0 0 10px ${col}25`,
              opacity: 0.95,
            }}
          />
        );
      })}
    </div>
  );
}
