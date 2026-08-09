import { ExecutionController } from "@/services/execution-controller";
import type { ProjectContext } from "@/types/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    projectContext: ProjectContext;
    projectId: string;
    walletAddress?: string;
  };

  const controller = new ExecutionController(body.walletAddress);
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let pendingWrite = Promise.resolve();

  const enqueue = (event: unknown) => {
    pendingWrite = pendingWrite.then(() =>
      writer.write(encoder.encode(`${JSON.stringify(event)}\n`)),
    );
    return pendingWrite;
  };

  const unsubscribe = controller.on((event) => {
    void enqueue(event);
  });

  controller
    .execute(body.projectContext)
    .catch((error) => {
      void enqueue({
        type: "execution:error",
        timestamp: Date.now(),
        data: { message: error instanceof Error ? error.message : "Execution failed" },
      });
    })
    .finally(async () => {
      unsubscribe();
      await pendingWrite;
      await writer.close();
    });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
