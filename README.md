<h1 style="display: flex; align-items: center; gap: 12px;">
  <img src="icon48.png" alt="Overlink Icon" width="48" height="48" />
  Overlink
</h1>

Overlink is an elegant, modern browser extension for Chrome and Brave that allows you to open links, images, videos, and searches in an in-page modal dialog directly over your current tab, eliminating the need to constantly open and switch between new tabs.

## Features

*   **Context Menu Integration**: Right-click links, images, videos, or highlight text to open them instantly.
*   **Multi-Tab Overlay Modal**: Open multiple links in an elegant, glassmorphic in-page modal without ever leaving your current tab.
*   **Context-Aware Side Panel**: Prefer a vertical split? Send links to Chrome's native Side Panel. The side panel features **Tab-Isolated Sessions**, meaning it remembers exactly which Overlink tabs belong to which browser tab, swapping them automatically as you browse.
*   **Nested Context Menus**: You can highlight text or right-click links *inside* an Overlink tab and recursively open a new Overlink tab.
*   **History Navigation**: Safely navigate back and forward within your Overlink tabs via dedicated history controls powered by cross-origin message passing.
*   **Smart Tab Titles**: Tabs display the URL path and search query instead of just the domain, giving you much better context.
*   **Frame Restriction Bypass**: Uses the advanced `declarativeNetRequest` API to bypass restrictive headers (`X-Frame-Options` and `Content-Security-Policy`), allowing even strictly controlled sites (like Google Search and Google Cloud Docs) to load seamlessly.

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
2.  **For Links/Media:** Right-click a link, image, or video and select **"Open in Overlay"** or **"Open in Side Panel"**.
3.  **For Text Search:** Highlight any text, right-click, and select **"Search in Overlay"** or **"Search in Side Panel"**.
4.  Opening multiple links will stack them neatly as tabs within the Overlay or the Side Panel!
