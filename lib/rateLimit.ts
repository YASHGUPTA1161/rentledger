import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Single Redis client — reused across all limiters
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/*
  Sliding window algorithm:
  - More accurate than fixed window (no burst at window reset)
  - Each request is weighted against the last N minutes of history
  - prefix keeps each route's counters isolated in Redis keys

  Redis key pattern: "rl:login:<IP>"
*/

// 5 login attempts per 15 minutes per IP — blocks brute-force
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:login",
});

// 3 signups per hour per IP — blocks fake account farms
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:signup",
});

// 5 contact submissions per hour per IP — blocks spam
export const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:contact",
});

// 3 waitlist signups per hour per IP — blocks throwaway email farming
export const waitlistLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:waitlist",
});
