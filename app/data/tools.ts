/**
 * Tools on the page. Each one also has its own URL ("/model-97") where it opens first,
 * with its own title and description, so search engines index it separately.
 * Texts live in i18n under `prefix`: title, lead, metaTitle, metaDescription, faq.<key>.q/a.
 */
export interface Tool {
  slug: string
  /** Component in app/components. */
  component: 'Model97Tool' | 'PaymentCodes' | 'QrCheck' | 'AccountCheck'
  prefix: 'model97' | 'codesPage' | 'checkQr' | 'accountPage'
  /** i18n key of the short name in the footer. */
  nav: 'model97' | 'codes' | 'checkQr' | 'checkAccount'
  /** FAQ entries emitted as FAQPage schema on the tool's URL. */
  faq: string[]
}

export const TOOLS: Tool[] = [
  { slug: 'sifre-placanja', component: 'PaymentCodes', prefix: 'codesPage', nav: 'codes', faq: ['first', 'which', 'wrong'] },
  { slug: 'model-97', component: 'Model97Tool', prefix: 'model97', nav: 'model97', faq: ['what', 'where', 'letters'] },
  { slug: 'provera-qr', component: 'QrCheck', prefix: 'checkQr', nav: 'checkQr', faq: [] },
  { slug: 'provera-racuna', component: 'AccountCheck', prefix: 'accountPage', nav: 'checkAccount', faq: ['format', 'control', 'bank'] },
]

export const findTool = (slug: string) => TOOLS.find(t => t.slug === slug)

/** FAQ of the home page, texts in i18n `faq.<key>.q/a`. */
export const FAQ = ['ips', 'pay', 'batch', 'privacy', 'model', 'code', 'share', 'cyrillic', 'kinds'] as const
