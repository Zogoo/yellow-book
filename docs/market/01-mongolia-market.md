# Mongolia: market note and user expectations

Role: product manager. Purpose: decide how a Trustpilot-style review platform has to behave to
work in Mongolia. This note is the evidence; `02-localisation-plan.md` is what we build from it.

## 1. The market in numbers

| Fact | Figure | Why it matters here |
|---|---|---|
| Population online | 2.90m people, 83.0% penetration (Jan 2025) | The audience is effectively "everyone with a phone", not an urban elite |
| Social media identities | 2.60m, 74.4% of the population | Discovery happens in social feeds, not in search engines |
| Facebook reach | ~3.13m accounts, 91.9% of the population (Nov 2025) | Facebook **is** the business internet here |
| Messenger reach | 2.81m, 82.4% | First contact with a business is usually a message, not a form |
| Instagram reach | 1.28m, 37.5% | Secondary, skews young and urban |
| Mobile connections | 141% of the population (Jan 2025) | Everyone has a phone, many have two SIMs |
| Measured web traffic | ~76% desktop / 23% mobile (Statcounter, Aug 2026) | Traffic is measured where people read news and work. **Design for both** |
| Phone numbers | 8 digits, no area codes, mobiles start 8, 9 or 6 | A single national format we can validate and display properly |
| Ulaanbaatar structure | 9 districts, 204 khoroo | "Which district" is how people locate a business, not a street address |

The two traffic figures look contradictory and both are true: phones are universal, while the
sites Statcounter measures in Mongolia are read heavily from desks at work. The conclusion is not
"mobile-only" — it is that the same page must be genuinely good at 375px and at 1440px.

## 2. How Mongolians actually find and judge a business today

1. **They ask a Facebook group.** Groups are the country's classifieds, recommendation engine and
   complaints department at once. Group admins act as gatekeepers and, in effect, as reputation
   brokers.
2. **They look for the business's Facebook page.** For most small and medium businesses in
   Mongolia the Facebook page *is* the website. Many good businesses have no website at all.
3. **They call.** A phone number that can be tapped is worth more than a contact form. Messenger
   is the second channel; email is a distant third and is mostly used with institutions.
4. **They check who is behind it.** A registered company number (улсын бүртгэлийн дугаар) and a
   real address signal that a business is not a one-week Facebook shop.
5. **They trust people they can identify.** An anonymous five-star rating carries little weight; a
   named person describing what happened carries a lot.

## 3. What this implies for us

**We are competing with a Facebook group, not with Google.** A group thread gives a Mongolian user
a named neighbour's opinion within minutes. To be worth using instead, we have to be faster to
scan, honest about what we do not know, and reachable in one tap.

Concretely, a Mongolian user arriving on a company page expects, in this order:

1. Is it open and how do I reach it — **phone first**, Facebook second.
2. Where is it — **district**, not a postcode.
3. What do real people say — names, dates, and the business's own reply.
4. Is it a real registered company.

And a Mongolian business owner expects:

1. To claim their page in minutes, using a phone number they already own.
2. To answer a complaint publicly, in Mongolian.
3. Not to be charged before they see value.

## 4. Language

Mongolian Cyrillic is the working language of the country; English is a second language of
business, government and tourism. A service like this has to open in Mongolian and let the user
switch to English, not the other way round. Two practical consequences:

- **Search must be Cyrillic-correct.** Case folding for Cyrillic does not work with the ASCII
  rules most databases apply by default, so "Гоо сайхан" and "гоо сайхан" must be made to match
  deliberately.
- **Category names, menus and buttons must be idiomatic Mongolian**, not a machine rendering of
  English marketing copy. Company names, reviews and owner replies stay exactly as written.

## 5. Categories that matter here

The generic international category set misses what Mongolians actually search for. The set below
reflects everyday demand in Ulaanbaatar and the aimag centres:

food and drink, beauty and wellbeing, health and clinics, car services, construction and repair,
home services, education and training, tourism and hospitality, IT and software, finance and
insurance, legal services, delivery and logistics, events and weddings, real estate, animals and
pets, shops and retail.

## 6. What we deliberately keep from the original concept

This is still a public review platform: anyone can read, customers write reviews under their own
name, businesses reply once, moderators keep it clean. Localisation changes the language, the
categories, the contact affordances and the trust signals. It does not change what the product is.

## Sources

- [Digital 2025: Mongolia — DataReportal](https://datareportal.com/reports/digital-2025-mongolia)
- [Social media users in Mongolia 2025 — NapoleonCat](https://stats.napoleoncat.com/social-media-users-in-mongolia/2025/)
- [Platform market share, Mongolia — Statcounter](https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/mongolia)
- [Telephone numbers in Mongolia — Wikipedia](https://en.wikipedia.org/wiki/Telephone_numbers_in_Mongolia)
- [Districts of Ulaanbaatar — Wikipedia](https://en.wikipedia.org/wiki/Districts_of_Ulaanbaatar)
- [Social media landscape Mongolia — Hashmeta](https://hashmeta.com/blog/social-media-landscape-mongolia-the-ultimate-guide-to-asias-last-untapped-digital-market/)
- [Facebook's influence in Mongolia — Tebello Qhotsokoane](https://tebelloq.medium.com/from-getting-jobs-to-winning-elections-facebook-wields-heavy-influence-in-mongolia-cde19bcbdd91)
