"use client";

import { Logo } from "@/components/shared/logo";
import { motion } from "framer-motion";
import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-violet/15 blur-[130px]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          {badge}
        </div>
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
        <p className="mt-6 text-center">
          <Link href="/" className="text-xs text-subtle hover:text-muted">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
