/**
 * ScentCast Malaysia — E2E Test Suite: Tier 3 Pairwise Combinations & Tier 4 User Journeys
 * Covers cross-feature interactions (Search + Love, Weather + Directory, Theme + Routes,
 * i18n + Admin, Dupe + Search) and full end-to-end real-world user scenarios.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNull,
  assertNotNull,
  assertIncludes,
  assertNotIncludes,
  assertBetween,
  assertGreaterThan,
  assertLessThan
} from './runner.js';

import {
  calculateSkinTemperature,
  calculateEvaporationRate,
  getSprayAdvice,
  getRecommendedOlfactoryFamily
} from './test_weather.js';
import { searchPerfumes, generateSearchTokens, SAMPLE_PERFUME_CATALOG } from './test_search.js';
import { CommentSystemSimulator } from './test_detail_comments.js';
import { LoveSystemSimulator } from './test_love_profile.js';
import { findDupes } from './test_dupe.js';
import { AdminServiceSimulator } from './test_admin.js';
import { I18nService, ThemeService } from './test_theme_i18n.js';
import { parseRoute } from './test_routes.js';

describe('Tier 3: Cross-Feature Pairwise Combinations', () => {

  test('Comb-01 [Search + Love]: Searching for a perfume and toggling ❤️ reflects immediately', () => {
    const loveSim = new LoveSystemSimulator();
    const user = { uid: 'u_tester', displayName: 'Tester', savedPerfumes: [] };
    loveSim.setUser(user);

    // 1. Search for perfume
    const searchResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'Turathi');
    assertEqual(searchResults.length, 1);
    const targetPerfume = searchResults[0];

    // 2. Click ❤️ on search result
    assertFalse(loveSim.isLiked(targetPerfume.id));
    const toggleRes = loveSim.toggleLove(targetPerfume.id);
    assertTrue(toggleRes.isLiked);
    assertTrue(loveSim.isLiked(targetPerfume.id));

    // 3. Verify user's saved list contains it
    assertEqual(user.savedPerfumes.length, 1);
    assertEqual(user.savedPerfumes[0], 'turathi-blue');
  });

  test('Comb-02 [Weather + Directory]: Weather recommendation filters directory catalog', () => {
    // 1. Weather in Kota Bharu (33°C, 85% RH) recommends Aquatic Marine
    const recommendedFamily = getRecommendedOlfactoryFamily(33, 85);
    assertIncludes(recommendedFamily, 'Aquatic Marine');

    // 2. User transitions to Directory filtered by "Aquatic"
    const aquaticPerfumes = SAMPLE_PERFUME_CATALOG.filter((p) =>
      p.accords?.some((a) => a.name.toLowerCase().includes('aquatic'))
    );
    assertEqual(aquaticPerfumes.length, 1);
    assertEqual(aquaticPerfumes[0].id, 'delina-la-rosee');
  });

  test('Comb-03 [Dark Mode + Route Transitions]: Theme state persists across all 8 canonical routes', () => {
    const themeService = new ThemeService();
    themeService.currentTheme = 'dark';
    themeService.applyTheme();
    assertTrue(globalThis.document.documentElement.classList.contains('dark'));

    const CANONICAL_ROUTES = [
      '#/',
      '#/cuaca',
      '#/direktori',
      '#/cari?q=bergamot',
      '#/detail/turathi-blue',
      '#/dupe',
      '#/profil',
      '#/admin'
    ];

    // Simulate route transitions
    for (const route of CANONICAL_ROUTES) {
      const parsed = parseRoute(route);
      assertNotNull(parsed.viewName);
      // Verify theme has not been reset by routing
      assertTrue(
        globalThis.document.documentElement.classList.contains('dark'),
        `Theme must remain dark on route ${route}`
      );
      assertEqual(themeService.getTheme(), 'dark');
    }
  });

  test('Comb-04 [Bilingual i18n + Admin Panel]: Language toggle updates Admin console copy', () => {
    const i18n = new I18nService();
    
    // In BM mode
    i18n.setLanguage('bm');
    assertEqual(i18n.t('nav.admin'), 'Panel Admin');
    assertIncludes(i18n.t('admin.accessDenied'), 'Akses Ditolak');

    // In EN mode
    i18n.setLanguage('en');
    assertEqual(i18n.t('nav.admin'), 'Admin Panel');
    assertIncludes(i18n.t('admin.accessDenied'), 'Access Denied');
  });

  test('Comb-05 [Search Query + Dupe Finder]: Query handoff between Search and Dupe Finder', () => {
    const searchQuery = 'Bvlgari Tygar';
    // User searches in dupe finder
    const dupeResults = findDupes(searchQuery);
    assertEqual(dupeResults.status, 'success');
    assertEqual(dupeResults.target, 'Bvlgari Tygar');
    assertEqual(dupeResults.arab.length, 1);
    assertEqual(dupeResults.arab[0].id, 'turathi-blue');
  });

  test('Comb-06 [Profile Unliking + Directory Sync]: Unliking in Profile reflects on catalog cards', () => {
    const loveSim = new LoveSystemSimulator();
    const user = { uid: 'u_sync', displayName: 'SyncUser', savedPerfumes: ['turathi-blue', 'cdnim'] };
    loveSim.setUser(user);

    // Profile shows 2 saved
    let profile = loveSim.renderProfileView(SAMPLE_PERFUME_CATALOG);
    assertEqual(profile.count, 2);

    // Unlike 'turathi-blue' from profile
    loveSim.toggleLove('turathi-blue');
    assertFalse(loveSim.isLiked('turathi-blue'));

    // Directory view queries liked status for card
    const isTurathiLikedInDirectory = loveSim.isLiked('turathi-blue');
    assertFalse(isTurathiLikedInDirectory, 'Must be unliked in Directory view as well');

    const isCdnimLikedInDirectory = loveSim.isLiked('cdnim');
    assertTrue(isCdnimLikedInDirectory, 'CDNIM remains liked');
  });
});

describe('Tier 4: Real-World Application User Scenarios', () => {

  test('Scenario 1: Guest Browsing, Weather Consultation & Auth Interception Journey', () => {
    // 1. Guest lands on HomeView (#/)
    const routeHome = parseRoute('#/');
    assertEqual(routeHome.viewName, 'HomeView');

    // 2. Reads live weather for Kuala Lumpur (31°C, 75% RH)
    const ambient = 31.0;
    const skinTemp = calculateSkinTemperature(ambient);
    assertEqual(skinTemp, 33.8);

    // 3. Navigates to WeatherView (#/cuaca)
    const routeWeather = parseRoute('#/cuaca');
    assertEqual(routeWeather.viewName, 'WeatherView');

    // 4. Navigates to DirectoryView (#/direktori) and finds Turathi Blue
    const routeDir = parseRoute('#/direktori');
    assertEqual(routeDir.viewName, 'DirectoryView');
    const perfume = SAMPLE_PERFUME_CATALOG.find((p) => p.id === 'turathi-blue');
    assertNotNull(perfume);

    // 5. Clicks ❤️ button on card as guest
    const loveSim = new LoveSystemSimulator();
    loveSim.setUser(null); // Guest
    const loveResult = loveSim.toggleLove(perfume.id);

    // 6. System intercepts and triggers login modal
    assertEqual(loveResult.status, 'prompt_login');
    assertTrue(loveSim.authModalOpen, 'Auth modal must be displayed for guest');
    assertFalse(loveResult.isLiked, 'Perfume must not be saved');
  });

  test('Scenario 2: Member Catalog Search, Detail Exploration, Star Rating & Collection Storage', () => {
    // 1. Authenticated member logs in
    const member = { uid: 'mem_1', displayName: 'Hafiz', role: 'member', savedPerfumes: [] };
    const loveSim = new LoveSystemSimulator();
    loveSim.setUser(member);
    const commentSim = new CommentSystemSimulator();

    // 2. Searches for "Aventus"
    const searchResults = searchPerfumes(SAMPLE_PERFUME_CATALOG, 'Aventus');
    // Finds CDNIM
    const cdnim = SAMPLE_PERFUME_CATALOG.find((p) => p.id === 'cdnim');
    assertNotNull(cdnim);

    // 3. Opens DetailView (#/detail/cdnim)
    const routeDetail = parseRoute('#/detail/cdnim');
    assertEqual(routeDetail.viewName, 'DetailView');
    assertEqual(routeDetail.param, 'cdnim');

    // 4. Posts a 5-star review with situation tags
    const comment = commentSim.addComment(member, {
      perfumeId: 'cdnim',
      rating: 5,
      text: 'Aroma nanas asap dan birch yang sangat maskulin!',
      tags: ['+6 Semburan', 'Hawa Dingin Pejabat']
    });
    assertEqual(comment.rating, 5);
    assertEqual(comment.helpfulCount, 0);

    // 5. Another member votes helpful
    const voter = { uid: 'mem_2', displayName: 'Danial' };
    const voteRes = commentSim.toggleHelpful(voter, comment.id);
    assertEqual(voteRes.helpfulCount, 1);

    // 6. Member clicks ❤️ to save to collection
    const saveRes = loveSim.toggleLove('cdnim');
    assertTrue(saveRes.isLiked);

    // 7. Member navigates to ProfileView (#/profil)
    const profile = loveSim.renderProfileView(SAMPLE_PERFUME_CATALOG);
    assertEqual(profile.title, '❤️ Koleksi Saya');
    assertEqual(profile.countText, '1 wangian disimpan');
    assertEqual(profile.perfumes[0].id, 'cdnim');

    // 8. Member unlikes perfume from profile
    loveSim.toggleLove('cdnim');
    const updatedProfile = loveSim.renderProfileView(SAMPLE_PERFUME_CATALOG);
    assertTrue(updatedProfile.isEmpty);
    assertEqual(updatedProfile.emptyMessage, 'Belum ada wangian disimpan. Tekan ❤️ pada mana-mana parfume.');
  });

  test('Scenario 3: Extreme Tropical Weather (High Heat & Humidity) Advisory', () => {
    // Extreme tropical monsoon condition: Kota Bharu 34°C, 88% RH
    const ambientTemp = 34.0;
    const humidity = 88;

    // 1. Dynamic Skin Temperature evaluation
    const skinTemp = calculateSkinTemperature(ambientTemp);
    assertEqual(skinTemp, 36.8, 'Skin temperature should be 36.8°C');

    // 2. High evaporation rate factor
    const evapRate = calculateEvaporationRate(ambientTemp, 12);
    assertGreaterThan(evapRate, 1.5);

    // 3. Spray advice triggers collar/clothing recommendation due to RH > 80%
    const advice = getSprayAdvice(ambientTemp, humidity);
    assertIncludes(advice, 'kolar atau fabrik');
    assertIncludes(advice, 'peluh');

    // 4. Olfactory recommendation recommends Aquatic Marine
    const family = getRecommendedOlfactoryFamily(ambientTemp, humidity);
    assertIncludes(family, 'Aquatic Marine');
  });

  test('Scenario 4: Designer Niche Fragrance Dupe Discovery (Arab vs Local Artisan)', () => {
    // 1. User navigates to DupeView (#/dupe)
    const route = parseRoute('#/dupe');
    assertEqual(route.viewName, 'DupeView');

    // 2. User searches for "Bvlgari Tygar"
    const results = findDupes('Bvlgari Tygar');
    assertEqual(results.status, 'success');
    assertEqual(results.target, 'Bvlgari Tygar');

    // 3. Verifies separate Arab Section (Afnan Turathi Blue)
    assertEqual(results.arab.length, 1);
    assertEqual(results.arab[0].name, 'Turathi Blue');
    assertEqual(results.arab[0].brand, 'Afnan');
    assertEqual(results.arab[0].matchPercent, 95);

    // 4. Verifies separate Local Artisan Section (The Scent Supply Co)
    assertEqual(results.local.length, 1);
    assertEqual(results.local[0].name, 'Tiger Citrus Amber');
    assertEqual(results.local[0].brand, 'The Scent Supply Co');
    assertEqual(results.local[0].matchPercent, 92);

    // 5. Verifies complete absence of price displays or comparisons
    for (const d of [...results.arab, ...results.local]) {
      assertFalse('priceMYR' in d);
      assertFalse('originalPriceMYR' in d);
      assertFalse('savings' in d);
    }
  });

  test('Scenario 5: Full Administrator Catalog Management & Community Moderation', () => {
    // 1. Regular user receives ⛔ Akses Ditolak
    const adminSim = new AdminServiceSimulator(SAMPLE_PERFUME_CATALOG);
    const regularMember = { uid: 'mem_regular', role: 'member' };
    assertFalse(adminSim.checkIsAdmin(regularMember));

    // 2. Admin logs in with role: 'admin'
    const adminUser = { uid: 'adm_master', role: 'admin' };
    assertTrue(adminSim.checkIsAdmin(adminUser));

    // 3. Admin creates new perfume
    const newPerfume = adminSim.createPerfume(adminUser, {
      name: 'Oud Royale Malaysia',
      brand: 'Wangi Artisan MY',
      gender: 'Unisex',
      accords: [{ name: 'Oud', percent: 90 }, { name: 'Woody', percent: 80 }],
      notes: {
        top: ['Rose', 'Saffron'],
        mid: ['Malaysian Agarwood', 'Amber'],
        base: ['White Musk', 'Patchouli']
      },
      longevity: '12 Jam',
      sillage: '2.5 m'
    });
    assertNotNull(newPerfume.id);
    assertIncludes(newPerfume.searchTokens, 'agarwood');
    assertEqual(adminSim.catalog.length, 5);

    // 4. Admin updates perfume
    const updated = adminSim.updatePerfume(adminUser, newPerfume.id, {
      longevity: '14 Jam'
    });
    assertEqual(updated.longevity, '14 Jam');

    // 5. Admin moderates an abusive comment
    adminSim.comments = [{ id: 'comm_toxic', text: 'Abusive spam text', userId: 'bad_user' }];
    adminSim.deleteComment(adminUser, 'comm_toxic');
    assertEqual(adminSim.comments.length, 0);

    // 6. Admin deletes perfume
    adminSim.deletePerfume(adminUser, newPerfume.id);
    assertEqual(adminSim.catalog.length, 4);
  });

  test('Scenario 6: Complete Display & Locale Customization Across Sessions', () => {
    const i18n = new I18nService();
    const theme = new ThemeService();

    // 1. User configures English and Dark Mode
    i18n.setLanguage('en');
    theme.currentTheme = 'dark';
    theme.applyTheme();

    assertEqual(i18n.getLanguage(), 'en');
    assertEqual(theme.getTheme(), 'dark');
    assertTrue(globalThis.document.documentElement.classList.contains('dark'));

    // 2. Simulate page reload by creating new instances reading from storage
    const reloadedI18n = new I18nService();
    const reloadedTheme = new ThemeService();

    assertEqual(reloadedI18n.getLanguage(), 'en', 'Language preference preserved on reload');
    assertEqual(reloadedTheme.getTheme(), 'dark', 'Theme preference preserved on reload');
    assertTrue(globalThis.document.documentElement.classList.contains('dark'));
  });
});
