# Localisation plan — Mongolia

What we change, in what order, and what we refuse to change. Evidence is in
`01-mongolia-market.md`. The product stays a public review platform throughout.

## 1. Language

- **Mongolian is the default**; English is one click away in the header. A stored preference wins,
  otherwise a browser that asks for English gets English and everyone else gets Mongolian.
- Interface strings are translated. **User content is never translated**: company names,
  descriptions, reviews and replies appear exactly as written.
- Search is made Cyrillic-correct by keeping a folded copy of each company's searchable text and
  folding the query the same way, in Ruby, where Unicode case rules are respected.

## 2. Categories

The category set becomes the one Mongolians actually shop for, with a Mongolian and an English
name per category. The list is data, not code, so it can grow without a release.

| Mongolian | English |
|---|---|
| Хоол, ундаа | Food & drink |
| Гоо сайхан, эрүүл мэнд | Beauty & wellbeing |
| Эмнэлэг, эрүүл мэнд | Health & clinics |
| Авто үйлчилгээ | Car services |
| Барилга, засвар | Construction & repair |
| Гэр ахуйн үйлчилгээ | Home services |
| Боловсрол, сургалт | Education & training |
| Аялал жуулчлал | Tourism & hospitality |
| Мэдээллийн технологи | IT & software |
| Санхүү, даатгал | Finance & insurance |
| Хууль, өмгөөлөл | Legal services |
| Тээвэр, хүргэлт | Delivery & logistics |
| Хурим, арга хэмжээ | Events & weddings |
| Үл хөдлөх хөрөнгө | Real estate |
| Амьтан, тэжээвэр | Animals & pets |
| Дэлгүүр, худалдаа | Shops & retail |

**The "More" tile is deleted.** It was a row in the categories table pretending to be a category,
and clicking it returned to the same page — the bug reported from the field. The home page now
shows the first eight categories and a plain "View all categories" link; the category index shows
every category with the number of listed companies.

## 3. Places

Location stops being free text and becomes a list people recognise: the nine Ulaanbaatar districts
first, then the larger aimag centres. Both names are stored, and district is a filter on the
category and search pages.

## 4. Contact, the Mongolian way

| Change | Reason |
|---|---|
| Phone is the primary call to action on a company page and card, as a `tel:` link | People call; a number you cannot tap is friction |
| A Facebook page field, shown next to the website | For most Mongolian SMEs the Facebook page *is* the website |
| Phone input defaults to +976 and expects 8 digits | One national format, so we can validate and display it properly |
| A company registration number (улсын бүртгэлийн дугаар) field, shown as a trust line and checked during verification | It is the signal Mongolians use to tell a real company from a Facebook shop |

## 5. What stays exactly as it is

- The review contract: one review per customer per company, published under a real name, editable,
  moderated, with the business allowed one reply.
- The four roles and their panels.
- The single sign-in front door built in the previous round.
- The visual identity: the yellow brand, the card layout, the typography.

## 6. Out of scope this round, and why

| Item | Why not now |
|---|---|
| Opening hours and "open now" | Genuinely expected here, but it needs an hours model, holidays and a timezone-correct "open now" query. It deserves its own round rather than a rushed field. |
| Messenger deep links (`m.me`) | Depends on the Facebook page being verified; we add the page field first and link out once we can trust it. |
| Mongolian phone verification by SMS | Needs a local SMS provider contract; the email one-time code already covers sign-in. |
| Traditional Mongolian script | Not used for everyday commerce; Cyrillic is the working script. |
| Aimag-level sub-filters beyond the centres | Wait until there are enough listings outside Ulaanbaatar to be worth filtering. |
