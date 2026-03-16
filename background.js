chrome.runtime.onInstalled.addListener(() => {
    const contexts = ["link", "image", "video"];
    chrome.contextMenus.create({
        id: "open-in-overlink-overlay",
        title: "Open in Overlay", // Shortened title since it works for links, images, and videos
        contexts: contexts
    });
    chrome.contextMenus.create({
        id: "open-in-overlink-sidepanel",
        title: "Open in Side Panel",
        contexts: contexts
    });
    chrome.contextMenus.create({
        id: "search-in-overlink-overlay",
        title: "Search in Overlay",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "search-in-overlink-sidepanel",
        title: "Search in Side Panel",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Prefer linkUrl, fallback to srcUrl (for images/videos)
    let url = info.linkUrl || info.srcUrl;

    // Handle Search
    if (info.menuItemId.startsWith("search-in-overlink")) {
        // Use Google search for the selected text
        url = `https://www.google.com/search?q=${encodeURIComponent(info.selectionText)}`;
    }

    if (!url) return;

    // If 'tab' is undefined or has an ID of -1, it means the context menu was 
    // triggered from within a non-tab context like the side panel itself. 
    // We need to find the currently active browser tab.
    if (!tab || tab.id === -1) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                routeClick(info, tabs[0], url, true); // true = skip side panel open (already open)
            }
        });
    } else {
        routeClick(info, tab, url, false);
    }
});

function routeClick(info, tab, url, skipSidePanelOpen) {
    if (info.menuItemId.endsWith("-overlay")) {
        // Open in Overlay
        chrome.tabs.sendMessage(tab.id, {
            action: "openOverlay",
            linkUrl: url
        }).catch(err => {
            console.warn("Could not send message to tab. Injecting dynamically.", err);

            chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ["styles.css"]
            });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            }, () => {
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "openOverlay",
                        linkUrl: url
                    });
                }, 100);
            });
        });
    } else if (info.menuItemId.endsWith("-sidepanel")) {
        // Open in Side Panel
        openInSidePanel(tab, url, skipSidePanelOpen);
    }
}


function openInSidePanel(tab, url, skipOpen = false) {
    // 1. Ensure side panel is open for this specific tab
    // CRITICAL: This MUST be called synchronously to satisfy the user gesture requirement.
    // If triggered from inside the side panel, we skip this since it's already open,
    // and we are likely in an async callback from chrome.tabs.query.
    if (!skipOpen) {
        chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
            console.warn("Could not open side panel for specific tabId, trying windowId", err);
            if (tab.windowId !== -1) {
                chrome.sidePanel.open({ windowId: tab.windowId }).catch(console.error);
            }
        });
    }

    // 2. We need to tell the side panel to load the URL.
    // Try to send a message immediately. If it succeeds, the side panel is already open and handled it.
    chrome.runtime.sendMessage({
        action: "openSidePanelTab",
        linkUrl: url,
        tabId: tab.id
    }).catch(() => {
        // If it fails, the sidePanel wasn't open yet.
        // We store the pending URL in chrome.storage.session and have sidepanel.js read it on load.
        chrome.storage.session.get(['pendingSidePanelUrls'], (result) => {
            let urls = result.pendingSidePanelUrls || [];
            urls.push({ url: url, tabId: tab.id });
            chrome.storage.session.set({ pendingSidePanelUrls: urls });
        });
    });
}

