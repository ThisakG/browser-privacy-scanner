TinyGuard — Privacy Scanner & Tracker Blocker

TinyGuard is a lightweight, Manifest V3 Chrome extension that analyzes and protects your privacy while browsing.
It detects third-party requests, identifies known trackers, assigns a privacy score (A–F), and blocks 30,000+ tracking domains using high-performance MV3 declarative rules.

🚀 Features
🔍 Real-Time Privacy Scanning

Detects all outgoing network requests on each page

Identifies trackers, analytics, ad networks, and third-party domains

Shows a compact and readable list inside a clean popup UI

📊 Privacy Score (A–F)

Each website receives a score based on:

Number of known trackers detected

Number of third-party domains loaded

Any risky permissions requested
Designed to give users instant insight into a site's privacy profile.

🛡️ Built-In Tracker Blocking

TinyGuard actively blocks tracking domains using:

Static declarativeNetRequest rules (MV3)

30,000+ tracker rules compiled from EasyPrivacy lists
This approach avoids MV3’s dynamic rule limits while maximizing coverage and performance.

⚡ Lightweight & Secure

No external servers

No data collection

Runs fully locally inside Chrome

Zero performance overhead thanks to MV3’s native DNR engine

🏗️ Tech Stack
Chrome Extension Architecture

Manifest V3

Service Worker (background.js)
Handles tab tracking, scoring logic, messaging, tracker rule loading

Content Script (content.js)
Intercepts fetch/XHR requests and reports metadata

Popup UI (popup.html, popup.js)
Displays trackers, scores, blocked domains

Static Ruleset (rules.json)
30,000+ precompiled blocking rules

Libraries & Data

EasyPrivacy filter lists

~46,000 known tracking & analytics domains

Top 30,000 converted into rule resources

Full list used for detection/scoring

Chrome Storage API (for settings)

MutationObserver (detect dynamic script injection)

⚙️ How It Works
1. Detection

TinyGuard inspects:

fetch()

XMLHttpRequest

<script>/<img> insertions

Third-party domains

Requests that match the EasyPrivacy database

2. Blocking

Blocking is handled through MV3 static rule resources:

Pre-compiled JSON → rules.json

Loaded at install via declarative_net_request.rule_resources

Chrome’s internal DNR engine blocks requests instantly

No JavaScript involved → ultra-fast & secure

3. Scoring

Score = 100 − (15 × trackers) − (3 × third-parties) − (10 × risky permissions)
Grades:

A: 85–100

B: 70–84

C: 55–69

D: 40–54

F: 0–39

📦 Installation (Developer Mode)

Clone the repository:

git clone https://github.com/yourusername/tinyguard


Open Chrome → chrome://extensions

Enable Developer Mode

Click Load Unpacked

Select the tinyguard folder

🖼️ Recommended Screenshots for GitHub & LinkedIn
Include these 4 images:
1️⃣ The Popup UI (Main Screenshot)

Show:

Score

Trackers

Blocked trackers

Third-parties list
This is your strongest visual.

2️⃣ Example: A Really Bad Website (F Grade)

People love seeing scary results.
Capture a popular site with lots of trackers (CNN, Forbes, Amazon, YouTube).

3️⃣ The Blocking Ruleset / JSON Preview

(A cropped section of your rules.json)
Shows the scale of 30k+ rules and looks impressive to recruiters/engineers.

4️⃣ Architecture Diagram (optional, but very strong)

A simple flowchart:

User → Browser → TinyGuard (content script + background worker + DNR) → Network

I can generate a diagram for you if you want.

🧪 Planned Improvements

Custom user-defined blocking rules

Popup “expand details” mode

Cross-tab scoring statistics

Heatmap of most common trackers

Optional auto-refresh and continuous scanning

📄 License

MIT License. Free to use, modify, and distribute.
