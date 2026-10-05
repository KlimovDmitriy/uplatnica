/** Text kept in data files rather than i18n JSON. Serbian Cyrillic is derived from `sr`. */
export interface Localized {
  sr: string
  en: string
  ru: string
}

export function useLocalized() {
  const { locale } = useI18n()
  return (text: Localized): string => {
    if (locale.value === 'sr-cyrl') return toCyrillic(text.sr)
    return text[locale.value as keyof Localized] ?? text.sr
  }
}
