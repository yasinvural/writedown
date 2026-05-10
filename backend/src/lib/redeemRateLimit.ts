const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 40

type Entry = { count: number; windowStart: number }

const buckets = new Map<string, Entry>()

function prune(now: number): void {
  for (const [k, v] of buckets) {
    if (now - v.windowStart > WINDOW_MS) buckets.delete(k)
  }
}

/**
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function allowShareRedeemAttempt(clientKey: string): boolean {
  const now = Date.now()
  prune(now)

  let e = buckets.get(clientKey)
  if (!e || now - e.windowStart > WINDOW_MS) {
    e = { count: 1, windowStart: now }
    buckets.set(clientKey, e)
    return true
  }

  e.count += 1
  if (e.count > MAX_ATTEMPTS) {
    return false
  }
  return true
}
