import { useEffect, useId, useMemo, useState } from "react";

type Props = {
  data: number[];
  color?: string;
  fill?: boolean;
  height?: number;
  animated?: boolean;
  durationMs?: number;
};

export function Sparkline({
  data,
  color = "var(--color-primary)",
  fill = true,
  height = 36,
  animated = true,
  durationMs = 900,
}: Props) {
  const gradientId = useId().replace(/:/g, "");
  const [isDrawn, setIsDrawn] = useState(!animated);
  const w = 120;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : 0;

  const animationKey = useMemo(() => data.map((value) => value.toFixed(4)).join("|"), [data]);

  useEffect(() => {
    if (!animated) {
      setIsDrawn(true);
      return;
    }

    setIsDrawn(false);
    const frame = window.requestAnimationFrame(() => {
      setIsDrawn(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [animated, animationKey]);

  const points = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2] as const);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? (
        <path
          d={area}
          fill={`url(#${gradientId})`}
          style={{
            opacity: isDrawn ? 1 : 0,
            transform: isDrawn ? "translateY(0)" : "translateY(6px)",
            transformOrigin: "center bottom",
            transition: `opacity ${Math.round(durationMs * 0.55)}ms ease, transform ${Math.round(durationMs * 0.55)}ms ease`,
          }}
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: isDrawn ? 0 : 1,
          opacity: isDrawn ? 1 : 0.4,
          transition: `stroke-dashoffset ${durationMs}ms cubic-bezier(.22,1,.36,1), opacity ${Math.round(durationMs * 0.45)}ms ease`,
        }}
      />
    </svg>
  );
}
