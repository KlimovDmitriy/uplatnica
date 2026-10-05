import { describe, expect, it } from 'vitest'
import { splitLangPrefix, withLangPrefix } from '../shared/utils/lang'

describe('language prefix', () => {
  it('splits known prefixes only', () => {
    expect(splitLangPrefix('/ru/model-97')).toEqual({ code: 'ru', path: '/model-97' })
    expect(splitLangPrefix('/sr-cyrl')).toEqual({ code: 'sr-cyrl', path: '/' })
    expect(splitLangPrefix('/en/')).toEqual({ code: 'en', path: '/' })
    expect(splitLangPrefix('/uplatnice/rusija')).toEqual({ code: null, path: '/uplatnice/rusija' })
    expect(splitLangPrefix('/rules')).toEqual({ code: null, path: '/rules' })
  })

  it('adds a prefix except for the default language', () => {
    expect(withLangPrefix('ru', '/')).toBe('/ru')
    expect(withLangPrefix('ru', '/model-97')).toBe('/ru/model-97')
    expect(withLangPrefix('sr', '/model-97')).toBe('/model-97')
    expect(withLangPrefix(null, '/')).toBe('/')
  })
})
