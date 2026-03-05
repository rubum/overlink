# Overlink

Overlink is an elegant, modern Chrome Extension that allows you to open links in an in-page modal dialog directly over your current tab, eliminating the need to constantly open and switch between new tabs.

## Features Let's you 

*   **Context Menu Integration**: Simply right-click any link and select "Open as overlay".
*   **Premium Glassmorphic UI**: Features a beautiful, responsive modal with smooth animations and dark mode support.
*   **Frame Restriction Bypass**: Uses Chrome's `declarativeNetRequest` API to bypass restrictive headers (`X-Frame-Options` and `Content-Security-Policy`), allowing almost any site (like GitHub, Luma) to load within the frame.
*   **Safe Fallback**: Includes a sleek "Open in new tab" button if a site completely refuses to be embedded.

## Installation (Developer Mode)

Since this extension uses powerful network request modification to bypass frame protections, it is best installed manually via Developer Mode.

1.  Download or clone this repository to your local machine.
2.  Open Chrome and navigate to `chrome://extensions/`.
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
