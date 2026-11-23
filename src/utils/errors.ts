/**
 * Readable message from anything thrown: Error objects, Supabase errors
 * (plain objects with a `message`), or strings.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m
  }
  return fallback
}
