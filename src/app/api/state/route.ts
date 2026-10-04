import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    simulating: store.isSimulating(),
    ...store.getSnapshot(),
  });
}
