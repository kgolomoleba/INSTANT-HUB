/** Where to go after login: only paths inside this app, never another site. */
export function safeRedirectPath(from: unknown, fallback = '/dashboard'): string {
  if (typeof from !== 'string') return fallback
  // "/x" is in-app; "//evil.com" and "/\\evil.com" are treated by browsers as other sites.
  if (!from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return fallback
  return from
}
