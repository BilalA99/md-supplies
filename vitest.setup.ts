import { vi } from 'vitest'

// React's cache() is a no-op in the development/node build — it does not
// memoize outside a React server render context. Replace it with a real
// WeakMap-keyed memoizer so tests that assert deduplication actually work.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
      const memo = new Map<string, ReturnType<T>>()
      return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args)
        if (memo.has(key)) return memo.get(key) as ReturnType<T>
        const result = fn(...args) as ReturnType<T>
        memo.set(key, result)
        return result
      }) as T
    },
  }
})
