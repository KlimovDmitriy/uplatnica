import QRCode from 'qrcode'
import type { SlipForm, SlipScript } from '~/composables/useSlip'

/**
 * The payment slip as an SVG string in millimetres (210 × 99, the official size).
 * One drawing serves the on-screen preview, window.print() and the PDF export.
 */

const LATN = {
  uplata: 'NALOG ZA UPLATU',
  prenos: 'NALOG ZA PRENOS',
  payer: 'uplatilac',
  debtor: 'dužnik',
  purpose: 'svrha uplate',
  purposeTransfer: 'svrha plaćanja',
  payee: 'primalac',
  creditor: 'poverilac',
  paymentCode: 'šifra plaćanja',
  currency: 'valuta',
  amount: 'iznos',
  payeeAccount: 'račun primaoca',
  creditorAccount: 'račun poverioca',
  debtorAccount: 'račun dužnika',
  model: 'model',
  referenceCredit: 'poziv na broj (odobrenje)',
  referenceDebit: 'poziv na broj (zaduženje)',
  urgent: 'hitno',
  signature: 'pečat i potpis uplatioca',
  signatureTransfer: 'pečat i potpis nalogodavca',
  placeDate: 'mesto i datum prijema',
  valueDate: 'datum valute',
}
const CYRL = toCyrillicDeep(LATN)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** QR as a single path in module units, built synchronously so SSR renders it too. */
function qrPath(payload: string): { d: string, size: number } {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: 'M' })
  let d = ''
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`
    }
  }
  return { d, size: modules.size }
}

export function prettyAccount(raw: string): string {
  const acc = normalizeAccount(raw)
  return acc ? formatAccount(acc) : raw
}

export type SlipLabels = typeof LATN

export interface SlipBox {
  /** Form field shown in the box; `currency` is the fixed "RSD". */
  key: keyof SlipForm | 'currency'
  caption: keyof SlipLabels
  x: number
  y: number
  w: number
  h: number
  /** Up to 3 lines (names, addresses, purpose). */
  multiline?: boolean
  mono?: boolean
  anchor?: 'start' | 'end'
}

/** Geometry of the boxes in millimetres, shared by the SVG and the editable slip. */
export function slipBoxes(kind: SlipForm['kind']): SlipBox[] {
  const prenos = kind === 'prenos'
  const boxes: SlipBox[] = [
    { key: 'payer', caption: prenos ? 'debtor' : 'payer', x: 6, y: 15, w: 94, h: 15, multiline: true },
    { key: 'purpose', caption: prenos ? 'purposeTransfer' : 'purpose', x: 6, y: 36, w: 94, h: 15, multiline: true },
    { key: 'payee', caption: prenos ? 'creditor' : 'payee', x: 6, y: 57, w: 94, h: 15, multiline: true },
  ]
  let y = 18
  boxes.push(
    { key: 'paymentCode', caption: 'paymentCode', x: 110, y, w: 18, h: 7, mono: true },
    { key: 'currency', caption: 'currency', x: 131, y, w: 14, h: 7, mono: true },
    { key: 'amount', caption: 'amount', x: 148, y, w: 56, h: 7, mono: true, anchor: 'end' },
  )
  const step = prenos ? 11 : 13.5
  if (prenos) {
    y += step
    boxes.push({ key: 'payerAccount', caption: 'debtorAccount', x: 110, y, w: 94, h: 7, mono: true })
    y += step
    boxes.push(
      { key: 'debitModel', caption: 'model', x: 110, y, w: 14, h: 7, mono: true },
      { key: 'debitReference', caption: 'referenceDebit', x: 127, y, w: 77, h: 7, mono: true },
    )
  }
  y += step
  boxes.push({ key: 'account', caption: prenos ? 'creditorAccount' : 'payeeAccount', x: 110, y, w: 94, h: 7, mono: true })
  y += step
  boxes.push(
    { key: 'model', caption: 'model', x: 110, y, w: 14, h: 7, mono: true },
    // On "prenos" the last row shares its height with the QR, so the reference box stops before it.
    { key: 'reference', caption: 'referenceCredit', x: 127, y, w: prenos ? 49 : 77, h: 7, mono: true },
  )
  return boxes
}

export function slipLabels(script: SlipScript): SlipLabels {
  return script === 'cyrl' ? CYRL : LATN
}

/** Text drawn in a box: accounts in dashed notation, amount in Serbian notation. */
function boxText(form: SlipForm, key: SlipBox['key']): string {
  if (key === 'currency') return 'RSD'
  if (key === 'account' || key === 'payerAccount') return prettyAccount(form[key])
  if (key === 'amount') {
    const amount = formatAmount(parseAmount(form.amount))
    return amount && `= ${amount}`
  }
  return String(form[key] ?? '')
}

/**
 * @param withValues false draws only the blank form (labels, boxes, QR): the editable
 * slip puts real inputs on top of it.
 */
export function renderSlipSvg(form: SlipForm, script: SlipScript, ipsPayload: string, withValues = true): string {
  const L = slipLabels(script)
  const prenos = form.kind === 'prenos'
  const ink = '#000'
  const out: string[] = []
  let clipId = 0

  const label = (x: number, y: number, text: string, anchor = 'start') =>
    out.push(`<text x="${x}" y="${y}" font-size="2.1" fill="${ink}" text-anchor="${anchor}">${esc(text)}</text>`)

  const box = (x: number, y: number, w: number, h: number) =>
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${ink}" stroke-width=".25"/>`)

  /** Multiline value clipped to its box. */
  const value = (b: SlipBox, text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3)
    if (!lines.length) return
    const id = `@ID@${clipId++}`
    const family = b.mono ? 'Courier New, monospace' : 'Arial, Helvetica, sans-serif'
    const tx = b.anchor === 'end' ? b.x + b.w - 1.2 : b.x + 1.2
    out.push(`<clipPath id="${id}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></clipPath>`)
    out.push(`<g clip-path="url(#${id})" font-family="${family}" font-size="3" fill="${ink}"${b.mono ? ' font-weight="700"' : ''}>`)
    // Multiline boxes fill from the top; single-line boxes are centred vertically, like the inputs.
    const top = b.multiline ? b.y + 3.9 : b.y + b.h / 2 + 1.05
    lines.forEach((line, i) => out.push(`<text x="${tx}" y="${top + i * 3.8}" text-anchor="${b.anchor ?? 'start'}">${esc(line)}</text>`))
    out.push('</g>')
  }

  for (const b of slipBoxes(form.kind)) {
    label(b.x, b.y - 1, L[b.caption])
    box(b.x, b.y, b.w, b.h)
    if (withValues || b.key === 'currency') value(b, boxText(form, b.key))
  }

  const signs: [number, number, string][] = [
    [6, 44, prenos ? L.signatureTransfer : L.signature],
    [48, 74, L.placeDate],
    [78, 100, L.valueDate],
  ]
  for (const [x1, x2, text] of signs) {
    out.push(`<line x1="${x1}" y1="86" x2="${x2}" y2="86" stroke="${ink}" stroke-width=".25"/>`)
    label(x1, 89, text)
  }
  out.push(`<line x1="105" y1="8" x2="105" y2="91" stroke="${ink}" stroke-width=".25"/>`)

  out.push(`<text x="204" y="11" font-size="3.6" font-weight="700" fill="${ink}" text-anchor="end" letter-spacing=".1">${esc(L[form.kind])}</text>`)
  if (prenos) {
    label(110, 10.6, L.urgent)
    box(117, 7.8, 3.4, 3.4)
    if (withValues && form.urgent) out.push(`<path d="M117.6 8.3l2.4 2.4M120 8.3l-2.4 2.4" stroke="${ink}" stroke-width=".35"/>`)
  }

  if (ipsPayload) {
    // NBS: printed IPS QR is 2.5–3.3 cm and carries the "NBS IPS QR" caption.
    const qrSize = 25
    const { d, size } = qrPath(ipsPayload)
    const top = 90 - qrSize
    label(204, top - 1, 'NBS IPS QR', 'end')
    out.push(`<g transform="translate(${204 - qrSize} ${top}) scale(${qrSize / size})"><path d="${d}" fill="${ink}"/></g>`)
  }

  // Clip ids must be unique when several slips share a page; derive them from the content
  // so server and client render identical markup.
  const body = out.join('')
  let hash = 5381
  for (let i = 0; i < body.length; i++) hash = ((hash * 33) ^ body.charCodeAt(i)) >>> 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 99" width="210mm" height="99mm" font-family="Arial, Helvetica, sans-serif">`
    + `<rect width="210" height="99" fill="#fff"/>${body.replaceAll('@ID@', `s${hash.toString(36)}c`)}</svg>`
}
