/**
 * "Support the author" settings. Empty values are hidden on the site,
 * so fill only what you actually use.
 */
export interface CryptoWallet {
  id: string
  coin: string
  network: string
  address: string
}

export interface DonateLink {
  id: string
  label: string
  url: string
}

export const donateConfig = {
  /** Serbian bank account for IPS QR / "Prenesi" in mobile banking. */
  ips: {
    account: '', // e.g. '160-0000000000000-00'
    name: '', // e.g. 'Ime Prezime\nBeograd'
    purpose: 'Podrška autoru',
    amounts: [300, 500, 1000, 2000],
  },

  // Buy Me a Coffee is left out on purpose: it does not pay out to Serbia.
  links: [
    { id: 'kofi', label: 'Ko-fi', url: '' }, // needs PayPal or Stripe on the receiving side
    { id: 'donatepay', label: 'DonatePay', url: '' }, // https://new.donatepay.ru/@<you>
    { id: 'donationalerts', label: 'DonationAlerts', url: '' }, // https://www.donationalerts.com/r/<you>
  ] satisfies DonateLink[],

  crypto: [
    { id: 'usdt-trc20', coin: 'USDT', network: 'TRC-20 (Tron)', address: '' },
    { id: 'usdt-ton', coin: 'USDT', network: 'TON', address: '' },
    { id: 'usdc-erc20', coin: 'USDC', network: 'ERC-20 (Ethereum)', address: '' },
    { id: 'usdc-sol', coin: 'USDC', network: 'Solana', address: '' },
    { id: 'ton', coin: 'TON', network: 'TON', address: '' },
    { id: 'btc', coin: 'BTC', network: 'Bitcoin', address: '' },
    { id: 'eth', coin: 'ETH', network: 'Ethereum', address: '' },
  ] satisfies CryptoWallet[],
}
