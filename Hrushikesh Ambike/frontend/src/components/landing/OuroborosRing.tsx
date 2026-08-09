"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "./ouroboros-ring.module.css";

/** Fraction of the circle the serpent's body covers (the gap is its mouth). */
const BODY_SWEEP = 0.88;

const RING_RADIUS = 150;
const CENTER = 170;

/* Head position: the arc starts at 12 o'clock and sweeps BODY_SWEEP of the
   circle clockwise; the head diamond sits at the leading end. */
const HEAD_ANGLE_RAD = ((-90 + BODY_SWEEP * 360) * Math.PI) / 180;
const HEAD_X = CENTER + RING_RADIUS * Math.cos(HEAD_ANGLE_RAD);
const HEAD_Y = CENTER + RING_RADIUS * Math.sin(HEAD_ANGLE_RAD);

interface OuroborosRingProps {
  children?: ReactNode;
}

/**
 * The Ouro signature mark: a gold serpent-ring that draws itself on load,
 * then slowly chases its own tail. The open gap is the mouth consuming the
 * tail — the same motion the protocol performs on debt. Center slot holds
 * the live debt readout.
 */
export function OuroborosRing({ children }: OuroborosRingProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox="0 0 340 340"
        role="img"
        aria-label="Ouroboros ring — debt consuming itself"
      >
        <defs>
          <linearGradient id="ouro-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(66% 0.13 84)" />
            <stop offset="60%" stopColor="oklch(55% 0.115 78)" />
            <stop offset="100%" stopColor="oklch(42% 0.1 75)" />
          </linearGradient>
        </defs>

        {/* Epoch ticks — one blip per epoch of the loop */}
        <circle
          className={styles.ticks}
          cx={CENTER}
          cy={CENTER}
          r={163}
          fill="none"
          strokeWidth="5"
          strokeDasharray="1 11.8"
        />

        {/* Track the serpent travels on */}
        <circle
          className={styles.track}
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2"
        />

        <g className={styles.serpent}>
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="url(#ouro-body)"
            strokeWidth="10"
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            initial={
              prefersReducedMotion
                ? { pathLength: BODY_SWEEP }
                : { pathLength: 0 }
            }
            animate={{ pathLength: BODY_SWEEP }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Head: diamond at the leading end, mouth open toward the tail */}
          <motion.rect
            x={HEAD_X - 9}
            y={HEAD_Y - 9}
            width="18"
            height="18"
            fill="oklch(50% 0.115 76)"
            transform={`rotate(45 ${HEAD_X} ${HEAD_Y})`}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.5 }}
          />
        </g>
      </svg>

      <div className={styles.center}>{children}</div>
    </div>
  );
}
