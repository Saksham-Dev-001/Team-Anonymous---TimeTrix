// File: /js/core/store.js
// Reactive Micro Store for State Management

class Store {
  constructor() {
    this.state = {
      user: null,
      profile: null,
      theme: 'light',
      projectorMode: false,
      notifications: [],
      unreadCount: 0
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const store = new Store();

