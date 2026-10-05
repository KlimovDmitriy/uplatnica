/**
 * Serbian Latin → Cyrillic transliteration (one-to-one standard alphabet).
 * Leaves alone: {placeholders}, URLs, e-mails and the Latin-only words listed in KEEP.
 */
const DIGRAPHS: Record<string, string> = {
  LJ: 'Љ', Lj: 'Љ', lj: 'љ',
  NJ: 'Њ', Nj: 'Њ', nj: 'њ',
  DŽ: 'Џ', Dž: 'Џ', dž: 'џ',
}

const LETTERS: Record<string, string> = {
  A: 'А', B: 'Б', V: 'В', G: 'Г', D: 'Д', Đ: 'Ђ', E: 'Е', Ž: 'Ж', Z: 'З', I: 'И', J: 'Ј', K: 'К', L: 'Л',
  M: 'М', N: 'Н', O: 'О', P: 'П', R: 'Р', S: 'С', T: 'Т', Ć: 'Ћ', U: 'У', F: 'Ф', H: 'Х', C: 'Ц', Č: 'Ч', Š: 'Ш',
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', đ: 'ђ', e: 'е', ž: 'ж', z: 'з', i: 'и', j: 'ј', k: 'к', l: 'л',
  m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', ć: 'ћ', u: 'у', f: 'ф', h: 'х', c: 'ц', č: 'ч', š: 'ш',
}

/** Words kept in Latin script: brands and technical acronyms that Cyrillic texts also write in Latin. */
const KEEP = new Set([
  'Uplatnica', 'Buy', 'Me', 'Coffee', 'DonatePay', 'DonationAlerts', 'Viber', 'WhatsApp', 'Telegram', 'Google', 'Android', 'iPhone',
  'IPS', 'QR', 'RSD', 'EUR', 'PDF', 'PNG', 'PWA', 'USDT', 'USDC', 'TON', 'BTC', 'ETH', 'ERC', 'TRC',
])

// {placeholder} | url | e-mail | word
const TOKEN = /(\{[^}]*\}|https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+|[\p{L}]+)/gu

function word(w: string): string {
  if (KEEP.has(w)) return w
  let out = ''
  for (let i = 0; i < w.length; i++) {
    const pair = w.slice(i, i + 2)
    if (DIGRAPHS[pair]) {
      out += DIGRAPHS[pair]
      i++
    }
    else {
      out += LETTERS[w[i]!] ?? w[i]
    }
  }
  return out
}

export function toCyrillic(text: string): string {
  return text.replace(TOKEN, t => (t.startsWith('{') || t.includes('://') || t.includes('@')) ? t : word(t))
}

export function toCyrillicDeep<T>(value: T): T {
  if (typeof value === 'string') return toCyrillic(value) as T
  if (Array.isArray(value)) return value.map(toCyrillicDeep) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toCyrillicDeep(v)])) as T
  }
  return value
}

const TO_LATIN: Record<string, string> = Object.fromEntries([
  ...Object.entries(LETTERS).map(([lat, cyr]) => [cyr, lat]),
  ['Љ', 'Lj'], ['љ', 'lj'], ['Њ', 'Nj'], ['њ', 'nj'], ['Џ', 'Dž'], ['џ', 'dž'],
])

/** Serbian Cyrillic → Latin. The IPS QR standard allows Latin letters only. */
export function toLatin(text: string): string {
  return text.replace(/[Ѐ-ӿ]/g, ch => TO_LATIN[ch] ?? ch)
}
