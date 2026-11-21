import { useCallback, useState } from 'react'

type Theme = 'light' | 'dark'

// the inline script in index.html already applied the saved theme; we just read it here
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        localStorage.setItem('theme', next)
      } catch {
        // storage can be blocked (private mode etc). theme still works for this visit.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
