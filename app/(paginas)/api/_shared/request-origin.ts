export function getRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : null;
  } catch {
    return null;
  }
}
