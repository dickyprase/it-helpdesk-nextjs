/**
 * Simple in-memory rate limiter.
 * Tracks attempts per key (e.g., IP or email) within a sliding window.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;

    // Periodic cleanup every 60 seconds
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60_000);
    }
  }

  /**
   * Check if a key is rate-limited. Returns { allowed, remaining, resetIn }.
   * Automatically increments the counter.
   */
  check(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // Fresh window
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1, resetInMs: this.windowMs };
    }

    entry.count++;

    if (entry.count > this.maxAttempts) {
      return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
    }

    return { allowed: true, remaining: this.maxAttempts - entry.count, resetInMs: entry.resetAt - now };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Login: 10 attempts per 15 minutes per email
export const loginLimiter = new RateLimiter(10, 15 * 60 * 1000);

// Register: 5 accounts per hour per IP (approximated by email domain or a generic key)
export const registerLimiter = new RateLimiter(5, 60 * 60 * 1000);
