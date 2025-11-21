<h1>TinyGuard — Privacy Scanner & Tracker Blocker</h1>

<p>TinyGuard is a lightweight, Manifest V3 Chrome extension that analyzes and protects your privacy while browsing.  
It detects third-party requests, identifies known trackers, assigns a privacy score (A–F), and blocks 30,000+ tracking domains using high-performance MV3 declarative rules.</p>

<h2>🚀 Features</h2>

<h3>🔍 Real-Time Privacy Scanning</h3>
<ul>
  <li>Detects all outgoing network requests on each page</li>
  <li>Identifies trackers, analytics, ad networks, and third-party domains</li>
  <li>Shows a compact and readable list inside a clean popup UI</li>
</ul>

<h3>📊 Privacy Score (A–F)</h3>
<p>Each website receives a score based on:</p>
<ul>
  <li>Number of known trackers detected</li>
  <li>Number of third-party domains loaded</li>
  <li>Any risky permissions requested</li>
</ul>
<p>Designed to give users instant insight into a site's privacy profile.</p>

<h3>🛡️ Built-In Tracker Blocking</h3>
<p>TinyGuard actively blocks tracking domains using:</p>
<ul>
  <li>Static <code>declarativeNetRequest</code> rules (MV3)</li>
  <li>30,000+ tracker rules compiled from EasyPrivacy lists</li>
</ul>
<p>This approach avoids MV3’s dynamic rule limits while maximizing coverage and performance.</p>

<h3>⚡ Lightweight & Secure</h3>
<ul>
  <li>No external servers</li>
  <li>No data collection</li>
  <li>Runs fully locally inside Chrome</li>
  <li>Zero performance overhead thanks to MV3’s native DNR engine</li>
</ul>

<h2>🏗️ Tech Stack</h2>

<h3>Chrome Extension Architecture</h3>
<ul>
  <li><strong>Manifest V3</strong></li>
  <li><strong>Service Worker (background.js)</strong> - Handles tab tracking, scoring logic, messaging, tracker rule loading</li>
  <li><strong>Content Script (content.js)</strong> - Intercepts fetch/XHR requests and reports metadata</li>
  <li><strong>Popup UI (popup.html, popup.js)</strong> - Displays trackers, scores, blocked domains</li>
  <li><strong>Static Ruleset (rules.json)</strong> - 30,000+ precompiled blocking rules</li>
</ul>

<h3>Libraries & Data</h3>
<ul>
  <li>EasyPrivacy filter lists</li>
  <li>~46,000 known tracking & analytics domains</li>
  <li>Top 30,000 converted into rule resources</li>
  <li>Full list used for detection/scoring</li>
  <li>Chrome Storage API (for settings)</li>
  <li>MutationObserver (detect dynamic script injection)</li>
</ul>

<h2>⚙️ How It Works</h2>

<h3>1. Detection</h3>
<p>TinyGuard inspects:</p>
<ul>
  <li><code>fetch()</code></li>
  <li><code>XMLHttpRequest</code></li>
  <li><code>&lt;script&gt;/&lt;img&gt;</code> insertions</li>
  <li>Third-party domains</li>
  <li>Requests that match the EasyPrivacy database</li>
</ul>

<h3>2. Blocking</h3>
<p>Blocking is handled through MV3 static rule resources:</p>
<ul>
  <li>Pre-compiled JSON → <code>rules.json</code></li>
  <li>Loaded at install via <code>declarative_net_request.rule_resources</code></li>
  <li>Chrome’s internal DNR engine blocks requests instantly</li>
  <li>No JavaScript involved → ultra-fast & secure</li>
</ul>

<h3>3. Scoring</h3>
<p>Score = 100 − (15 × trackers) − (3 × third-parties) − (10 × risky permissions)</p>
<p>Grades:</p>
<ul>
  <li>A: 85–100</li>
  <li>B: 70–84</li>
  <li>C: 55–69</li>
  <li>D: 40–54</li>
  <li>F: 0–39</li>
</ul>

<h2>📦 Installation (Developer Mode)</h2>
<pre><code>git clone https://github.com/yourusername/tinyguard

Open Chrome → chrome://extensions
Enable Developer Mode
Click Load Unpacked
Select the tinyguard folder
</code></pre>

<h2>🖼️ Recommended Screenshots for GitHub & LinkedIn</h2>
<p>Include these 4 images:</p>
<ol>
  <li><strong>The Popup UI (Main Screenshot)</strong> - Show score, trackers, blocked trackers, third-parties list</li>
  <li><strong>Example: A Really Bad Website (F Grade)</strong> - Capture a popular site with lots of trackers (CNN, Forbes, Amazon, YouTube)</li>
  <li><strong>The Blocking Ruleset / JSON Preview</strong> - A cropped section of your <code>rules.json</code> to show scale</li>
  <li><strong>Architecture Diagram (optional)</strong> - Simple flowchart: User → Browser → TinyGuard (content script + background worker + DNR) → Network</li>
</ol>

<h2>🧪 Planned Improvements</h2>
<ul>
  <li>Custom user-defined blocking rules</li>
  <li>Popup “expand details” mode</li>
  <li>Cross-tab scoring statistics</li>
  <li>Heatmap of most common trackers</li>
  <li>Optional auto-refresh and continuous scanning</li>
</ul>

<h2>📄 License</h2>
<p>MIT License. Free to use, modify, and distribute.</p>
