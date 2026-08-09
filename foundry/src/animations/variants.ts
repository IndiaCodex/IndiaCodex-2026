import type { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const scaleInUp: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export const glassCardHover = {
  rest: { scale: 1, borderColor: "rgba(255,255,255,0.06)" },
  hover: {
    scale: 1.02,
    borderColor: "rgba(99,102,241,0.3)",
    boxShadow: "0 8px 32px rgba(99,102,241,0.1)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const agentNodeVariants: Variants = {
  idle: { opacity: 0.4, scale: 0.95 },
  waiting: { opacity: 0.5, scale: 0.95 },
  planning: { opacity: 0.8, scale: 1, borderColor: "rgba(99,102,241,0.4)" },
  researching: { opacity: 0.9, scale: 1, borderColor: "rgba(6,182,212,0.4)" },
  working: { opacity: 1, scale: 1.05, borderColor: "rgba(99,102,241,0.6)" },
  reviewing: { opacity: 1, scale: 1, borderColor: "rgba(245,158,11,0.6)" },
  completed: { opacity: 1, scale: 1, borderColor: "rgba(16,185,129,0.6)" },
  failed: { opacity: 0.7, scale: 0.95, borderColor: "rgba(239,68,68,0.6)" },
};

export const pulseGlow: Variants = {
  animate: {
    opacity: [0.3, 0.8, 0.3],
    scale: [1, 1.05, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["-200% 0", "200% 0"],
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

export const progressBar: Variants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: 0.8, ease: "easeOut" },
  }),
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const nodeEnter: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const edgeDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: "easeIn" } },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};
