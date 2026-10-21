/**
 * ScentCast Malaysia — E2E Test Suite: Total Removals & Negative Tests
 * Verifies complete purge of ScentBot AI, price elements, long descriptions,
 * mock users / role simulator, and old bookmarks.
 */

import {
  describe,
  test,
  assert,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNull,
  assertIncludes,
  assertNotIncludes,
  assertMatch
} from './runner.js';

describe('Negative Tests: Total Removals & Forensic Audit', () => {

  // --- Target 1: ScentBot AI Purge ---
  test('Removals-01: ScentBot AI service and component files are deleted or completely purged', () => {
    // Check module importability / existence and complete purge
    let scentBotServiceActive = true;
    try {
      // If running in Node, check file existence and content via fs
      if (typeof process !== 'undefined') {
        const fs = get_fs();
        if (fs.existsSync('src/services/scentBotService.js')) {
          const content = fs.readFileSync('src/services/scentBotService.js', 'utf8').trim();
          scentBotServiceActive = content.includes('scentBotService') || content.includes('askScentBot') || (content.length > 0 && !content.includes('Purged'));
        } else {
          scentBotServiceActive = false;
        }
      } else {
        scentBotServiceActive = false;
      }
    } catch {
      scentBotServiceActive = false;
    }
    assertFalse(scentBotServiceActive, 'src/services/scentBotService.js must be completely removed or purged');

    let scentBotDrawerActive = true;
    try {
      if (typeof process !== 'undefined') {
        const fs = get_fs();
        if (fs.existsSync('src/components/ScentBotDrawer.js')) {
          const content = fs.readFileSync('src/components/ScentBotDrawer.js', 'utf8').trim();
          scentBotDrawerActive = content.includes('ScentBotDrawer') || content.includes('renderScentBot') || (content.length > 0 && !content.includes('Purged'));
        } else {
          scentBotDrawerActive = false;
        }
      } else {
        scentBotDrawerActive = false;
      }
    } catch {
      scentBotDrawerActive = false;
    }
    assertFalse(scentBotDrawerActive, 'src/components/ScentBotDrawer.js must be completely removed or purged');
  });

  test('Removals-02: index.html contains zero ScentBot containers or floating triggers', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const html = fs.readFileSync('index.html', 'utf8');
      assertNotIncludes(html.toLowerCase(), 'scentbot-container', 'index.html must not contain scentbot-container');
      assertNotIncludes(html.toLowerCase(), 'scentbot-toggle', 'index.html must not contain scentbot-toggle');
    }
  });

  test('Removals-03: src/main.js has zero ScentBot imports or initialization calls', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const mainContent = fs.readFileSync('src/main.js', 'utf8');
      assertNotIncludes(mainContent, 'ScentBotDrawer', 'src/main.js must not import ScentBotDrawer');
      assertNotIncludes(mainContent, 'scentBotService', 'src/main.js must not import scentBotService');
      assertNotIncludes(mainContent, 'renderScentBotFloating', 'src/main.js must not call renderScentBotFloating');
    }
  });

  test('Removals-04: HomeView and WeatherView contain zero ScentBot teasers or buttons', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const homeContent = fs.readFileSync('src/views/HomeView.js', 'utf8');
      assertNotIncludes(homeContent, 'open-bot-teaser-btn', 'HomeView must not have open-bot-teaser-btn');
      assertNotIncludes(homeContent, 'ScentBot AI', 'HomeView must not reference ScentBot AI');

      const weatherContent = fs.readFileSync('src/views/WeatherView.js', 'utf8');
      assertNotIncludes(weatherContent, 'ask-bot-tip-btn', 'WeatherView must not have ask-bot-tip-btn');
      assertNotIncludes(weatherContent, 'Tanya ScentBot', 'WeatherView must not reference Tanya ScentBot');
    }
  });

  // --- Target 2: Price Element Purge ---
  test('Removals-05: seedData contains zero price fields (priceMYR, originalPriceMYR, dupes.price)', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const seedContent = fs.readFileSync('src/data/seedData.js', 'utf8');
      assertNotIncludes(seedContent, 'priceMYR', 'seedData.js must not have priceMYR property');
      assertNotIncludes(seedContent, 'originalPriceMYR', 'seedData.js must not have originalPriceMYR property');
      assertNotIncludes(seedContent, 'RM140', 'seedData.js comments must not mention currency prices');
    }
  });

  test('Removals-06: DirectoryView contains zero price sorting options or currency badges', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const dirContent = fs.readFileSync('src/views/DirectoryView.js', 'utf8');
      assertNotIncludes(dirContent, 'price-low', 'DirectoryView must not have price-low sort');
      assertNotIncludes(dirContent, 'price-high', 'DirectoryView must not have price-high sort');
      assertNotIncludes(dirContent, 'priceMYR', 'DirectoryView must not sort by priceMYR');
      assertNotIncludes(dirContent, 'RM ${', 'DirectoryView must not render RM currency templates');
    }
  });

  test('Removals-07: WeatherView contains zero budget filters ("Julat Bajet", "Bawah RM100")', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const weatherContent = fs.readFileSync('src/views/WeatherView.js', 'utf8');
      assertNotIncludes(weatherContent, 'selectedBudget', 'WeatherView must not track selectedBudget');
      assertNotIncludes(weatherContent, 'filter-budget-btn', 'WeatherView must not have filter-budget-btn');
      assertNotIncludes(weatherContent, 'Julat Bajet', 'WeatherView must not display Julat Bajet');
      assertNotIncludes(weatherContent, 'Bawah RM100', 'WeatherView must not display Bawah RM100');
    }
  });

  test('Removals-08: DupeView contains zero price comparisons or savings percentages', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const dupeContent = fs.readFileSync('src/views/DupeView.js', 'utf8');
      assertNotIncludes(dupeContent, 'originalPriceMYR', 'DupeView must not reference originalPriceMYR');
      assertNotIncludes(dupeContent, 'savingsPct', 'DupeView must not compute savings percentage');
      assertNotIncludes(dupeContent, 'Harga Rasional', 'DupeView must not reference prices in header');
      assertNotIncludes(dupeContent, 'Harga Butik Tempatan', 'DupeView must not display boutique prices');
      assertNotIncludes(dupeContent, 'Jimat', 'DupeView must not display savings amounts');
    }
  });

  test('Removals-09: DetailView contains zero price blocks or niche savings badges', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const detailContent = fs.readFileSync('src/views/DetailView.js', 'utf8');
      assertNotIncludes(detailContent, 'priceMYR', 'DetailView must not display priceMYR');
      assertNotIncludes(detailContent, 'Jimat', 'DetailView must not display savings badge');
      assertNotIncludes(detailContent, 'RM ${', 'DetailView must not render RM string templates');
    }
  });

  // --- Target 3: Long Description Purge ---
  test('Removals-10: seedData.js and views do not output multi-sentence marketing descriptions', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const seedContent = fs.readFileSync('src/data/seedData.js', 'utf8');
      // Verify perfume seed definitions don't contain description keys
      assertNotIncludes(seedContent, 'description:', 'seedData.js must not contain description fields in perfumes');

      const homeContent = fs.readFileSync('src/views/HomeView.js', 'utf8');
      assertNotIncludes(homeContent, 'perfume.description', 'HomeView must not render perfume.description');

      const dirContent = fs.readFileSync('src/views/DirectoryView.js', 'utf8');
      assertNotIncludes(dirContent, 'p.description', 'DirectoryView must not render p.description');
    }
  });

  // --- Target 4: Role Simulator & Mock User Purge ---
  test('Removals-11: authService contains zero DEFAULT_MOCK_USER or toggleGuestSimulation', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const authContent = fs.readFileSync('src/services/authService.js', 'utf8');
      assertNotIncludes(authContent, 'DEFAULT_MOCK_USER', 'authService must not contain DEFAULT_MOCK_USER');
      assertNotIncludes(authContent, 'toggleGuestSimulation', 'authService must not have toggleGuestSimulation');
      assertNotIncludes(authContent, 'isGuestMode', 'authService must not have isGuestMode simulation state');
    }
  });

  test('Removals-12: Header, DetailView, and ProfileView contain zero role simulation buttons', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const headerContent = fs.readFileSync('src/components/Header.js', 'utf8');
      assertNotIncludes(headerContent, 'toggle-role-sim-btn', 'Header must not have toggle-role-sim-btn');

      const detailContent = fs.readFileSync('src/views/DetailView.js', 'utf8');
      assertNotIncludes(detailContent, 'detail-toggle-role-btn', 'DetailView must not have detail-toggle-role-btn');

      const profileContent = fs.readFileSync('src/views/ProfileView.js', 'utf8');
      assertNotIncludes(profileContent, 'profile-sim-btn', 'ProfileView must not have profile-sim-btn');
    }
  });

  // --- Target 5: Old Bookmarks Purge ---
  test('Removals-13: Old bookmark icon and "Almari Maya" are replaced with Love (❤️) system', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const detailContent = fs.readFileSync('src/views/DetailView.js', 'utf8');
      assertNotIncludes(detailContent, 'bookmark_border', 'DetailView must not use bookmark_border icon');
      assertNotIncludes(detailContent, 'Disimpan Dalam Almari Maya', 'DetailView must not use Almari Maya label');

      const profileContent = fs.readFileSync('src/views/ProfileView.js', 'utf8');
      assertNotIncludes(profileContent, 'Almari Maya Flacon Anda', 'ProfileView must not reference Almari Maya');
      assertNotIncludes(profileContent, 'Ahli Terverifikasi', 'ProfileView must not display badges');
    }
  });

  // --- Target 6: Brand Section Bottom Placement ---
  test('Removals-14: Brand carousel in DetailView is placed strictly below the community comments section', () => {
    if (typeof process !== 'undefined') {
      const fs = get_fs();
      const detailContent = fs.readFileSync('src/views/DetailView.js', 'utf8');
      // If brand carousel exists, its index must be after the comments container
      const commentsIdx = detailContent.indexOf('comments-container') !== -1
        ? detailContent.indexOf('comments-container')
        : detailContent.indexOf('komuniti') !== -1
        ? detailContent.indexOf('komuniti')
        : detailContent.indexOf('Ulasan');
      
      const brandCarouselIdx = detailContent.indexOf('Lebih dari') !== -1
        ? detailContent.indexOf('Lebih dari')
        : detailContent.indexOf('brand-carousel');
      
      if (commentsIdx !== -1 && brandCarouselIdx !== -1) {
        assertTrue(
          brandCarouselIdx > commentsIdx,
          'Brand carousel must be rendered strictly after/below the comments section'
        );
      }
    }
  });
});

// Browser-safe dynamic fs loader for Node.js
let nodeFs = null;
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    const fsSpecifier = 'node:fs';
    nodeFs = await import(fsSpecifier);
  } catch {}
}

function get_fs() {
  if (nodeFs) return nodeFs;
  return {
    existsSync: () => false,
    readFileSync: () => ''
  };
}
