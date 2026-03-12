chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-in-overlink-overlay",
        title: "Open link in Overlay",
        contexts: ["link"]
    });
    chrome.contextMenus.create({
        id: "open-in-overlink-sidepanel",
        title: "Open link in Side Panel",
        contexts: ["link"]
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
    let url = info.linkUrl;
    
    // Handle Search
    if (info.menuItemId.startsWith("search-in-overlink")) {
        // Use Google search for the selected text
        url = `https://www.google.com/search?q=${encodeURIComponent(info.selectionText)}`;
    }

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
        openInSidePanel(tab.windowId, url);
    }
});

function openInSidePanel(windowId, url) {
    // 1. Ensure side panel is open for this window
    chrome.sidePanel.open({ windowId: windowId }).catch(console.error);
    
    // 2. We need to tell the side panel to load the URL.
    // If the side panel is just opening now, it might not be ready to receive a message.
    // We can store the pending URL in chrome.storage.session and have sidepanel.js read it on load.
    // Alternatively, we can try to send a message immediately, and if it fails, fallback to logic.
    // For simplicity, let's use chrome.storage.session, which is fast and syncs within the session.
    
    chrome.storage.session.get(['pendingSidePanelUrls'], (result) => {
        let urls = result.pendingSidePanelUrls || [];
        urls.push(url);
        chrome.storage.session.set({ pendingSidePanelUrls: urls });
        
        // Also try to send a message in case it's already open and listening
        chrome.runtime.sendMessage({
            action: "openSidePanelTab",
            linkUrl: url
        }).catch(() => {
            // Ignore error - if it fails, the sidePanel wasn't open yet,
            // and it will read from storage when it initializes.
        });
    });
}
