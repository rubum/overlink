<h1 style="display: flex; align-items: center; gap: 12px;">
  <img src="icon48.png" alt="Overlink Icon" width="48" height="48" />
  Overlink
</h1>

Overlink is an elegant, modern browser extension for Chrome and Brave that allows you to open links in an in-page modal dialog directly over your current tab, eliminating the need to constantly open and switch between new tabs.

## Features Let's you 

*   **Context Menu Integration**: Simply right-click any link and select "Open as overlay".
*   **Premium Glassmorphic UI**: Features a beautiful, responsive modal with smooth animations and dark mode support.
*   **Frame Restriction Bypass**: Uses the `declarativeNetRequest` API (supported in both Chrome and Brave) to bypass restrictive headers (`X-Frame-Options` and `Content-Security-Policy`), allowing almost any site (like GitHub, Luma) to load within the frame.
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
2.  Find a link you want to check quickly.
3.  Right-click the link to open the context menu.
4.  Click **"Open as overlay"**.
5.  Read the content within the beautiful overlay! When finished, click the close button (X) or simply click anywhere outside the modal.
