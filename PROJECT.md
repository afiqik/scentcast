# Project: ScentCast Malaysia Platform Upgrade

## Architecture
Vanilla JavaScript ES Modules + Firebase (Authentication, Firestore, Realtime Database) with Tailwind CSS.
- **Client Application**: Pure modular ES Modules served statically, no framework or build bundler required.
- **Routing**: Client-side hash routing (`src/main.js`) handling 8 canonical routes with query param extraction.
- **State & Services**:
  - `authService.js`: Real Firebase Auth with persistent session and Firestore profile integration.
  - `weatherService.js`: 27 Malaysian cities with RTDB caching (`weather/cities/{cityId}`), 45-min TTL, dynamic olfactory science formulas, and live `onValue` streaming.
  - `perfumeService.js`: Firestore perfume catalog querying with `searchTokens[]`, category filters, and love sync via `arrayUnion`/`arrayRemove`.
  - `adminService.js`: Role-based administrator operations (CRUD perfumes, comment moderation) restricted by Firestore `role: 'admin'`.
  - `i18nService.js`: Bilingual localization (BM/EN) using JSON dictionaries and `t(key)` helper.
  - `themeService.js`: Dark/Light theme switching via `<html>.dark` class and `localStorage`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Total Removal: ScentBot AI | Delete scentBotService.js, ScentBotDrawer.js, and purge all UI drawer hooks/buttons | M1 | ORIGINAL_REQUEST §🚫1 |
| 2 | Total Removal: Price Elements | Remove all currency symbols (RM, MYR), budget tiers, price sorting/filters, and price labels | M1 | ORIGINAL_REQUEST §🚫2 |
| 3 | Total Removal: Long Descriptions | Eliminate multi-sentence marketing descriptions from all cards and views | M1 | ORIGINAL_REQUEST §🚫3 |
| 4 | Total Removal: Role Simulator & Mock User | Purge simulation switch, mock user toggles, and DEFAULT_MOCK_USER fallbacks | M1 | ORIGINAL_REQUEST §🚫5 |
| 5 | Total Removal: Old Bookmarks | Remove old bookmarking UI and wardrobe metadata | M1 | ORIGINAL_REQUEST §🚫6 |
| 6 | Core Data & searchTokens[] | Add `searchTokens[]` lowercase array and `gender` field to seedData & perfumeService | M1 | ORIGINAL_REQUEST §R2 |
| 7 | Theme Engine (Dark/Light) | Tailwind `dark` class on `<html>`, `localStorage` key `scentcast-theme`, Header toggle icon | M1 | ORIGINAL_REQUEST §R8 |
| 8 | i18n Localization Engine | BM/EN JSON dictionaries (`src/i18n/bm.json`, `en.json`), `t()` translation function, Header toggle | M1 | ORIGINAL_REQUEST §R9 |
| 9 | 27 Malaysian Cities Dataset | Full coverage of Peninsular, Sabah, and Sarawak regions in weatherService | M2 | ORIGINAL_REQUEST §R1 |
| 10 | RTDB Weather Cache & TTL | Cache weather data at `weather/cities/{cityId}` with 45-min TTL and live `onValue` sync | M2 | ORIGINAL_REQUEST §R1 |
| 11 | Olfactory Scientific Formulas | Calculate Skin Temp (+2.8°C), Evaporation Rate, Projection Hold, Family, Spray Advice | M2 | ORIGINAL_REQUEST §R1 |
| 12 | Live Weather Header Indicator | Real-time weather badge in Header displaying active city, temp, and humidity linking to `#/cuaca` | M2 | ORIGINAL_REQUEST §R1 |
| 13 | Weather View (`#/cuaca`) | Interactive grid of 27 cities, regional filters, and olfactory advisory cards | M2 | ORIGINAL_REQUEST §R1, R10 |
| 14 | Global Full-Text Search View (`#/cari?q=...`) | Search by perfume name, notes (top/mid/base), gender, brand, accords using `searchTokens` | M3 | ORIGINAL_REQUEST §R2, R10 |
| 15 | Reusable Perfume Card Component | Standard compact card with Love Button (❤️), accords, notes, performance, and zero price | M3 | ORIGINAL_REQUEST §R2, R3, R4 |
| 16 | Directory View Refactor (`#/direktori`) | Filter by accords/family, brand, gender; sort by rating/name/longevity; zero price UI | M3 | ORIGINAL_REQUEST §R2, R10 |
| 17 | Fragrantica-Style Detail View (`#/detail/:id`) | 7-step hierarchy: Header -> Main Accords (%) -> 3 Notes Cards -> Performance -> When to Wear -> Reviews -> Bottom Brand Carousel | M3 | ORIGINAL_REQUEST §R3, R10 |
| 18 | Community Reviews & Threaded Replies | 1-5 stars, situation tags, review text, anti-duplicate helpful votes, threaded replies, edit/delete own, live `onSnapshot` | M3 | ORIGINAL_REQUEST §R3 |
| 19 | Interactive Love Button (❤️) | SVG heart (filled #ef4444 vs outline), guest login prompt, member Firestore `arrayUnion`/`arrayRemove` | M4 | ORIGINAL_REQUEST §R4 |
| 20 | Minimalist Profile View (`#/profil`) | Display only ❤️ saved perfumes collection, exact count, empty state, zero bio/badges/stats | M4 | ORIGINAL_REQUEST §R5, R10 |
| 21 | Separated Dupe Finder (`#/dupe`) | Distinct 🇦🇪 Arab Dupe vs 🇲🇾 Local Dupe sections, max 5 per section, conditional fallback messages, zero price | M4 | ORIGINAL_REQUEST §R6, R10 |
| 22 | Role-Based Admin Panel (`#/admin`) | Role check (`role: 'admin'`), ⛔ Akses Ditolak for guests/members, CRUD for perfumes, review moderation | M4 | ORIGINAL_REQUEST §R7, R10 |
| 23 | SPA Navigation & 8 Routes | Hash router in `src/main.js` supporting 8 canonical routes with query params | M5 | ORIGINAL_REQUEST §R10 |
| 24 | Home View (`#/`) Refactor | Hero, selected city weather card, quick search, perfume showcase, zero price & zero bot | M5 | ORIGINAL_REQUEST §R10 |
| 25 | E2E Testing Suite & Adversarial Hardening | Comprehensive automated test suites (Tiers 1-4) + Adversarial hardening (Tier 5) + Forensic Audit | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundations & Total Removals | Purge ScentBot, prices, long desc, mock user; add searchTokens, themeService, i18nService & dictionaries | none | DONE |
| M2 | Weather Engine & Live Header | 27 Malaysian cities, RTDB caching (node weather/cities/{cityId}), formulas, live header indicator, WeatherView | M1 | DONE |
| M3 | Search, Directory & Fragrantica Detail View | PerfumeCard, SearchView (#/cari), DirectoryView refactor, DetailView (#/detail/:id) with 7-step hierarchy & comments | M1, M2 | DONE |
| M4 | Love System, Dupe Finder & Admin Panel | Love Button sync (users/{uid}.savedPerfumes), ProfileView (#/profil), DupeView (#/dupe), AdminView & adminService (#/admin) | M1, M3 | DONE |
| M5 | SPA Router, Home View & Final Verification | Router in main.js (8 routes), HomeView refactor, E2E Test Suite (Tiers 1-5), and Forensic Audit pass | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts
### `weatherService` ↔ Views & Header
- `getWeather(cityId)` -> Returns `{ cityId, cityName, temp, humidity, condition, skinTemp, evaporationRate, projectionHold, recommendedFamily, sprayAdvice }`
- `subscribeCityWeather(cityId, callback)` -> Subscribes to RTDB `weather/cities/{cityId}` and fires callback on update
- `getAllCitiesWeather()` -> Returns array of weather objects for all 27 Malaysian cities

### `perfumeService` ↔ Search, Directory & Views
- `searchPerfumes(query)` -> Filters catalog where `searchTokens` contains tokenized query words
- `filterPerfumes({ family, brand, gender, sortBy })` -> Multi-attribute filtering with zero price dependency
- `toggleSavePerfume(perfumeId, userId)` -> Atomic `arrayUnion`/`arrayRemove` on `users/{userId}.savedPerfumes`
- `getSavedPerfumes(userId)` -> Resolves array of perfume objects saved by user

### `adminService` ↔ AdminView
- `checkIsAdmin(user)` -> Boolean check for `user?.role === 'admin'`
- `createPerfume(perfumeData)` -> Validates and adds new perfume document with auto-generated `searchTokens`
- `updatePerfume(perfumeId, perfumeData)` -> Updates existing perfume document
- `deletePerfume(perfumeId)` -> Removes perfume document
- `deleteComment(perfumeId, commentId)` -> Moderates/removes community comment

### `i18nService` ↔ All Components & Views
- `t(key, params)` -> Returns localized string based on active language (BM/EN)
- `setLanguage(lang)` -> Sets 'bm' or 'en', updates `localStorage('scentcast-lang')`, notifies listeners
- `getLanguage()` -> Returns current active language

### `themeService` ↔ Header & App
- `initTheme()` -> Reads `localStorage('scentcast-theme')` or system preference, toggles `.dark` class on `<html>`
- `toggleTheme()` -> Flips between 'light' and 'dark', saves to `localStorage`, updates UI icon

## Code Layout
- `index.html`: Main HTML shell, navigation mounts, theme class initialization.
- `src/main.js`: SPA Hash router (8 canonical routes), global event handling, route protection.
- `src/firebase.js`: Firebase app, Auth, Firestore, and Realtime Database instances.
- `src/services/authService.js`: Real Firebase authentication session manager.
- `src/services/weatherService.js`: Weather API & RTDB caching logic, olfactory formulas, 27 cities.
- `src/services/perfumeService.js`: Catalog data, search token indexing, love persistence.
- `src/services/adminService.js`: Admin CRUD & moderation logic.
- `src/services/i18nService.js`: Localization dictionary loader & translator.
- `src/services/themeService.js`: Dark/light mode manager.
- `src/i18n/bm.json`: Malay localization dictionary.
- `src/i18n/en.json`: English localization dictionary.
- `src/data/seedData.js`: Base catalog of perfumes (with searchTokens, accords %, notes, gender) and 27 cities.
- `src/components/Header.js`: Global navigation, search bar, live weather badge, theme & lang toggles, auth modal trigger.
- `src/components/Footer.js`: Minimalist footer with zero price links.
- `src/components/PerfumeCard.js`: Reusable perfume card with love button, notes, accords, zero price.
- `src/components/AuthModal.js`: Login / register modal for guest authentication.
- `src/views/HomeView.js`: Hero, live city weather summary, quick search, perfume showcase.
- `src/views/WeatherView.js`: 27 Malaysian cities grid, olfactory metrics cards, spray advisory.
- `src/views/DirectoryView.js`: Catalog browsing with family, brand, gender filters (zero price).
- `src/views/SearchView.js`: Global full-text search results page (`#/cari?q=...`).
- `src/views/DetailView.js`: Fragrantica-style compact detail view with 7-step hierarchy, reviews & brand carousel.
- `src/views/DupeView.js`: Separated Arab vs Malaysian dupe finder with fallback messages.
- `src/views/ProfileView.js`: Minimalist saved perfumes collection (`#/profil`).
- `src/views/AdminView.js`: Role-protected admin management console (`#/admin`).
- `tests/e2e/`: Automated E2E test suites (Tiers 1-4).
