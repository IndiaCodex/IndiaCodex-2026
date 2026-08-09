import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExecutionClient from "./execution-client";

export const metadata = {
  title: "Execution - Foundry",
};

export default async function ExecutionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-background/80 shadow-[var(--shadow-card)] shrink-0">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
      </div>
      <ExecutionClient projectId={id} className="flex-1 min-h-0" />
    </div>
  );
}
