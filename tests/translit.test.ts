import { describe, expect, it } from 'vitest'
import { toCyrillic, toCyrillicDeep } from '../shared/utils/translit'

describe('toCyrillic', () => {
  it('handles digraphs and diacritics', () => {
    expect(toCyrillic('Ljubljana, njiva, džep, Đorđe, šećer')).toBe('Љубљана, њива, џеп, Ђорђе, шећер')
    expect(toCyrillic('LJUBAV NJEGOŠ DŽEM')).toBe('ЉУБАВ ЊЕГОШ ЏЕМ')
  })

  it('keeps placeholders, acronyms and urls', () => {
    expect(toCyrillic('Najviše {max} znakova')).toBe('Највише {max} знакова')
    expect(toCyrillic('IPS QR kod, RSD')).toBe('IPS QR код, RSD')
    expect(toCyrillic('vidi https://nbs.rs/sr')).toBe('види https://nbs.rs/sr')
  })

  it('walks nested objects', () => {
    expect(toCyrillicDeep({ a: ['nalog'], b: { c: 'uplata' }, n: 1 })).toEqual({ a: ['налог'], b: { c: 'уплата' }, n: 1 })
  })
})
