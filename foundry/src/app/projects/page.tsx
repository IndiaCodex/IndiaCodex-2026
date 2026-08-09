import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectsPageClient from "./projects-page-client";

export const metadata = {
  title: "Projects - Foundry",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-6 lg:px-8">
      <div className="flex items-center justify-between rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage your autonomous software development projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="default" size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create New Company
          </Button>
        </Link>
      </div>

      <ProjectsPageClient />
    </main>
  );
}
