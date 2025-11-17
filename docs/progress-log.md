<img width="435" height="236" alt="image" src="https://github.com/user-attachments/assets/8cd2a9d3-b0c5-48e8-b1f4-a217b18e7c68" />

# what is manifest.json?
manifest.json is the core configuration file for any Chrome extension. It tells the browser:

- Extension identity: name, version, and description

- Resources: icons, popups, background scripts, content scripts

- Permissions: what the extension is allowed to access (tabs, network requests, storage, etc.)

- Behavior: which scripts run when (service workers, background, or popup scripts)

- Compatibility: which hosts the extension can interact with (host_permissions)

Think of it as the “blueprint” for the browser — without it, Chrome doesn’t know how to load or run your extension.


# Initial permissions set for TinyGuard:

| Permission                         | Why it’s needed                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `tabs`                             | To query the active tab and read its URL for scanning                                |
| `activeTab`                        | Grants temporary access to the currently open tab when the user clicks the extension |
| `storage`                          | To save scan results locally (like privacy logs)                                     |
| `webRequest`                       | To intercept network requests made by the page and detect trackers                   |
| `scripting`                        | Enables scripts to be injected into the page if needed                               |
| `host_permissions: ["<all_urls>"]` | Allows the extension to scan any website the user visits                             |
