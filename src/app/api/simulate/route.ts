import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { on?: boolean };
  const simulating = store.setSimulating(Boolean(body.on));
  return Response.json({ simulating, state: store.getSnapshot() });
}
