"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTA() {
  return (
    <section className="foundry-section border-t border-border">
      <div className="foundry-cta-panel">
        <h2 className="foundry-section-title">Start a project</h2>
        <p className="foundry-section-lead">
          Describe what you want to build. Foundry handles scoping, agent selection, and execution
          on Cardano preprod.
        </p>
        <div className="foundry-cta-row justify-center">
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Create your company
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            View projects
          </Link>
        </div>
      </div>
    </section>
  );
}