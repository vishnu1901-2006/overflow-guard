import { eventBus } from "@/lib/events";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          unsubscribe();
          if (heartbeat) clearInterval(heartbeat);
        }
      };
      send(
        `data: ${JSON.stringify({
          type: "hello",
          simulating: store.isSimulating(),
          state: store.getSnapshot(),
        })}\n\n`,
      );
      unsubscribe = eventBus.subscribe(send);
      heartbeat = setInterval(() => send(": ping\n\n"), 15000);
    },
    cancel() {
      unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
