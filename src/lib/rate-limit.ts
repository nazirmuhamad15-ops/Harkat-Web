
// Simple In-Memory Rate Limiter (No dependencies required)
const limitStore = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(options: { interval: number; uniqueTokenPerInterval?: number }) {
  const WINDOW_SIZE = options.interval; // ms

  return {
    check: async (limit: number, token: string) => {
      const now = Date.now();
      const record = limitStore.get(token);

      if (!record) {
        limitStore.set(token, { count: 1, lastReset: now });
        return true;
      }

      if (now - record.lastReset > WINDOW_SIZE) {
        // Reset window
        limitStore.set(token, { count: 1, lastReset: now });
        return true;
      }

      if (record.count >= limit) {
        return false;
      }

      record.count += 1;
      return true;
    },
  };
}
