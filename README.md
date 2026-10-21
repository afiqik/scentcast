# ScentCast Malaysia

**Kecerdasan Wangian Tropika** — a perfume discovery platform built for Malaysia's
tropical climate. Browse a fragrance directory, find affordable dupes, get
weather-aware scent recommendations, and manage your profile — in both Bahasa
Melayu and English.

Built as a lightweight vanilla-JS single-page app on **Vite**, backed by
**Firebase** (Firestore, Realtime Database, Hosting).

## Features

- **Fragrance directory** — browse and search a curated perfume catalog
- **Dupe finder** — discover affordable alternatives to designer scents
- **Weather-aware recommendations** — suggestions tuned to live tropical weather
- **Community** — reviews and comments on fragrances
- **Accounts & profiles** — sign in, manage your profile, with an admin role for
  catalog management
- **Bilingual** — full Bahasa Melayu / English interface (`src/i18n/`)
- **Neumorphic UI** with light/dark theming

## Tech stack

| Layer | Tech |
|---|---|
| Build | Vite 6 |
| Frontend | Vanilla JS (component + view modules, no framework) |
| Backend | Firebase — Firestore, Realtime Database |
| Hosting | Firebase Hosting (`dist/`) |

## Getting started

```bash
npm install
npm run dev        # start the Vite dev server
```

Other commands:

| | |
|---|---|
| `npm run build` | production build into `dist/` |
| `npm run preview` | preview the production build |
| `npm test` | run the end-to-end test runner |

### Firebase configuration

The client Firebase config lives in `src/firebase.js`. A Firebase **web API key**
is designed to be shipped to the browser and is not a secret — access is governed
by the security rules in `firestore.rules` and `database.rules.json`, not by
hiding the key.

To run against your own Firebase project, set the project in `.firebaserc` and
update `src/firebase.js` with your project's web config.

## Project layout

    src/components/   reusable UI pieces (Header, Footer, PerfumeCard, AuthModal…)
    src/views/        screens (Home, Directory, Detail, Search, Dupe, Weather, Profile, Admin…)
    src/services/     Firebase + domain logic (auth, perfumes, weather, presence, i18n, theme)
    src/i18n/         Bahasa Melayu + English strings
    design/           design references and mockups
    scripts/          Firestore / Realtime DB seed scripts
    tests/            end-to-end tests
    firestore.rules, database.rules.json   Firebase security rules

## License

Released under the [MIT License](LICENSE).
