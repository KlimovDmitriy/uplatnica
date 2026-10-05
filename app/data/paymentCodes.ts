import type { Localized } from '~/composables/useLocalized'

export interface PaymentCode {
  /** Last two digits: the basis of payment (osnov plaćanja). */
  base: string
  label: Localized
}

/**
 * Osnovi plaćanja, Prilog 3 of the NBS "Odluka o obliku, sadržini i načinu korišćenja obrazaca
 * platnih naloga za izvršenje platnih transakcija u dinarima" (Sl. glasnik …125/2020, 82/2024).
 * First digit: 1 cash, 2 non-cash, 3 settlement, 9 rebooking; IPS QR allows only 1 and 2.
 * Checked 2026-09.
 */
export const PAYMENT_CODES_SOURCE = 'https://www.paragraf.rs/propisi/odluka_o_obliku_sadrzini_i_nacinu_koriscenja_obrazaca_platnih_naloga_za_izvrsenje_platnih_transakcija_u_dinarima.html'

const c = (base: string, sr: string, en: string, ru: string): PaymentCode => ({ base, label: { sr, en, ru } })

export const PAYMENT_CODES: PaymentCode[] = [
  c('20', 'Promet robe i usluga – međufazna potrošnja', 'Goods and services – intermediate consumption', 'Товары и услуги – промежуточное потребление'),
  c('21', 'Promet robe i usluga – finalna potrošnja', 'Goods and services – final consumption', 'Товары и услуги – конечное потребление'),
  c('22', 'Usluge javnih preduzeća', 'Public utility services', 'Услуги коммунальных предприятий'),
  c('23', 'Investicije u objekte i opremu', 'Investment in buildings and equipment', 'Инвестиции в объекты и оборудование'),
  c('24', 'Investicije – ostalo', 'Investment – other', 'Инвестиции – прочее'),
  c('25', 'Zakupnine stvari u javnoj svojini', 'Rent of publicly owned property', 'Аренда государственного имущества'),
  c('26', 'Zakupnine', 'Rent', 'Аренда'),
  c('27', 'Subvencije, regresi i premije s posebnih računa', 'Subsidies, rebates and premiums from special accounts', 'Субсидии, компенсации и премии со специальных счетов'),
  c('28', 'Subvencije, regresi i premije sa ostalih računa', 'Subsidies, rebates and premiums from other accounts', 'Субсидии, компенсации и премии с прочих счетов'),
  c('29', 'Digitalna imovina', 'Digital assets', 'Цифровые активы'),
  c('30', 'Promet nepokretnosti', 'Real estate transactions', 'Сделки с недвижимостью'),
  c('31', 'Carine i druge uvozne dažbine', 'Customs and other import duties', 'Таможенные и другие ввозные пошлины'),
  c('40', 'Zarade i druga primanja zaposlenih', 'Salaries and other employee income', 'Зарплаты и другие выплаты сотрудникам'),
  c('41', 'Neoporeziva primanja zaposlenih, socijalna i druga davanja izuzeta od oporezivanja', 'Non-taxable employee income, social and other tax-exempt benefits', 'Необлагаемые выплаты сотрудникам, социальные и другие освобождённые от налога выплаты'),
  c('42', 'Naknade zarada na teret poslodavca', 'Salary compensation paid by the employer', 'Компенсации зарплаты за счёт работодателя'),
  c('44', 'Isplate preko omladinskih i studentskih zadruga', 'Payments via youth and student cooperatives', 'Выплаты через молодёжные и студенческие кооперативы'),
  c('45', 'Penzije', 'Pensions', 'Пенсии'),
  c('46', 'Obustave od penzija i zarada', 'Deductions from pensions and salaries', 'Удержания из пенсий и зарплат'),
  c('47', 'Naknade zarada na teret drugih isplatilaca', 'Salary compensation paid by other payers', 'Компенсации зарплаты за счёт других плательщиков'),
  c('48', 'Prihodi fizičkih lica od kapitala i drugih imovinskih prava', 'Individuals\' income from capital and other property rights', 'Доходы физлиц от капитала и имущественных прав'),
  c('49', 'Ostali prihodi fizičkih lica', 'Other income of individuals', 'Прочие доходы физлиц'),
  c('53', 'Uplata javnih prihoda izuzev poreza i doprinosa po odbitku', 'Public revenue (taxes, fees, fines) except withholding taxes', 'Госплатежи (налоги, пошлины, штрафы), кроме удерживаемых у источника'),
  c('54', 'Uplata poreza i doprinosa po odbitku', 'Withholding taxes and contributions', 'Налоги и взносы, удерживаемые у источника'),
  c('57', 'Povraćaj više naplaćenih ili pogrešno naplaćenih tekućih prihoda', 'Refund of overcharged or wrongly charged revenue', 'Возврат излишне или ошибочно взысканных сумм'),
  c('58', 'Preknjižavanje više uplaćenih ili pogrešno uplaćenih tekućih prihoda', 'Rebooking of overpaid or wrongly paid revenue', 'Перенос излишне или ошибочно уплаченных сумм'),
  c('60', 'Premije osiguranja i nadoknada štete', 'Insurance premiums and damage compensation', 'Страховые премии и возмещение ущерба'),
  c('61', 'Raspored tekućih prihoda', 'Distribution of current revenue', 'Распределение текущих доходов'),
  c('62', 'Transferi u okviru državnih organa', 'Transfers between state bodies', 'Переводы между госорганами'),
  c('63', 'Ostali transferi', 'Other transfers', 'Прочие переводы'),
  c('64', 'Prenos sredstava iz budžeta za obezbeđenje povraćaja više naplaćenih tekućih prihoda', 'Budget transfer to fund refunds of overcharged revenue', 'Перевод из бюджета для возврата излишне взысканных сумм'),
  c('65', 'Uplata pazara', 'Deposit of daily takings', 'Сдача выручки'),
  c('66', 'Isplata gotovine', 'Cash withdrawal', 'Выдача наличных'),
  c('70', 'Kratkoročni krediti', 'Short-term loans', 'Краткосрочные кредиты'),
  c('71', 'Dugoročni krediti', 'Long-term loans', 'Долгосрочные кредиты'),
  c('72', 'Aktivna kamata', 'Interest received', 'Полученные проценты'),
  c('73', 'Polaganje oročenih depozita', 'Placing term deposits', 'Размещение срочных депозитов'),
  c('75', 'Ostali plasmani', 'Other placements', 'Прочие размещения'),
  c('76', 'Otplata kratkoročnih kredita', 'Short-term loan repayment', 'Погашение краткосрочных кредитов'),
  c('77', 'Otplata dugoročnih kredita', 'Long-term loan repayment', 'Погашение долгосрочных кредитов'),
  c('78', 'Povraćaj oročenih depozita', 'Return of term deposits', 'Возврат срочных депозитов'),
  c('79', 'Pasivna kamata', 'Interest paid', 'Уплаченные проценты'),
  c('80', 'Eskont hartija od vrednosti', 'Discounting of securities', 'Учёт ценных бумаг'),
  c('81', 'Pozajmice osnivača za likvidnost', 'Founder loans for liquidity', 'Займы учредителя на ликвидность'),
  c('82', 'Povraćaj pozajmice za likvidnost osnivaču', 'Repayment of a liquidity loan to the founder', 'Возврат займа на ликвидность учредителю'),
  c('83', 'Naplata čekova građana', 'Collection of personal cheques', 'Инкассо чеков граждан'),
  c('84', 'Platne kartice', 'Payment cards', 'Платёжные карты'),
  c('85', 'Menjački poslovi', 'Currency exchange', 'Обмен валюты'),
  c('86', 'Kupoprodaja deviza', 'Purchase and sale of foreign currency', 'Купля-продажа валюты'),
  c('87', 'Donacije i sponzorstva', 'Donations and sponsorship', 'Пожертвования и спонсорство'),
  c('88', 'Donacije', 'Donations', 'Пожертвования'),
  c('89', 'Transakcije po nalogu građana', 'Transactions ordered by individuals', 'Операции по поручению граждан'),
  c('90', 'Druge transakcije', 'Other transactions', 'Прочие операции'),
]
