import { describe, expect, it } from 'vitest'
import {
  buildIpsString,
  formatIpsAmount,
  isAccountChecksumValid,
  isModel97Valid,
  model97Control,
  normalizeAccount,
  parseIpsString,
  validateIps,
  type IpsInput,
} from '../shared/utils/ips'

// Example from the NBS IPS QR recommendations.
const nbsExample: IpsInput = {
  account: '845-0000000404849-87',
  payee: 'JP EPS BEOGRAD\nBALKANSKA 13',
  amount: 3596.13,
  payer: 'MRĐO MAČKATOVIĆ\nŽUPSKA 13\nBEOGRAD 6',
  paymentCode: '189',
  purpose: 'UPLATA PO RAČUNU ZA EL. ENERGIJU',
  model: '97',
  reference: '163220000111111111000',
}

describe('account', () => {
  it('normalizes short and dashed notations', () => {
    expect(normalizeAccount('845-404849-87')).toBe('845000000040484987')
    expect(normalizeAccount('845-0000000404849-87')).toBe('845000000040484987')
    expect(normalizeAccount('845000000040484987')).toBe('845000000040484987')
    expect(normalizeAccount('845-404849')).toBeNull()
  })

  it('checks the mod 97 control number', () => {
    expect(isAccountChecksumValid('845000000040484987')).toBe(true)
    expect(isAccountChecksumValid('845000000040484988')).toBe(false)
  })
})

describe('model 97', () => {
  it('validates and computes the control number', () => {
    expect(isModel97Valid('163220000111111111000')).toBe(true)
    expect(isModel97Valid('17-3220000111111111000')).toBe(false)
    expect(model97Control('3220000111111111000')).toBe('16')
  })
})

describe('buildIpsString', () => {
  it('matches the NBS example', () => {
    expect(validateIps(nbsExample)).toEqual([])
    expect(buildIpsString(nbsExample)).toBe(
      'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD\r\nBALKANSKA 13|I:RSD3596,13'
      + '|P:MRĐO MAČKATOVIĆ\r\nŽUPSKA 13\r\nBEOGRAD 6|SF:189|S:UPLATA PO RAČUNU ZA EL. ENERGIJU'
      + '|RO:97163220000111111111000',
    )
  })

  it('omits optional tags and defaults model to 00', () => {
    const s = buildIpsString({ account: '160-0000000000000-00', payee: 'X', amount: 10, paymentCode: '289', reference: '123-45' })
    expect(s).toBe('K:PR|V:01|C:1|R:160000000000000000|N:X|I:RSD10,00|SF:289|RO:00123-45')
  })

  it('formats amounts with a decimal comma', () => {
    expect(formatIpsAmount(1000)).toBe('1000,00')
    expect(formatIpsAmount(0.5)).toBe('0,50')
  })
})

describe('parseIpsString', () => {
  it('round-trips the NBS example', () => {
    const parsed = parseIpsString(buildIpsString(nbsExample))
    expect(parsed.formatErrors).toEqual([])
    expect(parsed.input).toEqual({ ...nbsExample, account: '845000000040484987' })
  })

  it('flags a broken header and amount', () => {
    expect(parseIpsString('K:XX|V:02|C:1|R:1|I:EUR5').formatErrors).toEqual(['K', 'V', 'I'])
  })
})

describe('validateIps', () => {
  it('reports every broken field', () => {
    expect(validateIps({ account: '1', payee: '', amount: 0, paymentCode: '389', model: '97', reference: '11123' }))
      .toEqual(['account.invalid', 'payee.required', 'amount.invalid', 'paymentCode.invalid', 'reference.checksum'])
  })
})

describe('Cyrillic input', () => {
  it('is transliterated to Latin in the payload', () => {
    const s = buildIpsString({ ...nbsExample, payee: 'ЈП ЕПС Београд', payer: 'Ђорђе Џајић', purpose: 'Уплата' })
    expect(s).toContain('N:JP EPS Beograd|')
    expect(s).toContain('P:Đorđe Džajić|')
    expect(s).toContain('S:Uplata|')
  })
})
