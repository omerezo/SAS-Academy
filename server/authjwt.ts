export function signToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64');
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const json = Buffer.from(token, 'base64').toString();
    const payload = JSON.parse(json);
    if (!payload.userId || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
