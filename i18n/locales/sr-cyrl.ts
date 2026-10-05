// Serbian Cyrillic is generated from the Latin messages, so only sr.json needs editing.
import sr from './sr.json'
import { toCyrillicDeep } from '#shared/utils/translit'

export default defineI18nLocale(() => toCyrillicDeep(sr))
