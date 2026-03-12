<h1 style="display: flex; align-items: center; gap: 12px;">
  <img src="icon48.png" alt="Overlink Icon" width="48" height="48" />
  Overlink
</h1>

Overlink is an elegant, modern browser extension for Chrome and Brave that allows you to open links in an in-page modal dialog directly over your current tab, eliminating the need to constantly open and switch between new tabs.

## Features

*   **Context Menu Integration**: Right-click links or highlight text to open them instantly.
*   **Multi-Tab Overlay Modal**: Open multiple links in an elegant, glassmorphic in-page modal without ever leaving your current tab. The modal supports switching between active tabs effortlessly.
*   **Persistent Side Panel**: Prefer a vertical split? Send links and searches directly to Chrome's native Side Panel, powered by its own multi-tab interface.
*   **Quick Search**: Highlight text on any page, right-click, and search Google within the Overlay or Side Panel immediately.
*   **Frame Restriction Bypass**: Uses the `declarativeNetRequest` API to bypass restrictive headers (`X-Frame-Options` and `Content-Security-Policy`), allowing almost any site (like GitHub, Luma) to load.
*   **Safe Fallback**: Includes a sleek "Open in new tab" button if a site completely refuses to be embedded.

## Installation (Developer Mode)

Since this extension uses powerful network request modification to bypass frame protections, it is best installed manually via Developer Mode.

1.  Download or clone this repository to your local machine.
2.  Open your browser and navigate to the extensions page (`chrome://extensions/` for Chrome, `brave://extensions/` for Brave).
3.  Enable **Developer mode** by toggling the switch in the top right corner.
4.  Click the **Load unpacked** button in the top left.
5.  Select the directory containing this project's files (`manifest.json`, etc.).
6.  The Overlink extension is now installed and ready to use!

## Usage

1.  Navigate to any standard webpage.
2.  **For Links:** Right-click a link and select **"Open link in Overlay"** or **"Open link in Side Panel"**.
3.  **For Text Search:** Highlight any text, right-click, and select **"Search in Overlay"** or **"Search in Side Panel"**.
4.  Opening multiple links will stack them neatly as tabs within the Overlay or the Side Panel!
