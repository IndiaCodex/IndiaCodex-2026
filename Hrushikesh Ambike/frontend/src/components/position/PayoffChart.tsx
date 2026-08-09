import { formatTUsdm } from "@/lib/format";
import type { ProjectionPoint } from "@/lib/selfRepay";
import styles from "./payoff-chart.module.css";

interface PayoffChartProps {
  points: ProjectionPoint[];
  /** Label for the right edge of the x-axis, e.g. "~47 epochs · Feb 12". */
  endLabel: string;
}

const WIDTH = 320;
const HEIGHT = 110;
const PAD_X = 4;
const PAD_TOP = 8;
const PAD_BOTTOM = 6;

/**
 * Static SVG area chart of the projected debt melt: current debt on the
 * left sliding to zero on the right. Pure presentation — the projection
 * itself comes from lib/selfRepay.ts.
 */
export function PayoffChart({ points, endLabel }: PayoffChartProps) {
  if (points.length < 2) return null;

  const maxDebt = points[0]?.debtMicro ?? 0;
  const maxEpoch = points.at(-1)?.epoch ?? 1;
  if (maxDebt <= 0 || maxEpoch <= 0) return null;

  const plotWidth = WIDTH - 2 * PAD_X;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const coords = points.map((point) => ({
    x: PAD_X + (point.epoch / maxEpoch) * plotWidth,
    y: PAD_TOP + (1 - point.debtMicro / maxDebt) * plotHeight,
  }));

  const lineD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const first = coords[0];
  const last = coords.at(-1);
  if (!first || !last) return null;
  const areaD = `${lineD} L${last.x.toFixed(1)},${HEIGHT - PAD_BOTTOM} L${first.x.toFixed(1)},${HEIGHT - PAD_BOTTOM} Z`;

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Projected debt of ${formatTUsdm(maxDebt / 1_000_000)} melting to zero over ${endLabel}`}
        preserveAspectRatio="none"
      >
        <path className={styles.area} d={areaD} />
        <path className={styles.line} d={lineD} />
        <circle
          className={styles.endDot}
          cx={last.x}
          cy={last.y}
          r={3.5}
        />
      </svg>
      <figcaption className={styles.axis}>
        <span>now · {formatTUsdm(maxDebt / 1_000_000)}</span>
        <span>{endLabel} · 0 tUSDM</span>
      </figcaption>
    </figure>
  );
}
