import Link from "next/link";
import { ArrowLeft, Download, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectDetailClient from "./project-detail-client";

export const metadata = {
  title: "Project - Foundry",
};

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-6 lg:px-8">
      <div className="flex items-center justify-between rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}/execution`}>
            <Button variant="default" size="sm" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Execute
            </Button>
          </Link>
          <Link href={`/projects/${id}/outputs`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Outputs
            </Button>
          </Link>
        </div>
      </div>

      <ProjectDetailClient projectId={id} />
    </main>
  );
}
