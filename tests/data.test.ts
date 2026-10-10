import { describe, expect, it } from 'vitest'
import { TEMPLATES } from '../app/data/templates'
import { MUNICIPALITIES } from '../app/data/municipalities'
import { PAYMENT_CODES } from '../app/data/paymentCodes'
import { LIMITS, buildIpsString, isAccountChecksumValid, normalizeAccount, parseIpsString } from '../shared/utils/ips'

describe('template data', () => {
  it('every prefilled account passes the mod 97 check', () => {
    for (const tpl of TEMPLATES) {
      for (const p of tpl.payments) {
        const acc = normalizeAccount(p.preset.account ?? '')
        expect(acc, `${tpl.slug}/${p.id}`).not.toBeNull()
        expect(isAccountChecksumValid(acc!), `${tpl.slug}/${p.id}`).toBe(true)
      }
    }
  })

  it('purpose, payee and payer fit the NBS limits after normalisation', () => {
    for (const tpl of TEMPLATES) {
      for (const p of tpl.payments) {
        // Same path as the real QR: buildIpsString cleans the text, parseIpsString reads the tags back.
        const { input } = parseIpsString(buildIpsString({
          account: p.preset.account ?? '',
          payee: p.preset.payee ?? '',
          payer: p.preset.payer,
          purpose: p.preset.purpose,
          amount: 1,
          paymentCode: '289',
        }))
        const id = `${tpl.slug}/${p.id}`
        expect(input.purpose!.length, `${id} purpose`).toBeLessThanOrEqual(LIMITS.purpose)
        expect(input.payee.length, `${id} payee`).toBeLessThanOrEqual(LIMITS.payee)
        expect(input.payer!.length, `${id} payer`).toBeLessThanOrEqual(LIMITS.payer)
      }
    }
  })

  it('templates without payments point to the official portal', () => {
    for (const tpl of TEMPLATES.filter(t => !t.payments.length)) expect(tpl.officialPay, tpl.slug).toBeDefined()
  })

  it('slugs are unique and payment codes are known', () => {
    expect(new Set(TEMPLATES.map(t => t.slug)).size).toBe(TEMPLATES.length)
    const bases = new Set(PAYMENT_CODES.map(c => c.base))
    for (const tpl of TEMPLATES) for (const p of tpl.payments) expect(bases.has(p.preset.paymentCode!.slice(1))).toBe(true)
  })
})

describe('municipality codes', () => {
  it('contains the spot-checked codes', () => {
    const byName = Object.fromEntries(MUNICIPALITIES)
    expect(byName['Zemun']).toBe('021')
    expect(byName['Savski venac']).toBe('016')
    expect(byName['Novi Beograd']).toBe('013')
    expect(byName['Grad Novi Sad']).toBe('223')
    expect(byName['Grad Beograd']).toBe('501')
  })
})

describe('municipality names and codes', () => {
  it('are unique (Palilula exists in Beograd and in Niš)', () => {
    const names = MUNICIPALITIES.map(([name]) => name)
    const codes = MUNICIPALITIES.map(([, code]) => code)
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
    expect(codes.filter((c, i) => codes.indexOf(c) !== i)).toEqual([])
    const byName = Object.fromEntries(MUNICIPALITIES)
    expect(byName['Palilula (Beograd)']).toBe('015')
    expect(byName['Palilula (Niš)']).toBe('127')
  })
})
