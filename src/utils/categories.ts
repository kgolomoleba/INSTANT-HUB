/** One list per listing type, used by the "create listing" form and the page filters. */
export const PRODUCT_CATEGORIES = ['Design', 'Handmade', 'Tutoring', 'Tech', 'Art', 'Other'] as const
export const SERVICE_CATEGORIES = ['Tutoring', 'Web Development', 'Photography', 'Design', 'Consulting', 'Other'] as const

/** Does a listing belong under the selected filter? "Other" also catches anything outside the list. */
export function matchesCategory(listingCategory: string | null | undefined, selected: string, list: readonly string[]): boolean {
  if (selected === 'All') return true
  const c = (listingCategory ?? '').trim().toLowerCase()
  if (selected === 'Other') return c === 'other' || !list.some((x) => x.toLowerCase() === c)
  return c === selected.toLowerCase()
}
