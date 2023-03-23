export class Observable<E> {
  listeners: Set<(e: E) => void> = new Set();

  add(listener: (e: E) => void) {
    this.listeners.add(listener);
  }

  remove(listener: (e: E) => void) {
    this.listeners.delete(listener);
  }

  notifyObservers(e: E) {
    this.listeners.forEach((listener) => listener(e));
  }

  clear() {
    this.listeners.clear();
  }
}
