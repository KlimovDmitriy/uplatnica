import { describe, expect, it } from 'vitest'
import { decodeSlip, encodeSlip } from '../app/utils/share'
import type { SlipForm } from '../app/composables/useSlip'

const form: SlipForm = {
  kind: 'prenos',
  payer: 'Đorđe Šćekić\nNjegoševa 5',
  purpose: 'Kirija за октобар',
  payee: 'Marija Ž.',
  paymentCode: '226',
  amount: '45.000,00',
  account: '160-5100000000-02',
  model: '97',
  reference: '12345',
  payerAccount: '',
  debitModel: '',
  debitReference: '',
  urgent: true,
}

describe('share link', () => {
  it('round-trips UTF-8 slips', () => {
    const encoded = encodeSlip(form)
    expect(encoded).toMatch(/^[\w-]+$/)
    expect(decodeSlip(encoded)).toEqual(form)
  })

  it('drops trailing empty fields', () => {
    const short = encodeSlip({ ...form, urgent: false })
    expect(decodeSlip(short)).toEqual({
      kind: 'prenos', payer: form.payer, purpose: form.purpose, payee: form.payee, paymentCode: '226',
      amount: '45.000,00', account: form.account, model: '97', reference: '12345',
    })
  })

  it('rejects garbage', () => {
    expect(decodeSlip('!!!')).toBeNull()
    expect(decodeSlip(btoa('[2,"x"]'))).toBeNull()
  })
})
