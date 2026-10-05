// Renders social preview images (public/og/<locale>.png) and PWA icons (public/icons/*.png).
// Run after changing texts or the logo: `npm run assets`. Output is committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import QRCode from 'qrcode'

const root = new URL('../public/', import.meta.url)
mkdirSync(new URL('icons/', root), { recursive: true })
mkdirSync(new URL('og/', root), { recursive: true })

const render = (svg, width) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } })
    .render().asPng()

// ---- Icons ---------------------------------------------------------------
const logo = readFileSync(new URL('favicon.svg', root), 'utf8')
const inner = logo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
// Maskable icons need the logo inside the central 80 % safe zone on a full-bleed background.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#111"/><g transform="translate(4.8 4.8) scale(.7)">${inner}</g></svg>`
const apple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#111"/><g transform="translate(3.2 3.2) scale(.8)">${inner}</g></svg>`

writeFileSync(new URL('icons/icon-192.png', root), render(logo, 192))
writeFileSync(new URL('icons/icon-512.png', root), render(logo, 512))
writeFileSync(new URL('icons/maskable-512.png', root), render(maskable, 512))
writeFileSync(new URL('icons/apple-touch-icon.png', root), render(apple, 180))

// ---- Open Graph images ---------------------------------------------------
const TEXT = {
  'sr': ['Nalog za uplatu', 'sa IPS QR kodom', 'Besplatno · više uplatnica u jednom PDF-u'],
  'sr-cyrl': ['Налог за уплату', 'са IPS QR кодом', 'Бесплатно · више уплатница у једном PDF-у'],
  'en': ['Serbian payment slip', 'with IPS QR code', 'Free · several slips in one PDF'],
  'ru': ['Сербская квитанция', 'с IPS QR-кодом', 'Бесплатно · несколько квитанций в одном PDF'],
}
const LABELS = {
  latn: ['uplatilac', 'svrha uplate', 'primalac', 'šifra plaćanja', 'iznos', 'račun primaoca', 'NALOG ZA UPLATU'],
  cyrl: ['уплатилац', 'сврха уплате', 'прималац', 'шифра плаћања', 'износ', 'рачун примаоца', 'НАЛОГ ЗА УПЛАТУ'],
}

const qrSvg = await QRCode.toString(
  'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3596,13|SF:189|RO:97163220000111111111000',
  { type: 'svg', errorCorrectionLevel: 'M', margin: 0 },
)
const qrPath = qrSvg.match(/<path[^>]*stroke="#000000"[^>]*d="([^"]+)"/)?.[1]
const qrSize = Number(qrSvg.match(/viewBox="0 0 (\d+)/)[1])

function og(locale) {
  const [t1, t2, sub] = TEXT[locale]
  const L = LABELS[locale === 'sr-cyrl' ? 'cyrl' : 'latn']
  const line = '#111'
  const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${line}" stroke-width="2"/>`
  const label = (x, y, s) => `<text x="${x}" y="${y}" font-size="15" fill="${line}">${s}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#111"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(72 72)" font-family="Segoe UI, Arial, sans-serif">
    <g transform="scale(1.75)">${inner}</g>
    <text x="72" y="40" font-size="34" font-weight="700" fill="#fff">Uplatnica</text>
    <text x="0" y="150" font-size="64" font-weight="800" fill="#fff">${t1}</text>
    <text x="0" y="226" font-size="64" font-weight="800" fill="#fff">${t2}</text>
    <text x="0" y="288" font-size="28" fill="#9a9a9a">${sub}</text>
  </g>
  <g transform="translate(650 412) rotate(-4)" font-family="Arial, sans-serif">
    <rect x="0" y="0" width="520" height="245" rx="6" fill="#fff"/>
    ${label(20, 30, L[0])}${box(20, 38, 225, 44)}
    ${label(20, 104, L[1])}${box(20, 112, 225, 44)}
    ${label(20, 178, L[2])}${box(20, 186, 225, 44)}
    <line x1="262" y1="20" x2="262" y2="230" stroke="${line}" stroke-width="2"/>
    <text x="280" y="34" font-size="18" font-weight="700" fill="${line}">${L[6]}</text>
    ${label(280, 62, L[3])}${box(280, 70, 100, 30)}
    <text x="300" y="91" font-size="16" font-weight="700" font-family="Courier New, monospace" fill="#1f2937">189</text>
    ${label(395, 62, L[4])}${box(395, 70, 105, 30)}
    <text x="401" y="91" font-size="16" font-weight="700" font-family="Courier New, monospace" fill="#1f2937">3.596,13</text>
    ${label(280, 122, L[5])}${box(280, 130, 220, 28)}
    <g transform="translate(410 165) scale(${70 / qrSize})"><path d="${qrPath}" stroke="#000" fill="none"/></g>
  </g>
</svg>`
}

for (const locale of Object.keys(TEXT)) {
  writeFileSync(new URL(`og/${locale}.png`, root), render(og(locale), 1200))
}
console.log('assets generated')
