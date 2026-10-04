export type Listener = (payload: string) => void;

class EventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(data: unknown) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  get size() {
    return this.listeners.size;
  }
}

const globalBus = globalThis as typeof globalThis & { overflowBus?: EventBus };

export const eventBus = globalBus.overflowBus ?? new EventBus();
if (!globalBus.overflowBus) {
  globalBus.overflowBus = eventBus;
}
