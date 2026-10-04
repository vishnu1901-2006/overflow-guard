import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const bin = store.getBin(id.toUpperCase());
  if (!bin) {
    return Response.json({ error: `No bin found for ID ${id}` }, { status: 404 });
  }
  return Response.json(bin);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    fillLevel?: number;
    reportFull?: boolean;
  };
  try {
    const result = body.reportFull
      ? store.reportFull(id.toUpperCase())
      : store.setFillLevel(id.toUpperCase(), Number(body.fillLevel ?? 100), "manual");
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update bin" },
      { status: 400 },
    );
  }
}
