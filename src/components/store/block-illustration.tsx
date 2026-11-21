import { cn } from "@/lib/utils";

/**
 * Ilustração isométrica simples de cada tipo de bloco (usada enquanto não há fotos reais).
 * `type`: 9cm | 12cm | 15cm | pave
 */
export function BlockIllustration({ type, className }: { type: string; className?: string }) {
  if (type === "pave") return <PaveIllustration className={className} />;

  // Espessura visual proporcional ao tipo
  const depth = type === "9cm" ? 18 : type === "12cm" ? 24 : 30;
  const w = 120;
  const h = 56;
  const x0 = 40;
  const y0 = 50;

  return (
    <svg viewBox="0 0 200 150" className={cn("h-full w-auto", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`top-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e4e7e3" />
          <stop offset="1" stopColor="#cfd4cf" />
        </linearGradient>
      </defs>
      {/* sombra */}
      <ellipse cx="100" cy="128" rx="78" ry="8" fill="#000" opacity="0.08" />
      {/* face superior */}
      <polygon
        points={`${x0},${y0} ${x0 + w},${y0} ${x0 + w + depth},${y0 - depth * 0.6} ${x0 + depth},${y0 - depth * 0.6}`}
        fill={`url(#top-${type})`}
        stroke="#9aa39c"
        strokeWidth="1"
      />
      {/* furos */}
      {[0, 1].map((i) => {
        const cx = x0 + depth / 2 + 14 + i * 52;
        const cy = y0 - depth * 0.3;
        return (
          <polygon
            key={i}
            points={`${cx},${cy + depth * 0.15} ${cx + 40},${cy + depth * 0.15} ${cx + 40 + depth * 0.3},${cy - depth * 0.05} ${cx + depth * 0.3},${cy - depth * 0.05}`}
            fill="#6f7a73"
            opacity="0.85"
          />
        );
      })}
      {/* face frontal */}
      <rect x={x0} y={y0} width={w} height={h} fill="#c3c9c4" stroke="#9aa39c" strokeWidth="1" />
      {/* face lateral */}
      <polygon
        points={`${x0 + w},${y0} ${x0 + w + depth},${y0 - depth * 0.6} ${x0 + w + depth},${y0 + h - depth * 0.6} ${x0 + w},${y0 + h}`}
        fill="#a9b0aa"
        stroke="#9aa39c"
        strokeWidth="1"
      />
      {/* textura */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle
          key={i}
          cx={x0 + 8 + ((i * 37) % (w - 16))}
          cy={y0 + 8 + ((i * 23) % (h - 16))}
          r="1.2"
          fill="#8e978f"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

function PaveIllustration({ className }: { className?: string }) {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 })
      .map((_, i) => {
        const a = (Math.PI / 3) * i;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a) * 0.55}`;
      })
      .join(" ");

  const cells = [
    [70, 60], [118, 60], [94, 79], [142, 79], [46, 79], [70, 98], [118, 98],
  ];

  return (
    <svg viewBox="0 0 200 150" className={cn("h-full w-auto", className)} aria-hidden="true">
      <ellipse cx="100" cy="128" rx="80" ry="8" fill="#000" opacity="0.08" />
      {cells.map(([cx, cy], i) => (
        <g key={i}>
          <polygon points={hex(cx, cy + 8, 26)} fill="#9aa39c" />
          <polygon points={hex(cx, cy, 26)} fill={i % 3 === 0 ? "#c9a27e" : "#c3c9c4"} stroke="#8e978f" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}
