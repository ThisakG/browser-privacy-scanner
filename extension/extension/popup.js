// popup script for TinyGuard: contains the code that controls the popup interface when users click the extension

// main functions: 
// runs an initial scan when the extension is clicked
// Scan button to refresh results manually
// a toggle present to enable or disable blocking function
// displaying the list of trackers, third-party domains, permissions and the blocked trackers if toggle is enabled 


// initialization
// waiting for the entire HTML doc to be loaded and parsed, so that all DOM elements are present before accessing them
document.addEventListener("DOMContentLoaded", () => {

  //getting references to UI elements through id's; null if elements do not exist
  const scanBtn = document.getElementById("scanBtn"); //button for manual scan
  const blockToggle = document.getElementById("blockToggle"); // toggle for blocking

  // runScan func when manual scan button is clicked
  scanBtn.addEventListener("click", runScan);


  // setting up blocking toggle
  if (blockToggle) {

    // Initialize toggle state from background.js and sync with actual blocking state
    chrome.runtime.sendMessage({ action: "getBlockingState" }, (res) => {

      //in the case of a valid response
      if (res && typeof res.blockingEnabled === "boolean") {
        //set the checkbox to match the current state (checked means enabled)
        blockToggle.checked = res.blockingEnabled;
      }
    });

    //listen for when the user toggles the checkbox
    blockToggle.addEventListener("change", () => {

      //obtain new state upon change
      const enabled = blockToggle.checked;

      //sending a runtime message to background.js to update blocking state
      chrome.runtime.sendMessage({ action: "setBlocking", enabled }, (resp) => {

        //a log result set for efficiency
        console.log("[TinyGuard Popup] Blocking toggled:", enabled, resp);
      });
    });
  }

  // Run an initial scan automatically when popup opens, so the user can get results without clicking the scan button
  runScan();
});


// main scan function


function runScan() {

  // displaying loading state
  setLoadingState(true);

  // using query chrome to get the currently active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    // validation condition ot make sure that tab results are obtained
    if (!tabs || tabs.length === 0) {
      //display error message in the case of no tab found
      setEmpty("No active tab found.");
      setLoadingState(false);
      return;
    }

    //extracting the tab ID from the first result
    const tabId = tabs[0].id;

    // requesting background.js for scan data of the specific tab
    chrome.runtime.sendMessage({ action: "getScanData", tabId }, (res) => {

      // setting loading state to false since there is a response now
      setLoadingState(false);

      // in the case there is no response received, display error message
      if (!res) {
        setEmpty("No scan data available. Try refreshing or wait a few seconds for the scanner to run.");
        return;
      }

      // once data is obtained, render it to the UI
      renderAll(res);
    });
  });
}

//loading state management

function setLoadingState(on) {

  //getting references to all the elements that needs to be updated

  const scoreVal = document.getElementById("scoreValue"); // privacy score number
  const gradeVal = document.getElementById("gradeValue"); // privacy score letter (A-F)

  const trackersList = document.getElementById("trackersList"); // list of trackers
  const thirdList = document.getElementById("thirdList"); // list of third party domains
  const permList = document.getElementById("permList"); // list of permissions
  const blockedList = document.getElementById("blockedList"); // list of blocked sites

  const trackersCount = document.getElementById("trackersCount"); // count of the identified trackers
  const thirdCount = document.getElementById("thirdCount"); // count of the third party domains
  const permCount = document.getElementById("permCount"); // count of the permissions 
  const blockedCount = document.getElementById("blockedCount"); // count of the blocked items

  // exit if there aren't any score elements
  if (!scoreVal) return;

  // if conditions where if loading is ON, a different value for score and blank for grade
  // and if OFF a different value score and blank
  scoreVal.textContent = on ? "..." : "--";
  if (gradeVal) gradeVal.textContent = on ? "" : "-";

  // show scanning if loading, and blank if not when updating 
  if (trackersList) trackersList.innerHTML = on ? "<div class='empty'>Scanning…</div>" : "";
  if (thirdList) thirdList.innerHTML = "";
  if (permList) permList.innerHTML = "";
  if (blockedList) blockedList.innerHTML = "";

  // show scanning if loading, and blank if not when updating 
  if (trackersCount) trackersCount.textContent = "(…)";
  if (thirdCount) thirdCount.textContent = "(…)";
  if (permCount) permCount.textContent = "(…)";
  if (blockedCount) blockedCount.textContent = "(…)";

  // resetting the score bar to 0% upon rescan
  const scoreBar = document.getElementById("scoreBar");
  if (scoreBar) scoreBar.style.width = "0%";
}

// function used for error messages or in the case of no data states
function setEmpty(msg) {
  const trackersList = document.getElementById("trackersList");
  if (trackersList) trackersList.innerHTML = `<div class="empty">${msg}</div>`;
}

//rendering data to UI

function renderAll(data) {
  // destructuring the data object from the background.js in a specific order as set below
  const { score, grade, trackers, thirdParties, permissions, blocked } = data;

  // a preventive measure where if any value is undefined or isn't an array, default to empty array
  const trackersArr = Array.isArray(trackers) ? trackers : [];
  const thirdArr = Array.isArray(thirdParties) ? thirdParties : [];
  const permArr = Array.isArray(permissions) ? permissions : [];
  const blockedArr = Array.isArray(blocked) ? blocked : [];

  // Update top-level score UI to show the numerical score
  const scoreEl = document.getElementById("scoreValue");
  if (scoreEl) scoreEl.textContent = score;

  // Update top-level score UI to show the alphabetical grade
  const gradeEl = document.getElementById("gradeValue");
  if (gradeEl) gradeEl.textContent = grade;

  // Update counts
  const trackersCountEl = document.getElementById("trackersCount");
  const thirdCountEl = document.getElementById("thirdCount");
  const permCountEl = document.getElementById("permCount");
  const blockedCountEl = document.getElementById("blockedCount");

  // displaying the updated counts 
  if (trackersCountEl) trackersCountEl.textContent = `(${trackersArr.length})`;
  if (thirdCountEl) thirdCountEl.textContent = `(${thirdArr.length})`;
  if (permCountEl) permCountEl.textContent = `(${permArr.length})`;
  if (blockedCountEl) blockedCountEl.textContent = `(${blockedArr.length})`;

  // updating the score bar with a clamp between 0 to 100
  const width = Math.min(100, Math.max(0, score));
  const scoreBar = document.getElementById("scoreBar");
  if (scoreBar) scoreBar.style.width = width + "%";

  // Render lists
  fillList("trackersList", trackersArr); // the tracker section
  fillList("thirdList", thirdArr); // the third party domain section
  fillList("permList", permArr); // the permissions section
  fillList("blockedList", blockedArr); // fill the blocked items section
}

function fillList(id, items) {

  // a safety check to bail the element if it doesn't exist 
  const el = document.getElementById(id);
  if (!el) return;

  // show an error message in the case of no items present
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="empty">None detected ✔</div>`;
    return;
  }

  // Render the items as a list with an escapeHtml() to prevent XSS attacks
  // show only the first 50 items and join all the HTML strings together
  el.innerHTML = items.slice(0, 50).map(i => `<div class="item">${escapeHtml(i)}</div>`).join("");
}

// a helper function to avoid injecting raw HTML from unexpected values to prevent XSS attacks
function escapeHtml(str) {
  return String(str) // conversion to string first
    .replace(/&/g, "&amp;") // conversion of & character
    .replace(/</g, "&lt;") // conversion of < character
    .replace(/>/g, "&gt;") // conversion of > character
    .replace(/"/g, "&quot;") // conversion of "" character
    .replace(/'/g, "&#039;"); // conversion of ' character
}
