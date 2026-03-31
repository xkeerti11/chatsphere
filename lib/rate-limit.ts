type Bucket = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
) {
  const now = Date.now();
  const bucket = attempts.get(key);

  if (!bucket || now > bucket.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  attempts.set(key, bucket);
  return true;
}
