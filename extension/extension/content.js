// content.js - TinyGuard content script
// This script runs IN EVERY WEB PAGE the user visits and monitors all network requests, resource loads, and embedded content to detect trackers and
// third-party domains. It reports findings back to the background.js.

// the full script is wrapped in IIFE (Immeadiately Invoked Function Expression) which prevents variables in the script
// from polluting the global scope of the webpage

(function() {

  // helper function for URL parsing: extracting the hostname from a full URL and returns null upon invalid URL
  function getHostnameFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return null;
    }
  }

  // helper function to extract the root domain from a hostname
  function rootFromHost(host) {

    // condition to return as is if no host is provided
    if (!host) return host;

    //splitting the hostname by dots and removing empty parts
    const parts = host.split('.').filter(Boolean);

    //return as is if the hostname has 2 or lesser parts, as it's already a root domain
    if (parts.length <= 2) return host;

    //joining the last two parts with a dot
    return parts.slice(-2).join('.');
  }

  // main reporting function

  // the function analyses the URL and sends the relevent data to background.js
  function report(url) {

    // extracting hostname and returning null if nothing can be parsed
    const host = getHostnameFromUrl(url);
    if (!host) return;

    // getting the root domain
    const root = rootFromHost(host);

    // determining if it is a third party request

    //obtaining the host page of the current page
    const pageHost = location.hostname || "";

    // third party if: a valid pageHost is present and the hostname doesn't include the page's hostname
    const isThirdParty = pageHost && !host.includes(pageHost);

    // building the message object
    const msg = {
      action: "reportRequest", //acknowledging background.js of a request report
      data: {
        url, //url of request
        host, // hostname
        root, // root domain
        isThirdParty, // boolean value of third party request
        isTracker: false // background will check if this is a tracker or not; set false here to avoid duplication
      }
    };

    // sending the message via a runtime message to background.js 
    chrome.runtime.sendMessage(msg);
  }

  // intercepting fetch() API requests

  //using a reference to store original fetch function to call the real fetch after logging the request
  const origFetch = window.fetch;

  // replacing global fetch function with wrapper
  window.fetch = function(input, init) {

    try {
    
      // fetch is called in two ways: through the string URL or with request object with the .url property
      const url = typeof input === 'string' ? input : (input && input.url);

      // upon success, reporting it
      if (url) report(url);
    } 

    // silently catching any errors so as not to break the page's fetch calls
    catch (e) {}

    // calling original fetch function
    return origFetch.apply(this, arguments);
  };

  // intercepting XMLHttpRequest Requests

  // Store a reference to the original XHR.open method
  const origOpen = XMLHttpRequest.prototype.open;

  // replacing  the XHR.open method with the wrapper
  XMLHttpRequest.prototype.open = function(method, url) {
    try {

      // if a URL is provided, report it   
      if (url) report(url);
    } 
    
    // silently catching any errors so as not to break XHR called
    catch (e) {}

    // calling original open method
    return origOpen.apply(this, arguments);
  };

  // catch resource load errors (images, scripts): these occur after attempt
  window.addEventListener('error', (e) => {
    try {
      //getting the source URL from the error event through e.target.src (images and scripts)
      // e.target.currentSrc as fallback for responsive images
      const src = e?.target?.src || e?.target?.currentSrc;

      //reporting upon success
      if (src) report(src);
    } 
    
    //catching errors in the error handler silently
    catch (er) {}
  }, true); // here true is set so the errors are caught before they bubble up


  // also scan existing resources on DOMContentLoaded (images, scripts, iframes)
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Query the page for all common resource elements
      const nodes = [...document.querySelectorAll('img,script,iframe,link')];

      // Loop through each element we found
      for (const n of nodes) {
        const src = n.src || n.href || n.getAttribute('data-src');

        //reporting upon success
        if (src) report(src);
      }
    } 
    // Silently catch any errors during scanning
    catch (e) {}
  });

  // a backup scan with a 1.2 second delay before doing another scan

  // used in case content.js runs before DOM is ready or
  // resources are loaded dynamically after DOMContentLoaded or
  // page uses lazy loading

  setTimeout(() => {
    try {
      // Query the page for all common resource elements
      const nodes = [...document.querySelectorAll('img,script,iframe,link')];

      // Loop through each element we found
      for (const n of nodes) {
        const src = n.src || n.href || n.getAttribute('data-src');

        //reporting upon success
        if (src) report(src);
      }
    } 
    //Silently catch any errors during scanning
    catch (e) {}
  }, 1200); // wait timer

})(); // the end of IIFE, so executed immeadiately 
