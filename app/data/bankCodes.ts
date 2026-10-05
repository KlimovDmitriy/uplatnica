export interface BankCode {
  /** First three digits of the account. */
  code: string
  name: string
}

/**
 * NBS "Odluka o određivanju jedinstvenih identifikacionih brojeva pružalaca platnih usluga",
 * G. br. 7097 of 8 Sep 2026. A legal successor may keep using the code of a merged bank,
 * so older prefixes can still appear on valid accounts.
 */
export const BANK_CODES_SOURCE = 'https://www.nbs.rs/export/sites/NBS_site/documents/propisi/propisi-ps/pu_jedinstveni_id_brojevi.pdf'

export const BANK_CODES: BankCode[] = [
  { code: '105', name: 'AIK Banka' },
  { code: '115', name: 'Yettel Bank' },
  { code: '145', name: 'Adriatic Bank' },
  { code: '155', name: 'Halkbank' },
  { code: '160', name: 'Banca Intesa' },
  { code: '165', name: 'Addiko Bank' },
  { code: '170', name: 'UniCredit Bank Srbija' },
  { code: '190', name: 'Alta banka' },
  { code: '200', name: 'Banka Poštanska štedionica' },
  { code: '205', name: 'NLB Banka' },
  { code: '220', name: 'ProCredit Bank' },
  { code: '265', name: 'Raiffeisen banka' },
  { code: '295', name: 'Srpska banka' },
  { code: '325', name: 'OTP banka Srbija' },
  { code: '340', name: 'Erste Bank' },
  { code: '370', name: '3 Banka' },
  { code: '375', name: 'API Bank' },
  { code: '380', name: 'Mirabank' },
  { code: '385', name: 'Bank of China Srbija' },
  { code: '840', name: 'Republika Srbija – Uprava za trezor (javni prihodi)' },
  { code: '908', name: 'Narodna banka Srbije' },
]
