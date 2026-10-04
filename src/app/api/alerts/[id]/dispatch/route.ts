import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { workerId?: string };
  if (!body.workerId) {
    return Response.json({ error: "Select a worker to dispatch." }, { status: 400 });
  }
  try {
    const result = store.dispatch(id, body.workerId);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Dispatch failed" },
      { status: 400 },
    );
  }
}
