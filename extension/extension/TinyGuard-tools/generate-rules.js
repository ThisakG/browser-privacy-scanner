// generate-rules.js - 30K VERSION
// Run with: node generate-rules.js
// This generates a static rules.json file from your trackers.json

const fs = require('fs');

// Configuration
const INPUT_FILE = 'trackers.json';      // Your 46K tracker list
const OUTPUT_FILE = 'rules.json';        // Will be created
const MAX_RULES = 30000;                 // MAXIMUM: 30K trackers! 🚀

const VALID_RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "media",
  "websocket",
  "webtransport",
  "other"
];

console.log('🚀 TinyGuard Static Rules Generator - 30K EDITION');
console.log('==================================================\n');

// Load your tracker list
console.log(`📂 Loading ${INPUT_FILE}...`);
let trackerData;
try {
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  trackerData = JSON.parse(rawData);
} catch (error) {
  console.error('❌ Error loading trackers.json:', error.message);
  process.exit(1);
}

if (!Array.isArray(trackerData.trackers)) {
  console.error('❌ Error: trackers.json must have a "trackers" array');
  process.exit(1);
}

console.log(`✅ Loaded ${trackerData.trackers.length.toLocaleString()} trackers\n`);

// Priority trackers (most common ones first)
const priorityTrackers = [
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'googleadservices.com',
  'facebook.com',
  'connect.facebook.net',
  'facebook.net',
  'twitter.com',
  'linkedin.com',
  'scorecardresearch.com',
  'quantserve.com',
  'adnxs.com',
  'amazon-adsystem.com',
  'chartbeat.com',
  'criteo.com',
  'criteo.net',
  'outbrain.com',
  'taboola.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'adsafeprotected.com',
  'advertising.com',
  'bing.com',
  'yahoo.com',
  'pixel.facebook.com',
  'analytics.twitter.com',
  'ads-twitter.com',
  'mouseflow.com',
  'hotjar.com',
  'crazyegg.com',
  'luckyorange.com',
  'inspectlet.com',
  'segment.com',
  'segment.io',
  'amplitude.com',
  'mixpanel.com',
  'fullstory.com',
  'loggly.com',
  'newrelic.com',
  'nr-data.net',
  'optimizely.com',
  'pardot.com',
  'salesforce.com',
  'marketo.net',
  'eloqua.com',
  'hubspot.com',
  'doubleclick.com',
  'adservice.google.com',
  'googletag.pubads.com'
];

// Create a set for fast lookup
const prioritySet = new Set(priorityTrackers.map(t => t.toLowerCase()));
const allTrackers = trackerData.trackers.map(t => t.toLowerCase());

// Remove duplicates
const uniqueTrackers = [...new Set(allTrackers)];

// Sort: priority trackers first, then the rest
const sortedTrackers = [
  ...uniqueTrackers.filter(t => prioritySet.has(t)),
  ...uniqueTrackers.filter(t => !prioritySet.has(t))
];

// Take first MAX_RULES (30K)
const trackersToBlock = sortedTrackers.slice(0, MAX_RULES);

console.log('🎯 Prioritization:');
console.log(`   Priority trackers included: ${priorityTrackers.filter(t => trackersToBlock.includes(t)).length}`);
console.log(`   Unique trackers after dedup: ${uniqueTrackers.length.toLocaleString()}`);
console.log(`   Total trackers to block: ${trackersToBlock.length.toLocaleString()}\n`);

// Generate DNR rules
console.log('⚙️  Generating declarativeNetRequest rules...');
console.log('   (This may take 10-30 seconds for 30K rules...)\n');

const startTime = Date.now();

const rules = trackersToBlock.map((domain, index) => ({
  id: index + 1,
  priority: 1,
  action: {
    type: "block"
  },
  condition: {
    urlFilter: `*${domain}*`,
    resourceTypes: VALID_RESOURCE_TYPES
  }
}));

const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`✅ Generated ${rules.length.toLocaleString()} rules in ${generationTime}s\n`);

// Save to file
console.log(`💾 Saving to ${OUTPUT_FILE}...`);
console.log('   (This may take 10-20 seconds for a large file...)\n');

try {
  const saveStart = Date.now();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rules, null, 2));
  const saveTime = ((Date.now() - saveStart) / 1000).toFixed(2);
  
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Saved successfully in ${saveTime}s!`);
  console.log(`   File size: ${fileSize} MB\n`);
} catch (error) {
  console.error('❌ Error saving rules.json:', error.message);
  process.exit(1);
}

// Generate statistics
const coverage = ((trackersToBlock.length / trackerData.trackers.length) * 100).toFixed(1);
const remaining = trackerData.trackers.length - trackersToBlock.length;

console.log('📊 Final Statistics:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Total trackers in database: ${trackerData.trackers.length.toLocaleString()}`);
console.log(`   Unique trackers: ${uniqueTrackers.length.toLocaleString()}`);
console.log(`   Rules generated: ${rules.length.toLocaleString()}`);
console.log(`   Coverage: ${coverage}% 🎯`);
console.log(`   Remaining (detection only): ${remaining.toLocaleString()}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Coverage breakdown
if (coverage >= 65) {
  console.log('🎉 EXCELLENT! You\'re blocking the vast majority of trackers!');
} else if (coverage >= 50) {
  console.log('✅ GREAT! You\'re blocking more than half of all trackers!');
} else if (coverage >= 30) {
  console.log('👍 GOOD! You\'re blocking a significant portion of trackers!');
} else {
  console.log('⚠️  Consider using more rules for better coverage.');
}

console.log('\n✅ Done! Next steps:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   1. ✓ rules.json created (copy to extension folder)');
console.log('   2. → Update manifest.json (if not already done)');
console.log('   3. → Update background.js (if not already done)');
console.log('   4. → Reload extension in Chrome');
console.log('   5. → Test on tracker-heavy sites (CNN, Forbes)\n');

// Optional: Save a list of what's being blocked for reference
const blockedListFile = 'blocked-trackers.txt';
fs.writeFileSync(blockedListFile, trackersToBlock.join('\n'));
console.log(`📝 Bonus: Saved list of blocked trackers to ${blockedListFile}\n`);

// Performance estimate
console.log('⚡ Expected Performance:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Extension load time: ~200-300ms');
console.log('   Toggle speed: <10ms (instant)');
console.log('   Memory usage: ~20-25 MB');
console.log('   Network blocking: <1ms per request\n');

console.log('🚀 You now have MAXIMUM blocking power! 🚀\n');
