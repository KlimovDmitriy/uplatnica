import { donateConfig, type CryptoFamilyId, type CryptoNetwork } from '../config/donate'
import { buildEpcQr, isBic, isIbanChecksumValid, normalizeIban } from '#shared/utils/epc'
import { isAccountChecksumValid, normalizeAccount, validateIps, type IpsInput } from '#shared/utils/ips'

/** Raw NUXT_PUBLIC_DONATE_* values (runtimeConfig.public.donate). */
export interface DonateEnv {
  ipsAccount: string
  ipsName: string
  sepaIban: string
  sepaBic: string
  sepaName: string
  sepaBank: string
  kofi: string
  githubSponsors: string
  donatepay: string
  donationalerts: string
  cryptoTron: string
  cryptoTon: string
  cryptoSolana: string
  cryptoEvm: string
}

export interface DonateNetwork extends CryptoNetwork {
  family: CryptoFamilyId
  address: string
}

/**
 * The "support the author" methods visible in `locale`: empty or invalid ones are left out, and
 * links meant for other languages (DonatePay, DonationAlerts: ru only) don't exist outside theirs.
 * `enabled` is computed from what is visible in this locale, so a build with only the ru links set
 * has no donate UI on sr/en and has it on ru.
 */
export function resolveDonate(cfg: DonateEnv, locale: string) {
  const clean = (v: unknown) => String(v ?? '').trim()

  // A donate QR the NBS validator rejects is worse than none: IPS needs a valid account
  // checksum and a payload (name, purpose lengths) that passes validation.
  const ipsAccount = normalizeAccount(clean(cfg.ipsAccount))
  // "\n" in an env value separates the payee lines (name, city).
  const ipsName = clean(cfg.ipsName).replace(/\n/g, '\n')
  const ipsInput = (amount: number): IpsInput => ({
    account: ipsAccount ?? '',
    payee: ipsName,
    amount,
    paymentCode: '289',
    purpose: donateConfig.ips.purpose,
  })
  const ipsAmounts = donateConfig.ips.amounts
  const ips = ipsAccount && ipsName && isAccountChecksumValid(ipsAccount)
    && validateIps(ipsInput(ipsAmounts[1] ?? ipsAmounts[0] ?? 500)).length === 0
    ? { account: ipsAccount, input: ipsInput }
    : null

  // SEPA needs a valid IBAN and a BIC (Serbia is outside the EEA, so the EPC QR must carry it).
  const iban = normalizeIban(clean(cfg.sepaIban))
  const bic = clean(cfg.sepaBic).toUpperCase()
  const sepaName = clean(cfg.sepaName)
  const sepa = sepaName && isIbanChecksumValid(iban) && isBic(bic)
    ? {
        name: sepaName,
        iban,
        bic,
        bank: clean(cfg.sepaBank),
        purpose: donateConfig.sepa.purpose,
        payload: buildEpcQr({ bic, name: sepaName, iban, text: donateConfig.sepa.purpose }),
      }
    : null

  const urls: Record<string, string> = {
    'kofi': clean(cfg.kofi),
    'github-sponsors': clean(cfg.githubSponsors),
    'donatepay': clean(cfg.donatepay),
    'donationalerts': clean(cfg.donationalerts),
  }
  const links = donateConfig.links
    .filter(l => !l.locales || l.locales.includes(locale))
    .map(l => ({ ...l, url: urls[l.id] ?? '' }))
    .filter(l => /^https:\/\/\S+$/.test(l.url))

  const addresses: Record<CryptoFamilyId, string> = {
    tron: clean(cfg.cryptoTron),
    ton: clean(cfg.cryptoTon),
    solana: clean(cfg.cryptoSolana),
    evm: clean(cfg.cryptoEvm),
  }
  const networks: DonateNetwork[] = donateConfig.crypto.flatMap(f =>
    addresses[f.id] ? f.networks.map(n => ({ ...n, family: f.id, address: addresses[f.id] })) : [])

  return { ips, sepa, links, networks, enabled: !!(ips || sepa || links.length || networks.length) }
}
