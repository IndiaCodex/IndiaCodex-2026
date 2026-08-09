import { analyzeProjectScope } from "@/services/project-scope-analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      goal?: string;
    };

    if (!body.name || !body.description || !body.goal) {
      return Response.json({ error: "name, description, and goal are required" }, { status: 400 });
    }

    const analysis = await analyzeProjectScope({
      name: body.name,
      description: body.description,
      goal: body.goal,
    });

    return Response.json(analysis);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scope analysis failed" },
      { status: 500 },
    );
  }
}