import { cn } from "@/lib/utils";
import Link from "next/link";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path
          d="M15 2.4L25.2 6.2V14.3C25.2 21.1 20.7 26.2 15 28C9.3 26.2 4.8 21.1 4.8 14.3V6.2L15 2.4Z"
          stroke="url(#medvault-logo-grad)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M6.8 15.4H10.3L11.7 12.1L13.9 18.9L15.5 14.7L16.5 15.4H23.2"
          className="text-cyan"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <defs>
          <linearGradient id="medvault-logo-grad" x1="4.8" y1="2.4" x2="25.2" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D3EE" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-base font-semibold tracking-tight">
        Med<span className="text-gradient">Vault</span>
      </span>
    </Link>
  );
}
