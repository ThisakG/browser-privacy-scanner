// TinyGuard Background Script that supports static rules
// It manages tracker detection, blocking rules, scan results, and communication between the popup UI and content scripts.
// Supports 10K+ trackers using Chrome's declarativeNetRequest API

//declaring global state variables

let trackerSet = new Set(); // set that contains all known tracker domains
let scanResults = {}; // object storing scan results for each open tab
let scanTimers = {}; // object storing timeout references for eah tab's scan finalization
const SCAN_DELAY = 3000; // 3 second delay before running the first scan

// The ruleset ID must match what's in manifest.json
// references the static blocking rules in rules.json
const RULESET_ID = "tracker_blocklist";

// Blocking state persistence: functions to save and load the blocking toggle state to Chrome storage

// function to save the blocking enables/disabled state to persistent storage
async function setBlockingState(enabled) {
  try {

    // saving to Chrome's local storage: !! converts the value to a boolean value
    await chrome.storage.local.set({ blockingEnabled: !!enabled });
    console.log(`[TinyGuard] Blocking state saved: ${enabled}`);
  } catch (e) {
    console.error("[TinyGuard] Error saving blocking state:", e);
  }
}

// function to retrieve the blocking state from persistent storage
async function getBlockingState() {
  try {

    // get from storage, default to false if not found
    const result = await chrome.storage.local.get({ blockingEnabled: false });
    return !!result.blockingEnabled;
  } catch (e) {
    console.error("[TinyGuard] Error getting blocking state:", e);
    return false;
  }
}

// tracker databse loading for detection via trakers.json

async function loadTrackers() {
  try {
    
    // fetch the trackers.json file from the extension's directoryt
    const response = await fetch(chrome.runtime.getURL("trackers.json"));
    const data = await response.json();
    
    //validating that the json contains a tackers array
    if (Array.isArray(data.trackers)) {

      //convert all tracker domains to lowercase and store in a set
      trackerSet = new Set(data.trackers.map(x => String(x).toLowerCase()));
      console.log(`[TinyGuard] Detection database loaded: ${trackerSet.size.toLocaleString()} trackers`);
    } else {
      console.warn("[TinyGuard] trackers.json missing 'trackers' array");
    }
  } catch (e) {
    console.error("[TinyGuard] Failed to load trackers.json:", e);
  }
}

// function to enable/disable static blocking rules

//enables tracker blocking by activating DNR rules which tells chrome to start blocking requests that match the rules in rules.json
async function enableBlocking() {
  try {
    //enabling ruleset
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [RULESET_ID]
    });
    
    // verifying that the ruleset is now active 
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    console.log(`[TinyGuard] ✅ Blocking ENABLED`);
    console.log(`[TinyGuard] Active rulesets:`, enabledRulesets);
    
    return true;
  } catch (e) {
    console.error("[TinyGuard] Failed to enable blocking:", e);
    return false;
  }
}

// disabling tracker blocking by deactivating DNR ruleset
async function disableBlocking() {
  try {
    // telling DNR API to disable ruleset
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [RULESET_ID]
    });
    
    console.log(`[TinyGuard] ❌ Blocking DISABLED`);
    return true;
  } catch (e) {
    console.error("[TinyGuard] Failed to disable blocking:", e);
    return false;
  }
}

// initialization: runs when the extension is first installed or when browser starts

// setting to run upon installation or updating
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[TinyGuard] Extension installed/updated");
  
  // loading tracker detection database
  await loadTrackers();
  
  // checking saved blocking state
  const enabled = await getBlockingState();
  console.log(`[TinyGuard] Initial blocking state: ${enabled}`);
  

  // applying the blocking state
  if (enabled) {
    await enableBlocking();
  } else {
    // Make sure it's disabled if state is set to false
    await disableBlocking();
  }
  
  // printing stats to the console
  logStatistics();
});


//runs when the browser starts, not set to extension installation/update
chrome.runtime.onStartup.addListener(async () => {
  console.log("[TinyGuard] Browser started");
  
  await loadTrackers();
  
  const enabled = await getBlockingState();
  if (enabled) {
    await enableBlocking();
  }
  
  logStatistics();
});


// stat logging: log current stats to the console which shows tracker count, blocking status and the coverage percentage
async function logStatistics() {
  try {

    //checking if the ruleset is active
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    const isBlocking = enabledRulesets.includes(RULESET_ID);
    
    console.log("\n=== TinyGuard Statistics ===");
    console.log(`Detection Database: ${trackerSet.size.toLocaleString()} trackers`);
    console.log(`Blocking Status: ${isBlocking ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    
    if (isBlocking) {
      // Note: We can't easily get the exact rule count from static rulesets but we know it's whatever we put in rules.json (10K)
      console.log(`Blocking Rules: ~10,000 (static ruleset)`);

      //calculating the coverage percentage
      console.log(`Coverage: ~${((10000 / trackerSet.size) * 100).toFixed(1)}%`);
    }
    console.log("============================\n");
  } catch (e) {
    console.error("[TinyGuard] Error logging statistics:", e);
  }
}


// message handling: messages from popup.js and content.js handling
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Handle reportRequest from content.js
  if (msg.action === "reportRequest" && sender.tab) {
    handleReportRequest(msg, sender);
    // set to false in order to keep the channel closed
    return false;
  }

  // Handle getScanData from popup.js so it can display the scan results
  if (msg.action === "getScanData" && msg.tabId !== undefined) {
    handleGetScanData(msg.tabId, sendResponse);
    // Keep channel open for async responses
    return true; 
  }

  // Handle blocking toggle
  if (msg.action === "setBlocking" && typeof msg.enabled === "boolean") {
    handleSetBlocking(msg.enabled, sendResponse);
    // Keep channel open for async responses
    return true; 
  }

  // Handle getBlocking request so popup.js can sync the toggle UI with actual blocking state
  if (msg.action === "getBlocking") {
    getBlockingState().then(enabled => {
      sendResponse({ enabled });
    }).catch(e => {
      console.error("[TinyGuard] Error in getBlocking:", e);
      sendResponse({ enabled: false });
    });
    // Keep channel open for async responses
    return true;
  }
  
  // Diagnostics: shows the state of the extension
  if (msg.action === "getDiagnostics") {
    handleGetDiagnostics(sendResponse);
    return true;
  }
  
  //keeping channel closed in order to avoid unhandled messages
  return false;
});

// function for message handling: handling a request report from content.js 
function handleReportRequest(msg, sender) {
  const tabId = sender.tab.id;
  
  // Initialize scan results for this tab if not already present
  if (!scanResults[tabId]) {
    scanResults[tabId] = { 
      trackers: [],      // Known tracker domains detected
      thirdParties: [],  // Third-party domains 
      permissions: [],   // Extension permissions 
      blocked: []        // Domains that are actually being blocked
    };
  }

  // extracting URL from the message
  const url = msg.data?.url;
  // return null if nothing to process
  if (!url) return;

  //parssing URL to get hostname and the root domain
 let hostname, root;
try {
  //converting to lowercase for comparison
  hostname = new URL(url).hostname.toLowerCase();
  // extracting root domain
  const parts = hostname.split(".");
  root = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
} catch (e) {
  // silently exit if parsing fails
  return;
}


// checking if the domain is a known tracker by checking both exact match and subdomain match
function isTrackerDomain(host, root) {
  // initially checking root domain
  if (trackerSet.has(root)) return true;
  // checking the full hostname/parent domain
  for (const t of trackerSet) {
    //return true if there is an exact match or subdomain match
    if (host === t || host.endsWith("." + t)) {
      return true;
    }
  }
  return false;
}

// Determine the page's domain for third-party detection
  const pageDomain = sender.tab?.url ? (() => {
    try { 
      // parsing URL to get root domain
      const hostname = new URL(sender.tab.url).hostname;
      const parts = hostname.split(".");
      return parts.length > 2 ? parts.slice(-2).join(".").toLowerCase() : hostname.toLowerCase();
    } catch(e) { 
      // returning null value if parsing fails
      return null; 
    }
  })() : null;

// classifying the obtained request

// checking to see if this is this a known tracker 
const isTracker = isTrackerDomain(hostname, root);

// checking to see if this is a third party request
const isThirdParty = pageDomain && root !== pageDomain;

//updating scan results

// adding to trackers list if detected as a tracker if not already recorded
  if (isTracker && !scanResults[tabId].trackers.includes(root)) {
    scanResults[tabId].trackers.push(root);
  }

  // adding to third-party list if detected as a third party domain if not already recorded
  if (isThirdParty && !scanResults[tabId].thirdParties.includes(root)) {
    scanResults[tabId].thirdParties.push(root);
  }


  // Resetting the finalization timer

  //clearing any existing timers for the tab
  if (scanTimers[tabId]) clearTimeout(scanTimers[tabId]);

  // Set a new timer to finalize the scan after SCAN_DELAY of 3 seconds
  // This timer gets reset every time a new request is detected
  scanTimers[tabId] = setTimeout(() => {
    scanTimers[tabId] = null;
    console.log(`[TinyGuard] Scan complete for tab ${tabId}:`, {
      trackers: scanResults[tabId].trackers.length,
      thirdParties: scanResults[tabId].thirdParties.length
    });
  }, SCAN_DELAY);
}

// function to handle getScanData request from the popup and returns the results with privacy score and grade
async function handleGetScanData(tabId, sendResponse) {

  //getting scan results or using empty defaults
  const result = scanResults[tabId] || { 
    trackers: [], 
    thirdParties: [], 
    permissions: [], 
    blocked: [] 
  };

  try {
    // getting extension permissions
    const perms = await chrome.permissions.getAll();

    // array containing list of risky permissions that affects the final score
    const risky = ["clipboardRead", "clipboardWrite", "tabs", "history", "bookmarks"];

    //filter to show on those permissions that are granted
    result.permissions = perms.permissions ? perms.permissions.filter(p => risky.includes(p)) : [];
    
    // Check which trackers are blocked (all detected trackers if blocking is enabled)
    const blockingEnabled = await getBlockingState();
    if (blockingEnabled) {
      // if blocking enabled
      result.blocked = [...result.trackers];
    } else {
      // if blocking diabled
      result.blocked = [];
    }
    
    // Compute score
    const score = 100 - result.trackers.length * 15 - result.thirdParties.length * 3 - result.permissions.length * 10;

    // clamping score between 0-100
    const finalScore = Math.max(0, Math.min(100, score));
    
    let grade = "A";
    if (finalScore < 85) grade = "B"; // 84-70
    if (finalScore < 70) grade = "C"; // 69-55
    if (finalScore < 55) grade = "D"; // 54-40
    if (finalScore < 40) grade = "F"; // 0 -39

    // sending response to popup.js
    sendResponse({
      trackers: result.trackers,
      thirdParties: result.thirdParties,
      permissions: result.permissions,
      blocked: result.blocked,
      score: finalScore,
      grade
    });
  } catch (e) {
    // If anything fails, send a partial response with default values
    console.error("[TinyGuard] Error in getScanData:", e);
    sendResponse({
      trackers: result.trackers,
      thirdParties: result.thirdParties,
      permissions: [],
      blocked: result.blocked,
      score: 50,
      grade: "C"
    });
  }
}

// function to handle the setBlocking request from the popup
async function handleSetBlocking(enabled, sendResponse) {
  try {
    // saving the new blocking state to persistent storage
    await setBlockingState(enabled);
    
    if (enabled) {
      // enable ruleset if blocking is set to ON
      const success = await enableBlocking();
      sendResponse({ ok: success, enabled: success });
    } else {
      //disable ruleset if blocking is set to OFF
      const success = await disableBlocking();
      sendResponse({ ok: success, enabled: false });
    }
  } catch (e) {
    // If anything fails, send an error response
    console.error("[TinyGuard] Error setting blocking:", e);
    sendResponse({ ok: false, error: e.message });
  }
}

// function to handle the getDiagnostics request from the popup
async function handleGetDiagnostics(sendResponse) {
  try {
    // Check which rulesets are currently enabled
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    // Get the saved blocking state
    const blockingEnabled = await getBlockingState();
    // Check if our ruleset is actually active
    const isActive = enabledRulesets.includes(RULESET_ID);
    
    //sending response message to popup.js
    sendResponse({
      totalTrackersInDB: trackerSet.size, //no.of trackers in the database
      blockingRulesCount: 10000, // Static rules count
      blockingEnabled: blockingEnabled, // state of blocking toggle
      rulesetActive: isActive, // when the rule set is active in Chrome
      coverage: trackerSet.size > 0 // percentage of trackers blocked
        ? ((10000 / trackerSet.size) * 100).toFixed(1) + '%'
        : '0%',
      ruleType: 'static'
    });
  } catch (e) {
    // If anything fails, send diagnostic response with error info
    console.error("[TinyGuard] Error getting diagnostics:", e);
    sendResponse({
      totalTrackersInDB: trackerSet.size,
      blockingRulesCount: 0,
      blockingEnabled: false,
      rulesetActive: false,
      coverage: '0%',
      ruleType: 'static',
      error: e.message
    });
  }
}

// Clean up scan results when tab closes: removes the data
chrome.tabs.onRemoved.addListener((tabId) => {

  // removing scan results of the specific tab
  delete scanResults[tabId];

  // clear and remove any pending scan timers for the specific tab
  if (scanTimers[tabId]) {
    clearTimeout(scanTimers[tabId]);
    delete scanTimers[tabId];
  }
});