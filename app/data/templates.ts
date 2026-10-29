import type { Localized } from '~/composables/useLocalized'
import type { SlipForm } from '~/composables/useSlip'

export type TemplateCategory = 'documents' | 'foreigners' | 'taxes' | 'business'

export interface TemplatePayment {
  id: string
  label: Localized
  /** Fields prefilled on the slip. Leave amount empty when it depends on the case. */
  preset: Partial<SlipForm>
  /** How to fill the reference number (poziv na broj). */
  referenceHint?: Localized
  /** Amount explanation. */
  amountNote?: Localized
  /** Show the RAT poziv na broj builder (municipality + JBKJS). */
  referenceTool?: 'rat'
  /**
   * Overrides whether an empty reference blocks the slip. Left out, it follows referenceRule():
   * a public-revenue account (840-) with model 97 needs one. Set false where the payee accepts none.
   */
  referenceRequired?: boolean
  /** Who issues the reference; picks the wording of the "reference required" error. Default: the institution. */
  referenceSource?: 'tax'
}

/** Why the reference is mandatory: 'tax' = the Tax Administration decision, 'institution' = any other payee. */
export type ReferenceRule = 'tax' | 'institution'

/** Reference models of public-revenue payments that the treasury matches to the payer. */
const REQUIRED_MODELS = ['97']

/** The payer is identified only by the model and the reference, so an empty one cannot be matched. */
export function referenceRule(payment?: Pick<TemplatePayment, 'preset' | 'referenceRequired' | 'referenceSource'>): ReferenceRule | null {
  if (!payment) return null
  const { account = '', model = '' } = payment.preset
  const required = payment.referenceRequired ?? (account.startsWith('840-') && REQUIRED_MODELS.includes(model))
  return required ? (payment.referenceSource ?? 'institution') : null
}

export interface TemplateFee {
  label: Localized
  amount: number
}

export interface PaymentTemplate {
  slug: string
  category: TemplateCategory
  /** Short name for lists: "Lična karta". */
  name: Localized
  /** Page heading: "Uplatnica za ličnu kartu". */
  title: Localized
  metaDescription: Localized
  intro: Localized
  /** Empty when the institution accepts only slips from its own portal (see officialPay). */
  payments: TemplatePayment[]
  /** Where to pay when a hand-made slip is not accepted. */
  officialPay?: { label: string, url: string }
  /** Fee amounts for information; validity date in feesValidFrom. */
  fees?: TemplateFee[]
  feesValidFrom?: string
  notes: Localized[]
  sources: { label: string, url: string }[]
  /** Month the data was checked against the sources, "YYYY-MM". */
  checkedAt: string
}

const PARAGRAF_RAT = { label: 'Zakon o republičkim administrativnim taksama (Paragraf)', url: 'https://www.paragraf.rs/propisi/zakon_o_republickim_administrativnim_taksama.html' }
const PARAGRAF_ACCOUNTS = { label: 'Pravilnik o računima za uplatu javnih prihoda (Paragraf)', url: 'https://www.paragraf.rs/propisi/pravilnik_o_uslovima_i_nacinu_vodjenja_racuna_za_uplatu_javnih_prihoda_i_raspored_sredstava_sa_tih_racuna.html' }
const EPLATI = { label: 'eUprava — ePlati', url: 'https://plati.euprava.gov.rs/' }
const WELCOME = { label: 'Welcome to Serbia (MUP)', url: 'https://welcometoserbia.gov.rs/' }
const MUP_DOCS = { label: 'MUP — lična dokumenta', url: 'https://www.mup.gov.rs/wps/portal/sr/gradjani/dokumenta/' }
const MUP_FOREIGNERS = { label: 'MUP — informacije za strance', url: 'https://www.mup.gov.rs/wps/portal/sr/gradjani/Informacije%20za%20strance/' }

const BUDGET = 'Budžet Republike Srbije'

const EPLATI_NOTE: Localized = {
  sr: 'MUP evidentira uplatu po pozivu na broj sa portala eUprava (ePlati); ručno popunjen nalog bez tog poziva na broj može ne biti priznat.',
  en: 'The Ministry of Interior (MUP) records the payment by the reference number generated on the eUprava portal (ePlati); a hand-filled slip without that reference may not be recognised.',
  ru: 'МВД (MUP) фиксирует оплату по poziv na broj, созданному на портале eUprava (ePlati); заполненная вручную квитанция без этого poziv na broj может не быть признана.',
}

const WELCOME_NOTE: Localized = {
  sr: 'Takse za boravak stranaca plaćaju se samo onako kako to odredi elektronski zahtev na portalu Welcome to Serbia (karticom ili uplatnicom napravljenom tamo).',
  en: 'Residence fees for foreigners are paid only as the online application on the Welcome to Serbia portal specifies (by card or with a slip created there).',
  ru: 'Пошлины за ВНЖ для иностранцев оплачиваются только так, как указано в электронной заявке на портале Welcome to Serbia (картой или квитанцией, созданной там).',
}

export const TEMPLATES: PaymentTemplate[] = [
  {
    slug: 'republicka-administrativna-taksa',
    category: 'taxes',
    name: { sr: 'Republička administrativna taksa', en: 'Republic administrative fee', ru: 'Республиканская админ. пошлина' },
    title: { sr: 'Uplatnica za republičku administrativnu taksu', en: 'Payment slip for the republic administrative fee (RAT)', ru: 'Квитанция на республиканскую административную пошлину' },
    metaDescription: {
      sr: 'Popunjen nalog za republičku administrativnu taksu: račun 840-742221843-57, šifra 253, model 97 i kalkulator poziva na broj po opštini i JBKJS.',
      en: 'Filled slip for the Serbian republic administrative fee: account 840-742221843-57, code 253, model 97 and a reference builder by municipality and JBKJS.',
      ru: 'Готовая квитанция на сербскую административную пошлину: счёт 840-742221843-57, код 253, модель 97 и расчёт poziv na broj по общине и JBKJS.',
    },
    intro: {
      sr: 'Republička administrativna taksa plaća se za zahteve, rešenja, uverenja i druge spise državnih organa. Račun i šifra su isti svuda, a poziv na broj zavisi od opštine i organa kome se obraćate.',
      en: 'The republic administrative fee is paid for applications, decisions, certificates and other documents of state bodies. The account and code are the same everywhere; the reference depends on the municipality and the authority.',
      ru: 'Республиканская административная пошлина платится за заявления, решения, справки и другие документы госорганов. Счёт и код везде одинаковые, а poziv na broj зависит от общины и органа.',
    },
    payments: [{
      id: 'rat',
      label: { sr: 'Republička administrativna taksa', en: 'Administrative fee', ru: 'Административная пошлина' },
      preset: { kind: 'uplata', payee: BUDGET, account: '840-742221843-57', paymentCode: '253', model: '97', purpose: 'Republička administrativna taksa' },
      referenceTool: 'rat',
      referenceHint: {
        sr: 'Kontrolni broj + šifra opštine (3 cifre) + JBKJS organa (5 cifara), na primer 97 57-223-09852 za matičara u Novom Sadu. JBKJS organa proverite na kjs.trezor.gov.rs.',
        en: 'Check digits + municipality code (3 digits) + JBKJS of the authority (5 digits), e.g. 97 57-223-09852 for the registry office in Novi Sad. Look up the JBKJS at kjs.trezor.gov.rs.',
        ru: 'Контрольные цифры + код общины (3 цифры) + JBKJS органа (5 цифр), например 97 57-223-09852 для загса Нови-Сада. JBKJS органа ищите на kjs.trezor.gov.rs.',
      },
      amountNote: {
        sr: 'Zavisi od spisa. Od 1. jula 2026: zahtev 430, rešenje 740, uverenje 430 RSD.',
        en: 'Depends on the document. From 1 July 2026: application 430, decision 740, certificate 430 RSD.',
        ru: 'Зависит от документа. С 1 июля 2026: заявление 430, решение 740, справка 430 RSD.',
      },
    }],
    notes: [
      {
        sr: 'Od 1. januara 2025. poziv na broj mora da sadrži i JBKJS organa. Stare tabele samo sa šifrom opštine više ne važe.',
        en: 'Since 1 January 2025 the reference must also include the JBKJS of the authority. Old tables with only the municipality code are outdated.',
        ru: 'С 1 января 2025 года в poziv na broj нужно указывать и JBKJS органа. Старые таблицы только с кодом общины устарели.',
      },
      { sr: 'Za uplatu u gotovini na šalteru koristi se šifra 153.', en: 'For cash at the counter use code 153.', ru: 'Для оплаты наличными в окошке используется код 153.' },
    ],
    sources: [PARAGRAF_ACCOUNTS, { label: 'Uprava za trezor — obaveštenje', url: 'https://www.trezor.gov.rs/sr/news/2025_01_15/' }, PARAGRAF_RAT, { label: 'KJS — pretraga JBKJS', url: 'https://kjs.trezor.gov.rs' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'saobracajna-kazna',
    category: 'taxes',
    name: { sr: 'Saobraćajna kazna', en: 'Traffic fine', ru: 'Штраф ПДД' },
    title: { sr: 'Uplatnica za saobraćajnu kaznu (prekršajni nalog)', en: 'Payment slip for a Serbian traffic fine', ru: 'Квитанция для оплаты штрафа ПДД в Сербии' },
    metaDescription: {
      sr: 'Popunjen nalog za plaćanje saobraćajne kazne po prekršajnom nalogu: račun 840-743324843-18, šifra 253, model 97. Pola iznosa ako platite u roku od 8 dana.',
      en: 'Filled slip for a Serbian traffic fine: account 840-743324843-18, code 253, model 97. Pay within 8 days and you pay half.',
      ru: 'Готовая квитанция для штрафа ПДД в Сербии: счёт 840-743324843-18, код 253, модель 97. При оплате в течение 8 дней — половина суммы.',
    },
    intro: {
      sr: 'Novčane kazne za saobraćajne prekršaje koje izriče policija plaćaju se u budžet Republike. Iznos i poziv na broj prepišite sa prekršajnog naloga.',
      en: 'Traffic fines issued by the police go to the Republic budget. Copy the amount and the reference number from the penalty notice (prekršajni nalog).',
      ru: 'Штрафы ПДД, выписанные полицией, платятся в бюджет Республики. Сумму и poziv na broj перепишите из постановления (prekršajni nalog).',
    },
    payments: [{
      id: 'kazna',
      label: { sr: 'Novčana kazna', en: 'Fine', ru: 'Штраф' },
      preset: { kind: 'uplata', payee: BUDGET, account: '840-743324843-18', paymentCode: '253', model: '97', purpose: 'Prekršajni nalog br. ' },
      referenceHint: {
        sr: 'Prepišite sa prekršajnog naloga (sadrži šifru opštine, JBKJS i broj naloga).',
        en: 'Copy it from the penalty notice (it contains the municipality code, JBKJS and notice number).',
        ru: 'Перепишите из постановления (в нём код общины, JBKJS и номер постановления).',
      },
      amountNote: {
        sr: 'Ako platite u roku od 8 dana od prijema naloga, plaćate polovinu iznosa.',
        en: 'Pay within 8 days of receiving the notice and you pay half.',
        ru: 'Если оплатить в течение 8 дней с получения, платится половина суммы.',
      },
    }],
    notes: [{
      sr: 'Uvek proverite račun odštampan na nalogu: kazne gradskih i opštinskih službi (parking, komunalna policija) idu na druge račune.',
      en: 'Always check the account printed on the notice: city and municipal fines (parking, communal police) go to other accounts.',
      ru: 'Всегда сверяйте счёт на постановлении: городские штрафы (парковка, коммунальная полиция) идут на другие счета.',
    }],
    sources: [{ label: 'Pravilnik o računima za uplatu javnih prihoda, Prilog (Paragraf)', url: 'https://www.paragraf.rs/propisi/pravilnik_o_uslovima_i_nacinu_vodjenja_racuna_za_uplatu_javnih_prihoda_i_raspored_sredstava_sa_tih_racuna-2.html' }, { label: 'Prekršajni nalog — 100 pitanja (Paragraf)', url: 'https://www.paragraf.rs/100pitanja/krivicno_pravo/prekrsajni_nalog.html' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'porez-na-imovinu',
    category: 'taxes',
    name: { sr: 'Porez na imovinu', en: 'Property tax', ru: 'Налог на имущество' },
    title: { sr: 'Uplatnica za porez na imovinu fizičkih lica', en: 'Payment slip for Serbian property tax', ru: 'Квитанция на налог на имущество в Сербии' },
    metaDescription: {
      sr: 'Popunjen nalog za porez na imovinu fizičkih lica: račun 840-713121843-57, šifra 253, model 97, poziv na broj iz rešenja. Plaća se tromesečno.',
      en: 'Filled slip for Serbian property tax for individuals: account 840-713121843-57, code 253, model 97, reference from the tax notice. Paid quarterly.',
      ru: 'Готовая квитанция на налог на имущество физлиц в Сербии: счёт 840-713121843-57, код 253, модель 97, poziv na broj из решения. Платится поквартально.',
    },
    intro: {
      sr: 'Porez na imovinu utvrđuje lokalna poreska administracija rešenjem. Račun je isti u celoj Srbiji, a poziv na broj sa šifrom vaše opštine nalazi se u rešenju.',
      en: 'Property tax is assessed by the local tax administration. The account is the same across Serbia; the reference with your municipality code is on the tax notice (rešenje).',
      ru: 'Налог на имущество начисляет местная налоговая решением. Счёт одинаковый по всей Сербии, а poziv na broj с кодом вашей общины указан в решении.',
    },
    payments: [{
      id: 'porez',
      label: { sr: 'Porez na imovinu', en: 'Property tax', ru: 'Налог на имущество' },
      preset: { kind: 'uplata', payee: 'Lokalna poreska administracija', account: '840-713121843-57', paymentCode: '253', model: '97', purpose: 'Porez na imovinu za  . tromesečje' },
      referenceHint: {
        sr: 'Prepišite iz rešenja ili izvoda lokalne poreske administracije.',
        en: 'Copy it from the tax notice or the local tax administration statement.',
        ru: 'Перепишите из решения или выписки местной налоговой.',
      },
      amountNote: {
        sr: 'Tromesečna rata iz rešenja; rok je 45 dana od početka tromesečja.',
        en: 'Quarterly instalment from the notice; due within 45 days from the start of the quarter.',
        ru: 'Квартальный платёж из решения; срок — 45 дней с начала квартала.',
      },
    }],
    notes: [{
      sr: 'Obveznici koji vode poslovne knjige plaćaju na račun 840-713122843-64.',
      en: 'Taxpayers who keep business books pay to account 840-713122843-64.',
      ru: 'Плательщики, ведущие бухучёт, платят на счёт 840-713122843-64.',
    }],
    sources: [PARAGRAF_ACCOUNTS, { label: 'GPU Novi Sad — porez na imovinu', url: 'https://gpu.novisad.rs/sr/porez-na-imovinu-fizichkikh-lica' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'pausalni-porez-i-doprinosi',
    category: 'business',
    name: { sr: 'Paušalni porez i doprinosi', en: 'Flat-rate tax and contributions', ru: 'Паушальный налог и взносы' },
    title: { sr: 'Uplatnice za paušalni porez i doprinose preduzetnika', en: 'Payment slips for flat-rate tax and contributions (paušalci)', ru: 'Квитанции на паушальный налог и взносы ИП' },
    metaDescription: {
      sr: 'Četiri popunjena naloga za paušalce: porez 840-711122843-32, PIO 840-721313843-74, zdravstvo 840-721325843-61, nezaposlenost 840-721331843-06. Šifra 253.',
      en: 'Four filled slips for flat-rate sole traders in Serbia: tax, pension, health and unemployment contributions. Code 253, model 97.',
      ru: 'Четыре готовые квитанции для паушальных ИП в Сербии: налог, пенсионный, медицинский взнос и взнос по безработице. Код 253, модель 97.',
    },
    intro: {
      sr: 'Preduzetnik paušalac svakog meseca plaća porez i tri doprinosa, svaki na svoj račun. Iznose i poziv na broj uzmite iz rešenja Poreske uprave.',
      en: 'A flat-rate sole trader pays the tax and three contributions every month, each to its own account. Take the amounts and reference from the Tax Administration decision.',
      ru: 'Паушальный ИП каждый месяц платит налог и три взноса, каждый на свой счёт. Суммы и poziv na broj берите из решения налоговой (Poreska uprava).',
    },
    payments: [
      { id: 'porez', label: { sr: 'Porez', en: 'Tax', ru: 'Налог' }, preset: { kind: 'uplata', payee: BUDGET, account: '840-711122843-32', paymentCode: '253', model: '97', purpose: 'Porez paušal za ' } },
      { id: 'pio', label: { sr: 'PIO', en: 'Pension (PIO)', ru: 'Пенсионный (PIO)' }, preset: { kind: 'uplata', payee: BUDGET, account: '840-721313843-74', paymentCode: '253', model: '97', purpose: 'Doprinos PIO za ' } },
      { id: 'zdravstvo', label: { sr: 'Zdravstvo', en: 'Health', ru: 'Медицинский' }, preset: { kind: 'uplata', payee: BUDGET, account: '840-721325843-61', paymentCode: '253', model: '97', purpose: 'Doprinos zdravstvo za ' } },
      { id: 'nezaposlenost', label: { sr: 'Nezaposlenost', en: 'Unemployment', ru: 'Безработица' }, preset: { kind: 'uplata', payee: BUDGET, account: '840-721331843-06', paymentCode: '253', model: '97', purpose: 'Doprinos nezaposlenost za ' } },
    ].map((p): TemplatePayment => ({
      ...p,
      referenceSource: 'tax',
      preset: { ...p.preset, kind: 'uplata' },
      referenceHint: {
        sr: 'Iz rešenja Poreske uprave ili primera uplatnice sa QR kodom (od 2026. poziv na broj sadrži BOP za 2026).',
        en: 'From the Tax Administration decision or its sample slip with a QR code (from 2026 the reference contains the BOP for 2026).',
        ru: 'Из решения налоговой или её образца квитанции с QR-кодом (с 2026 года poziv na broj содержит BOP на 2026 год).',
      },
      amountNote: { sr: 'Mesečni iznos iz rešenja.', en: 'Monthly amount from the decision.', ru: 'Ежемесячная сумма из решения.' },
    })),
    notes: [
      { sr: 'Rok je 15. u mesecu za prethodni mesec.', en: 'Due by the 15th of each month for the previous month.', ru: 'Срок — до 15 числа за предыдущий месяц.' },
      { sr: 'Dodajte sve četiri uplatnice u paket i preuzmite ih u jednom PDF-u.', en: 'Add all four slips to the batch and download them as one PDF.', ru: 'Добавьте все четыре квитанции в пакет и скачайте одним PDF.' },
    ],
    sources: [PARAGRAF_ACCOUNTS, { label: 'Paragraf — poziv na broj za paušalce', url: 'https://www.paragraf.rs/dnevne-vesti/050116/050116-vest4.html' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'apr-registracija-preduzetnika',
    category: 'business',
    name: { sr: 'APR registracija preduzetnika', en: 'APR sole trader registration', ru: 'Регистрация ИП в APR' },
    title: { sr: 'Uplatnica za registraciju preduzetnika u APR', en: 'Payment slip for sole trader registration at APR', ru: 'Квитанция за регистрацию ИП в APR' },
    metaDescription: {
      sr: 'Popunjen nalog za naknadu za registraciju osnivanja preduzetnika u APR: račun 840-1308664-17, 2.500 RSD, model 97 i poziv na broj iz APR generatora.',
      en: 'Filled slip for the APR sole trader registration fee: account 840-1308664-17, 2,500 RSD, model 97, reference from the APR generator.',
      ru: 'Готовая квитанция за регистрацию ИП в APR: счёт 840-1308664-17, 2 500 RSD, модель 97, poziv na broj из генератора APR.',
    },
    intro: {
      sr: 'Za osnivanje radnje (preduzetnika) plaća se naknada Agenciji za privredne registre. Poziv na broj je jedinstven i dobija se u APR generatoru.',
      en: 'Registering as a sole trader (preduzetnik) requires a fee to the Business Registers Agency (APR). The reference is unique and comes from the APR generator.',
      ru: 'За регистрацию ИП (preduzetnik) платится сбор Агентству хозяйственных регистров (APR). Poziv na broj уникальный, его выдаёт генератор APR.',
    },
    payments: [{
      id: 'osnivanje',
      label: { sr: 'Naknada za osnivanje', en: 'Registration fee', ru: 'Сбор за регистрацию' },
      preset: { kind: 'uplata', payee: 'Agencija za privredne registre', account: '840-1308664-17', paymentCode: '289', model: '97', amount: '2.500,00', purpose: 'Naknada za osnivanje preduzetnika' },
      referenceHint: {
        sr: 'Obavezno generišite na pretraga2.apr.gov.rs/GeneratorPozivaNaBroj.',
        en: 'Generate it at pretraga2.apr.gov.rs/GeneratorPozivaNaBroj (mandatory).',
        ru: 'Обязательно получите на pretraga2.apr.gov.rs/GeneratorPozivaNaBroj.',
      },
      amountNote: { sr: 'Prema cenovniku APR (važi od 1. januara 2026).', en: 'Per the APR price list (valid from 1 January 2026).', ru: 'По прайсу APR (действует с 1 января 2026).' },
    }],
    notes: [{
      sr: 'APR ne navodi šifru plaćanja; u nalogu je 289 (uplata građanina). Promena podataka i brisanje koštaju po 1.400 RSD.',
      en: 'APR does not specify a payment code; the slip uses 289 (payment by an individual). Changes and deregistration cost 1,400 RSD each.',
      ru: 'APR не указывает код платежа; в квитанции стоит 289 (платёж гражданина). Изменение данных и закрытие стоят по 1 400 RSD.',
    }],
    sources: [{ label: 'APR — naknade za preduzetnike', url: 'https://www.apr.gov.rs/registri/preduzetnici/naknade.4864.html' }, { label: 'APR — računi', url: 'https://www.apr.gov.rs/računi.2443.html' }, { label: 'APR — generator poziva na broj', url: 'https://pretraga2.apr.gov.rs/GeneratorPozivaNaBroj/Home/' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'licna-karta',
    category: 'documents',
    name: { sr: 'Lična karta', en: 'ID card', ru: 'Лична карта' },
    title: { sr: 'Uplatnica za ličnu kartu: kako i gde se plaća', en: 'How to pay for a Serbian ID card', ru: 'Как оплатить личну карту (ID) в Сербии' },
    metaDescription: {
      sr: 'Kako se plaća lična karta: MUP prihvata samo uplatnicu sa portala eUprava (ePlati) sa jedinstvenim pozivom na broj. Link i objašnjenje.',
      en: 'How to pay for a Serbian ID card: MUP only accepts slips from the eUprava portal (ePlati) with a unique reference. Link and explanation.',
      ru: 'Как оплатить сербскую личну карту: MUP принимает только квитанции с портала eUprava (ePlati) с уникальным номером. Ссылка и объяснение.',
    },
    intro: EPLATI_NOTE,
    payments: [],
    officialPay: EPLATI,
    notes: [{
      sr: 'Na portalu izaberite uslugu, a sistem će napraviti nalog sa IPS QR kodom koji platite u banci ili pošti.',
      en: 'Choose the service on the portal and it generates a slip with an IPS QR code that you pay at a bank or post office.',
      ru: 'Выберите услугу на портале, и он создаст квитанцию с IPS QR-кодом, которую можно оплатить в банке или на почте.',
    }],
    sources: [MUP_DOCS, EPLATI],
    checkedAt: '2026-10',
  },
  {
    slug: 'pasos',
    category: 'documents',
    name: { sr: 'Pasoš', en: 'Passport', ru: 'Паспорт' },
    title: { sr: 'Uplatnica za pasoš: kako i gde se plaća', en: 'How to pay for a Serbian passport', ru: 'Как оплатить сербский паспорт' },
    metaDescription: {
      sr: 'Kako se plaća pasoš: samo uplatnicom sa portala eUprava (ePlati). Zahtev za pasoš je oslobođen republičke takse.',
      en: 'How to pay for a Serbian passport: only with a slip from the eUprava portal (ePlati). The application itself is exempt from the administrative fee.',
      ru: 'Как оплатить сербский паспорт: только квитанцией с портала eUprava (ePlati). Само заявление на паспорт освобождено от пошлины.',
    },
    intro: EPLATI_NOTE,
    payments: [],
    officialPay: EPLATI,
    notes: [{
      sr: 'Zahtev za izdavanje pasoša je oslobođen republičke administrativne takse; plaća se obrazac.',
      en: 'The passport application is exempt from the administrative fee; you pay for the form.',
      ru: 'Заявление на паспорт освобождено от административной пошлины; оплачивается бланк.',
    }],
    sources: [MUP_DOCS, EPLATI, PARAGRAF_RAT, { label: 'Paragraf Lex — nove cene dokumenata MUP (Uredba, Sl. glasnik 82/2026)', url: 'https://www.paragraf.rs/dnevne-vesti/090926/090926-vest12.html' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'vozacka-dozvola',
    category: 'documents',
    name: { sr: 'Vozačka dozvola', en: 'Driving licence', ru: 'Водительские права' },
    title: { sr: 'Uplatnica za vozačku dozvolu: takse i plaćanje', en: 'How to pay for a Serbian driving licence', ru: 'Как оплатить водительские права в Сербии' },
    metaDescription: {
      sr: 'Takse za vozačku dozvolu od 1. jula 2026 i gde se plaćaju: izdavanje, duplikat, zamena strane dozvole. Plaćanje preko eUprave.',
      en: 'Serbian driving licence fees from 1 July 2026 and where to pay: issue, duplicate, exchange of a foreign licence. Paid via eUprava.',
      ru: 'Пошлины за водительские права в Сербии с 1 июля 2026 и где платить: выдача, дубликат, замена иностранных прав. Оплата через eUprava.',
    },
    intro: EPLATI_NOTE,
    payments: [],
    officialPay: EPLATI,
    fees: [
      { label: { sr: 'Zahtev', en: 'Application', ru: 'Заявление' }, amount: 370 },
      { label: { sr: 'Izdavanje vozačke dozvole', en: 'Issuing the licence', ru: 'Выдача прав' }, amount: 1490 },
      { label: { sr: 'Duplikat', en: 'Duplicate', ru: 'Дубликат' }, amount: 2120 },
      { label: { sr: 'Zamena strane vozačke dozvole', en: 'Exchange of a foreign licence', ru: 'Замена иностранных прав' }, amount: 11970 },
    ],
    feesValidFrom: '2026-07-01',
    notes: [{
      sr: 'Uz takse se plaća i obrazac vozačke dozvole po ceniku MUP-a. Cena izrade obrasca od 12. septembra 2026: 444 RSD (probna dozvola 468 RSD).',
      en: 'The licence form is paid separately per the MUP price list. Price of the form from 12 September 2026: 444 RSD (probationary licence 468 RSD).',
      ru: 'Бланк прав оплачивается отдельно по прайсу MUP. Цена изготовления бланка с 12 сентября 2026: 444 RSD (пробные права 468 RSD).',
    }],
    sources: [MUP_DOCS, EPLATI, PARAGRAF_RAT, { label: 'Paragraf Lex — nove cene dokumenata MUP (Uredba, Sl. glasnik 82/2026)', url: 'https://www.paragraf.rs/dnevne-vesti/090926/090926-vest12.html' }],
    checkedAt: '2026-10',
  },
  {
    slug: 'privremeni-boravak',
    category: 'foreigners',
    name: { sr: 'Privremeni boravak', en: 'Temporary residence', ru: 'ВНЖ (privremeni boravak)' },
    title: { sr: 'Takse za privremeni boravak stranaca', en: 'Temporary residence fees for foreigners in Serbia', ru: 'Пошлины за ВНЖ в Сербии (privremeni boravak)' },
    metaDescription: {
      sr: 'Koliko košta privremeni boravak u Srbiji od 1. jula 2026: taksa 23.450 RSD i kartica 2.190 RSD. Gde se plaća i ko ima popust.',
      en: 'How much temporary residence in Serbia costs from 1 July 2026: fee 23,450 RSD and card 2,190 RSD. Where to pay and who gets a discount.',
      ru: 'Сколько стоит ВНЖ в Сербии с 1 июля 2026: пошлина 23 450 RSD и карта 2 190 RSD. Где платить и кому положена скидка.',
    },
    intro: WELCOME_NOTE,
    payments: [],
    officialPay: WELCOME,
    fees: [
      { label: { sr: 'Zahtev (RAT tarifni broj 1)', en: 'Application (administrative fee tariff no. 1)', ru: 'Заявление (тарифный номер 1)' }, amount: 430 },
      { label: { sr: 'Taksa za privremeni boravak', en: 'Temporary residence fee', ru: 'Пошлина за ВНЖ' }, amount: 23450 },
      { label: { sr: 'Izdavanje dozvole (kartica)', en: 'Permit card', ru: 'Карта ВНЖ' }, amount: 2190 },
    ],
    feesValidFrom: '2026-07-01',
    notes: [
      {
        sr: 'Za spajanje porodice sa državljaninom Srbije taksa je 50 %; stipendisti Vlade Srbije su oslobođeni.',
        en: 'Family reunification with a Serbian citizen pays 50 %; Serbian government scholarship holders are exempt.',
        ru: 'При воссоединении семьи с гражданином Сербии пошлина 50 %; стипендиаты правительства Сербии освобождены.',
      },
    ],
    sources: [MUP_FOREIGNERS, WELCOME, PARAGRAF_RAT],
    checkedAt: '2026-10',
  },
  {
    slug: 'jedinstvena-dozvola',
    category: 'foreigners',
    name: { sr: 'Jedinstvena dozvola', en: 'Single permit', ru: 'Единое разрешение' },
    title: { sr: 'Takse za jedinstvenu dozvolu za boravak i rad', en: 'Single residence and work permit fees in Serbia', ru: 'Пошлины за единое разрешение на пребывание и работу' },
    metaDescription: {
      sr: 'Koliko košta jedinstvena dozvola za boravak i rad od 1. jula 2026: 22.770 RSD + kartica 2.190 RSD. Zahtev i plaćanje preko portala Welcome to Serbia.',
      en: 'Serbian single permit fees from 1 July 2026: 22,770 RSD + card 2,190 RSD. Apply and pay via the Welcome to Serbia portal.',
      ru: 'Сколько стоит единое разрешение (jedinstvena dozvola) с 1 июля 2026: 22 770 RSD + карта 2 190 RSD. Заявка и оплата через портал Welcome to Serbia.',
    },
    intro: WELCOME_NOTE,
    payments: [],
    officialPay: WELCOME,
    fees: [
      { label: { sr: 'Izdavanje jedinstvene dozvole', en: 'Single permit', ru: 'Единое разрешение' }, amount: 22770 },
      { label: { sr: 'Kartica', en: 'Card', ru: 'Карта' }, amount: 2190 },
      { label: { sr: 'Žalba na odbijanje', en: 'Appeal against refusal', ru: 'Обжалование отказа' }, amount: 10950 },
    ],
    feesValidFrom: '2026-07-01',
    notes: [{
      sr: 'Zahtev se podnosi samo elektronski, lično ili preko poslodavca.',
      en: 'The application is electronic only, by the foreigner or the employer.',
      ru: 'Заявление подаётся только электронно, самим иностранцем или работодателем.',
    }],
    sources: [MUP_FOREIGNERS, WELCOME, PARAGRAF_RAT],
    checkedAt: '2026-10',
  },
  {
    slug: 'stalno-nastanjenje',
    category: 'foreigners',
    name: { sr: 'Stalno nastanjenje', en: 'Permanent residence', ru: 'ПМЖ (stalno nastanjenje)' },
    title: { sr: 'Takse za stalno nastanjenje stranaca', en: 'Permanent residence fees for foreigners in Serbia', ru: 'Пошлины за ПМЖ в Сербии (stalno nastanjenje)' },
    metaDescription: {
      sr: 'Koliko košta stalno nastanjenje u Srbiji od 1. jula 2026: odobrenje 17.100 RSD, lična karta za stranca 6.220 RSD.',
      en: 'Serbian permanent residence fees from 1 July 2026: approval 17,100 RSD, ID card for foreigners 6,220 RSD.',
      ru: 'Сколько стоит ПМЖ в Сербии с 1 июля 2026: одобрение 17 100 RSD, личная карта иностранца 6 220 RSD.',
    },
    intro: WELCOME_NOTE,
    payments: [],
    officialPay: WELCOME,
    fees: [
      { label: { sr: 'Odobrenje stalnog nastanjenja', en: 'Permanent residence approval', ru: 'Одобрение ПМЖ' }, amount: 17100 },
      { label: { sr: 'Lična karta za stranca', en: 'ID card for foreigners', ru: 'Личная карта иностранца' }, amount: 6220 },
    ],
    feesValidFrom: '2026-07-01',
    notes: [{
      sr: 'Način plaćanja proverite u MUP-u ili na portalu pre uplate.',
      en: 'Check the payment method with MUP or on the portal before paying.',
      ru: 'Способ оплаты уточните в MUP или на портале до оплаты.',
    }],
    sources: [MUP_FOREIGNERS, PARAGRAF_RAT],
    checkedAt: '2026-10',
  },
]

export const findTemplate = (slug: string) => TEMPLATES.find(t => t.slug === slug)
