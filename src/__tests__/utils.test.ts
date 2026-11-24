import { describe, expect, it } from 'vitest'
import { errorMessage } from '../utils/errors'
import { safeRedirectPath } from '../utils/navigation'

describe('errorMessage', () => {
  it('reads Error objects, Supabase errors and strings', () => {
    expect(errorMessage(new Error('boom'), 'x')).toBe('boom')
    expect(errorMessage({ message: 'duplicate key', code: '23505' }, 'x')).toBe('duplicate key')
    expect(errorMessage('plain text', 'x')).toBe('plain text')
  })
  it('falls back for anything without a usable message (and never throws)', () => {
    for (const v of [null, undefined, 42, {}, { message: '' }, { message: 7 }, '  ']) {
      expect(errorMessage(v, 'Something went wrong')).toBe('Something went wrong')
    }
  })
})

describe('safeRedirectPath', () => {
  it('allows in-app paths', () => {
    expect(safeRedirectPath('/profile')).toBe('/profile')
    expect(safeRedirectPath('/feed?tab=all')).toBe('/feed?tab=all')
  })
  it('refuses other sites and junk', () => {
    for (const v of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', '', null, 5, { pathname: '/x' }]) {
      expect(safeRedirectPath(v)).toBe('/dashboard')
    }
  })
})
