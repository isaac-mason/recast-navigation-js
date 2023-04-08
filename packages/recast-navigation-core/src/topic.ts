export type Listener<E extends unknown> = (event: E) => void;

export type Unsubscribe = () => void;

export class Topic<E extends unknown> {
  listeners: Set<(event: E) => void> = new Set();

  add(handler: Listener<E>): Unsubscribe {
    this.listeners.add(handler);

    return () => this.remove(handler);
  }

  remove(handler: Listener<E>): void {
    this.listeners.delete(handler);
  }

  emit(event: E): void {
    for (const handler of this.listeners.values()) {
      handler(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
