# ScentCast Malaysia — E2E Test Infrastructure & Automated Verification Framework

## 1. Overview & Testing Philosophy

This document defines the End-to-End (E2E) test infrastructure, harness specifications, and verification suites for **ScentCast Malaysia**.

### Core Principles
1. **Pure Vanilla JavaScript (Zero External Bloat)**: The test framework and runner are authored in pure ES Modules without requiring heavy third-party runners or headless browser installations (e.g. Puppeteer, Playwright, Selenium) that can fail in constrained sandbox environments or trigger interactive user permission prompts.
2. **Dual-Environment Execution**:
   - **CLI Mode (Node.js)**: Runs instantly via `node tests/e2e/runner.js` using a built-in, lightweight DOM and browser storage shim.
   - **Browser Mode**: Runs directly within any modern web browser via `tests/e2e/index.html` or through Vite development server (`http://localhost:5173/tests/e2e/index.html`).
3. **Behavioral & Contract-Driven Verification**: Every test validates system behavior against specifications defined in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
4. **Self-Contained & Independent**: Each test case sets up its own isolated state, avoids sequential coupling, and restores global state upon completion.
5. **Authoritative Expected Output**: Expected outputs are derived mathematically (olfactory science formulas), contractually (interface specifications), or forensically (negative regex scans for purged legacy features).

---

## 2. Test Architecture & Directory Layout

The E2E test suite is located in `tests/e2e/`:

```
tests/e2e/
├── runner.js                         # Core test runner, assertions, DOM shim, and reporter
├── index.html                        # Browser-based visual test runner dashboard
├── test_removals.js                  # Negative tests & forensic audit (ScentBot, Prices, Mock User, etc.)
├── test_weather.js                   # R1: Real-Time Weather Engine & RTDB Cache (Tiers 1 & 2)
├── test_search.js                    # R2: Global Full-Text Search Engine & Directory (Tiers 1 & 2)
├── test_detail_comments.js           # R3: Fragrantica Detail View & Comments (Tiers 1 & 2)
├── test_love_profile.js              # R4 & R5: Love Button & Minimalist Profile (Tiers 1 & 2)
├── test_dupe.js                      # R6: Separated Dupe Finder (Arab vs Local) (Tiers 1 & 2)
├── test_admin.js                     # R7: Role-Based Admin Panel & Security (Tiers 1 & 2)
├── test_theme_i18n.js                # R8 & R9: Dark/Light Mode & Bilingual i18n (Tiers 1 & 2)
├── test_routes.js                    # R10: SPA Navigation & 8 Canonical Routes (Tiers 1 & 2)
└── test_combinations_scenarios.js    # Tier 3 (Pairwise Interactions) & Tier 4 (Real-World Scenarios)
```

---

## 3. Test Tier Specifications

The test suite is stratified into four testing tiers plus a dedicated forensic purge tier:

### Negative Tier: Forensic Purge & Total Removals
- **Target 1: ScentBot AI Purge**: Verifies total deletion of `src/services/scentBotService.js`, `src/components/ScentBotDrawer.js`, floating triggers, prompt teasers in HomeView/WeatherView, and script imports.
- **Target 2: Price Element Purge**: Verifies total absence of currency symbols (`RM`, `MYR`), budget ranges ("Bawah RM100", "Julat Bajet"), price calculations, and price sorting dropdowns across all views, data seeds, and templates.
- **Target 3: Long Description Purge**: Verifies cards and detail views no longer output multi-sentence marketing paragraphs.
- **Target 4: Role Simulator & Mock User Purge**: Verifies complete removal of `DEFAULT_MOCK_USER`, simulation toggles in Header/Detail/Profile views, and ensures unauthenticated sessions cleanly evaluate as guests.
- **Target 5: Old Bookmarks Purge**: Verifies removal of old "Almari Maya" and bookmarking UI in favor of the standardized Love (❤️) system.
- **Target 6: Brand Section Placement**: Verifies that any "Lebih dari [Brand]" carousel is located strictly at the very bottom of the detail page, below community comments.

### Tier 1: Feature Coverage (>=5 tests per feature)
- **R1 (Weather Engine)**:
  1. 27 Malaysian cities dataset coverage across Peninsular, Sabah, and Sarawak.
  2. RTDB node structure at `weather/cities/{cityId}` with 30–60 min TTL caching.
  3. Skin Temperature formula: `Suhu Kulit = Suhu + 2.8°C`.
  4. Evaporation Rate & Projection Hold dynamic calculation.
  5. Recommended fragrance families and spray advice logic.
- **R2 (Global Full-Text Search)**:
  1. Tokenized search by perfume name.
  2. Search by fragrance notes (Top, Mid, Base).
  3. Search by accords / olfactory family.
  4. Search by brand name.
  5. Search by gender classification (`Male`, `Female`, `Unisex`).
- **R3 (Fragrantica-Style Detail View)**:
  1. Strict 7-step hierarchy ordering.
  2. Main Accords bar with percentage pill displays.
  3. Fragrance Composition: 3 clean cards (Top / Heart / Base).
  4. Performance metrics: Longevity & Sillage cards.
  5. Community comments with 1–5 star ratings and situation tags.
- **R4 (Love Button & Firestore Sync)**:
  1. Interactive SVG heart toggle (#ef4444 filled vs outline).
  2. Member state update via `arrayUnion` / `arrayRemove` on `users/{uid}.savedPerfumes`.
  3. Optimistic UI updates.
  4. Heart status reflection on card and detail views.
  5. Persistence across navigation sessions.
- **R5 (Minimalist Profile View)**:
  1. Clean title: `❤️ Koleksi Saya`.
  2. Accurate count indicator: `X wangian disimpan`.
  3. Grid of saved perfume cards with active ❤️ buttons.
  4. Empty state display when zero perfumes are saved.
  5. Complete absence of bio, badges, or unrelated statistics.
- **R6 (Separated Dupe Finder)**:
  1. Dedicated Arab Dupe section (UAE / Middle Eastern brands).
  2. Dedicated Local Malaysian Dupe section (Artisan brands).
  3. Strict separation of the two categories.
  4. Maximum 5 dupes per section cap.
  5. Dupe card attributes (Name, Brand, Match %, Longevity, Sillage, ❤️).
- **R7 (Role-Based Admin Panel)**:
  1. Admin authentication check (`user.role === 'admin'`).
  2. Perfume creation form with auto-generated `searchTokens`.
  3. Perfume update operation.
  4. Perfume delete operation.
  5. Community comment moderation/deletion.
- **R8 (Theme Engine)**:
  1. Light to Dark mode toggle applying `.dark` class to `<html>`.
  2. Dark to Light mode toggle removing `.dark` class from `<html>`.
  3. Persistence in `localStorage` (`scentcast-theme`).
  4. System preference fallback via `prefers-color-scheme`.
  5. Header theme toggle icon synchronization (🌙 / ☀️).
- **R9 (Bilingual i18n Engine)**:
  1. Malay dictionary loading (`src/i18n/bm.json`).
  2. English dictionary loading (`src/i18n/en.json`).
  3. Translation helper `t(key)` returning localized text.
  4. Language toggle persistence in `localStorage` (`scentcast-lang`).
  5. Header language badge indicator (BM / EN).
- **R10 (SPA Navigation & Routes)**:
  1. Route `#/` / `#/laman-utama` -> HomeView.
  2. Route `#/cuaca` -> WeatherView.
  3. Route `#/direktori` -> DirectoryView.
  4. Route `#/cari?q=...` -> SearchView.
  5. Route `#/detail/:id` -> DetailView.
  6. Route `#/dupe` -> DupeView.
  7. Route `#/profil` -> ProfileView.
  8. Route `#/admin` -> AdminView.

### Tier 2: Boundary & Corner Cases (>=5 tests per feature)
- **R1 Weather**: Extreme high temperature (45°C), high humidity (> 80% triggering collar/cloth spray advice), low humidity (< 40%), cold mountain climate (Genting/Cameron), non-existent city ID fallback, simulated network latency.
- **R2 Search**: Empty string query, whitespace-only query, special regex characters (`.*+?^${}()`), excessively long query (500+ characters), zero results query with empty state, case insensitivity (`avEnTus` == `aventus`).
- **R3 Detail**: Empty comment text submission rejection, 0-star rating rejection, duplicate helpful voting prevention (toggle behavior), unauthorized edit attempt on someone else's comment, unauthenticated review submission triggering login prompt.
- **R4 Love Button**: Unauthenticated guest click prompts `AuthModal`, unliking down to 0 items, liking already liked perfume idempotency, rapid consecutive click handling, simulated network failure state retention.
- **R5 Profile**: Zero saved perfumes displays exact empty state message, single item saved, large saved list (25+ items) grid rendering, accessing profile directly without active session, corrupted `savedPerfumes` array recovery.
- **R6 Dupe Finder**: Search query with 0 matching dupes displays exact fallback message, query with < 5 dupes displays partial count message, query with > 5 dupes caps at exactly 5, non-existent designer perfume query, case-insensitive designer matching.
- **R7 Admin**: Unauthenticated guest access renders `⛔ Akses Ditolak`, authenticated member without admin role renders `⛔ Akses Ditolak`, form submission with missing required fields blocked, attempt to delete non-existent perfume ID, malformed payload validation.
- **R8 Theme**: Rapid consecutive toggles do not de-sync class and storage, corrupted localStorage value defaults safely, missing `window.matchMedia` fallback, document root class synchronization across tabs.
- **R9 i18n**: Invalid language code defaults to `'bm'`, missing translation key returns key name gracefully, parameterized string with missing tokens renders safely, rapid language switching, special characters in translation values.
- **R10 Routes**: Unknown route fallback to home/404, query parameters with empty value `#/cari?`, malformed perfume ID `#/detail/`, hash without leading slash normalization, browser back/forward history synchronization.

### Tier 3: Cross-Feature Pairwise Combinations
1. **Search + Love Toggle**: Searching for a perfume, clicking ❤️ on a search result card, verifying immediate heart fill, and checking that the perfume appears in `#/profil`.
2. **Weather Recommendation + Directory Filter**: Selecting Kota Kinabalu in weather view, clicking recommended family ("Aquatic Marine"), routing to `#/direktori` with pre-selected accordion filter.
3. **Dark Mode + Route Transitions**: Setting dark mode on `#/`, transitioning through all 8 routes, verifying `<html>.dark` class remains consistently applied without flicker.
4. **Bilingual i18n + Admin Panel**: Switching language to EN, visiting `#/admin`, verifying admin table headers and action buttons are translated into English.
5. **Search Query + Dupe View Sharing**: Typing a designer fragrance in header search, clicking Dupe Finder button, ensuring query propagates to DupeView input.
6. **Profile Unliking + Directory Sync**: Removing a perfume from `#/profil`, navigating back to `#/direktori`, and verifying that its card heart icon is outlined (unliked).

### Tier 4: Real-World Application User Journeys
1. **Journey 1: Guest Discovery & Auth Gate Flow**:
   - Guest visits `#/` -> Reads live weather for Kuala Lumpur -> Enters header search "Sauvage" -> Clicks perfume card to open `#/detail/dior-sauvage` -> Clicks ❤️ button -> System intercepts and opens `AuthModal` -> Closes modal and returns to browsing.
2. **Journey 2: Member Collection & Review Lifecycle**:
   - Registered member logs in -> Searches catalog for "Aventus" -> Navigates to detail view -> Submits a 5-star review with situation tag "+6 Semburan" -> Verifies review appears in list -> Clicks ❤️ to save -> Navigates to `#/profil` -> Verifies 1 saved perfume -> Unlikes perfume -> Verifies empty state.
3. **Journey 3: Tropical Weather Olfactory Consultation**:
   - User navigates to `#/cuaca` -> Selects "Kota Bharu" (33°C, 85% RH) -> Checks calculated Skin Temp (35.8°C), Evaporation Rate, and Collar Spray Advice -> Clicks recommended fragrance -> Reviews When-To-Wear recommendations.
4. **Journey 4: Dual Dupe Research**:
   - User navigates to `#/dupe` -> Searches "Bvlgari Tygar" -> System returns 🇦🇪 Arab Section (Afnan Turathi Blue, 95% Match) and 🇲🇾 Local Artisan Section (The Scent Supply Co, 92% Match) -> Verifies no price comparison is shown -> Likes both dupes.
5. **Journey 5: Administrator Catalog & Moderation Operation**:
   - Admin logs in with `role: 'admin'` -> Navigates to `#/admin` -> Successfully views admin dashboard -> Fills new perfume form -> Submits and verifies perfume added to catalog -> Moderates and deletes a spam comment -> Logs out -> Attempts re-entry and receives `⛔ Akses Ditolak`.
6. **Journey 6: Complete Localization & Theme Personalization**:
   - User switches language to BM -> Switches theme to Dark -> Navigates through all views -> Verifies Malay copy on buttons and labels -> Reloads page -> Verifies Dark theme and BM language remain active.

---

## 4. Test Harness Architecture (`tests/e2e/runner.js`)

### Assertion Library API
The runner exports a zero-dependency assertion library:
- `assert(condition, message)`: Evaluates truthiness.
- `assertEqual(actual, expected, message)`: Strict equality (`===`).
- `assertNotEqual(actual, expected, message)`: Strict inequality (`!==`).
- `assertTrue(value, message)`: Value is strictly `true`.
- `assertFalse(value, message)`: Value is strictly `false`.
- `assertNull(value, message)`: Value is strictly `null`.
- `assertNotNull(value, message)`: Value is not `null`.
- `assertDeepEqual(actual, expected, message)`: Deep recursive structural equality.
- `assertIncludes(haystack, needle, message)`: Substring or array element inclusion.
- `assertNotIncludes(haystack, needle, message)`: Exclusion verification.
- `assertMatch(string, regex, message)`: Regular expression pattern match.
- `assertThrows(fn, expectedMsg, message)`: Synchronous error assertion.
- `assertAsyncThrows(asyncFn, expectedMsg, message)`: Asynchronous error assertion.
- `assertBetween(val, min, max, message)`: Numeric boundary checking.

### Execution Environment Shim
When running under Node.js (`typeof window === 'undefined'`), the runner injects:
- `globalThis.window`: Window mock with `location`, `history`, `addEventListener`, `dispatchEvent`.
- `globalThis.document`: Lightweight DOM emulator with `getElementById`, `querySelector`, `querySelectorAll`, `createElement`, `documentElement.classList`.
- `globalThis.localStorage` & `sessionStorage`: In-memory storage mock implementing `getItem`, `setItem`, `removeItem`, `clear`.
- `globalThis.CustomEvent` & `Event`: Event dispatching system.
- `globalThis.fetch`: Deterministic mockable HTTP fetch.

---

## 5. Running the Tests

### CLI Mode (Recommended for CI / Local Terminal)
Run the automated test runner using Node.js:
```bash
node tests/e2e/runner.js
```
The runner will execute all test suites sequentially, print colorized suite headers, pass/fail status per test, error call stacks, and exit with code `0` on success or `1` on failure.

### Browser Mode (Interactive Visual Dashboard)
Open `tests/e2e/index.html` in any web browser or via Vite:
```bash
npm run dev
# Then open: http://localhost:5173/tests/e2e/index.html
```
The browser runner provides:
- Live test progress indicator.
- Filter tests by Tier (Negative, Tier 1, Tier 2, Tier 3, Tier 4).
- Expandable error diagnostic details.
- Real-time DOM inspection.

---

## 6. Authoritative Oracles & Calculation Rules

| Dimension | Rule / Formula | Authoritative Source |
|---|---|---|
| Skin Temperature | $\text{SkinTemp} = T_{\text{ambient}} + 2.8^\circ\text{C}$ | `ORIGINAL_REQUEST §R1` |
| Evaporation Rate | Non-linear scale based on $T$ and wind speed | `ORIGINAL_REQUEST §R1` |
| Spray Advice | If $\text{RH} > 80\%$, recommend collar/fabric application | `ORIGINAL_REQUEST §R1` |
| 27 Malaysian Cities | KL, Putrajaya, Labuan, Shah Alam, PJ, Klang, George Town, Bayan Lepas, JB, Batu Pahat, Melaka, Seremban, Ipoh, Alor Setar, Langkawi, Kangar, Kota Bharu, Kuala Terengganu, Kuantan, Genting, Cameron, KK, Sandakan, Tawau, Kuching, Miri, Sibu | `ORIGINAL_REQUEST §R1` |
| RTDB Cache TTL | 30 to 60 minutes (nominal 45 minutes) | `ORIGINAL_REQUEST §R1`, `PROJECT.md` |
| 8 Canonical Routes | `#/`, `#/cuaca`, `#/direktori`, `#/cari`, `#/detail/:id`, `#/dupe`, `#/profil`, `#/admin` | `ORIGINAL_REQUEST §R10` |
| Dupe Separation | 🇦🇪 Arab (UAE) vs 🇲🇾 Local Artisan (Malaysia), max 5 per section | `ORIGINAL_REQUEST §R6` |
| Admin Authorization | Only users with `role: 'admin'` in Firestore; others receive `⛔ Akses Ditolak` | `ORIGINAL_REQUEST §R7` |
| Price Zero-Tolerance | 0 occurrences of `RM`, `MYR`, or budget filters in user-facing UI | `ORIGINAL_REQUEST §🚫2` |
| ScentBot Zero-Tolerance | 0 occurrences of `scentbot` files, components, or UI drawer triggers | `ORIGINAL_REQUEST §🚫1` |
