/**
 * Every page exists once per language for search engines: "/x" (Serbian Latin, default)
 * plus "/sr-cyrl/x", "/en/x", "/ru/x". Visitors never see the prefix: the client strips it
 * from the address bar and keeps the language in localStorage.
 */
export const DEFAULT_LOCALE = 'sr'
export const PREFIXED_LOCALES = ['sr-cyrl', 'en', 'ru'] as const

export type LocaleCode = typeof DEFAULT_LOCALE | typeof PREFIXED_LOCALES[number]

/** "/ru/model-97" → { code: "ru", path: "/model-97" }; "/model-97" → { code: null, path: "/model-97" }. */
export function splitLangPrefix(path: string): { code: LocaleCode | null, path: string } {
  for (const code of PREFIXED_LOCALES) {
    if (path === `/${code}` || path.startsWith(`/${code}/`)) {
      return { code, path: path.slice(code.length + 1) || '/' }
    }
  }
  return { code: null, path }
}

export function withLangPrefix(code: string | null, path: string): string {
  if (!code || code === DEFAULT_LOCALE) return path
  return path === '/' ? `/${code}` : `/${code}${path}`
}
