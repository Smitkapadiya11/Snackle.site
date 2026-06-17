"use client";

import { useEffect, useRef } from "react";

interface Props {
  size?: number;
}

export function IntelligenceCreature({ size = 400 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const nodes = [
    { x: 200, y: 200, r: 8, ring: 0, delay: 0 },
    { x: 260, y: 200, r: 5, ring: 1, delay: 0.1 },
    { x: 230, y: 252, r: 5, ring: 1, delay: 0.2 },
    { x: 170, y: 252, r: 5, ring: 1, delay: 0.3 },
    { x: 140, y: 200, r: 5, ring: 1, delay: 0.4 },
    { x: 170, y: 148, r: 5, ring: 1, delay: 0.5 },
    { x: 230, y: 148, r: 5, ring: 1, delay: 0.6 },
    { x: 320, y: 200, r: 3.5, ring: 2, delay: 0.7 },
    { x: 285, y: 285, r: 3.5, ring: 2, delay: 0.8 },
    { x: 200, y: 320, r: 3.5, ring: 2, delay: 0.9 },
    { x: 115, y: 285, r: 3.5, ring: 2, delay: 1.0 },
    { x: 80, y: 200, r: 3.5, ring: 2, delay: 1.1 },
    { x: 115, y: 115, r: 3.5, ring: 2, delay: 1.2 },
    { x: 200, y: 80, r: 3.5, ring: 2, delay: 1.3 },
    { x: 285, y: 115, r: 3.5, ring: 2, delay: 1.4 },
    { x: 370, y: 200, r: 2.5, ring: 3, delay: 1.5 },
    { x: 341, y: 307, r: 2.5, ring: 3, delay: 1.6 },
    { x: 253, y: 370, r: 2.5, ring: 3, delay: 1.7 },
    { x: 147, y: 370, r: 2.5, ring: 3, delay: 1.8 },
    { x: 59, y: 307, r: 2.5, ring: 3, delay: 1.9 },
    { x: 30, y: 200, r: 2.5, ring: 3, delay: 2.0 },
    { x: 59, y: 93, r: 2.5, ring: 3, delay: 2.1 },
    { x: 147, y: 30, r: 2.5, ring: 3, delay: 2.2 },
    { x: 253, y: 30, r: 2.5, ring: 3, delay: 2.3 },
    { x: 341, y: 93, r: 2.5, ring: 3, delay: 2.4 },
  ];

  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 7], [1, 8], [2, 8], [2, 9], [3, 9], [3, 10], [4, 10], [4, 11],
    [5, 11], [5, 12], [5, 13], [6, 13], [6, 14], [6, 7],
    [7, 15], [7, 16], [8, 16], [8, 17], [9, 17], [9, 18],
    [10, 18], [10, 19], [11, 19], [11, 20], [11, 21], [12, 21], [12, 22],
    [13, 22], [13, 23], [14, 23], [14, 24], [14, 15],
  ];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let frame: number;
    let t = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.008;

      const pulses = svg.querySelectorAll<SVGCircleElement>(".signal-pulse");
      pulses.forEach((pulse, i) => {
        const edge = edges[i % edges.length];
        if (!edge) return;
        const fromNode = nodes[edge[0]];
        const toNode = nodes[edge[1]];
        const progress = (t * 0.5 + i * 0.15) % 1;
        const x = fromNode.x + (toNode.x - fromNode.x) * progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * progress;
        pulse.setAttribute("cx", String(x));
        pulse.setAttribute("cy", String(y));
        pulse.setAttribute("opacity", String(Math.sin(progress * Math.PI) * 0.7));
      });
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="creature-wrap"
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        className="creature-svg"
        viewBox="0 0 400 400"
        width={size}
        height={size}
        style={{ display: "block", maxWidth: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="outerRing" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#FCA311" stopOpacity="0" />
            <stop offset="85%" stopColor="#FCA311" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#FCA311" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="185" fill="url(#outerRing)">
          <animate attributeName="r" values="178;188;178" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
        </circle>

        {edges.map(([a, b], i) => (
          <line
            key={`e-${i}`}
            className="edge-line"
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#FCA311"
            strokeOpacity={0.12 + (nodes[a].ring === 0 ? 0.1 : 0)}
            strokeWidth={nodes[a].ring === 0 ? 0.8 : 0.5}
          />
        ))}

        {edges.slice(0, 18).map((_, i) => (
          <circle key={`p-${i}`} className="signal-pulse" r="2" fill="#FCA311" opacity="0" />
        ))}

        {nodes.map((n, i) => (
          <g key={`n-${i}`} filter={i === 0 ? "url(#glow-strong)" : "url(#glow)"}>
            <circle cx={n.x} cy={n.y} r={n.r * (i === 0 ? 5 : 3.5)} fill="#FCA311" opacity={i === 0 ? 0.15 : 0.08}>
              <animate
                attributeName="opacity"
                values={`${i === 0 ? 0.1 : 0.05};${i === 0 ? 0.25 : 0.15};${i === 0 ? 0.1 : 0.05}`}
                dur={`${2.5 + n.delay * 0.3}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values={`${n.r * 3};${n.r * (i === 0 ? 6 : 4.5)};${n.r * 3}`}
                dur={`${2.5 + n.delay * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={n.x} cy={n.y} r={n.r} fill="#FCA311" opacity={i === 0 ? 0.95 : 0.7}>
              <animate
                attributeName="opacity"
                values={`${i === 0 ? 0.8 : 0.5};${i === 0 ? 1 : 0.9};${i === 0 ? 0.8 : 0.5}`}
                dur={`${1.8 + n.delay * 0.2}s`}
                begin={`${n.delay * 0.1}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
