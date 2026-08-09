import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OutputsClient from "./outputs-client";

export const metadata = {
  title: "Outputs - Foundry",
};

export default async function OutputsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-8">
      <div className="flex items-center justify-between rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
      </div>

      <OutputsClient projectId={id} />
    </main>
  );
}
