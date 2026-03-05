chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-in-overlink",
        title: "Open as overlay",
        contexts: ["link"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-in-overlink") {
        // Send message to content script of the active tab
        chrome.tabs.sendMessage(tab.id, {
            action: "openOverlay",
            linkUrl: info.linkUrl
        }).catch(err => {
            // If the content script isn't there, we can dynamically inject it as a fallback
            // Since we use content_scripts in manifest, it should generally be there,
            // except on chrome:// pages or edge cases.
            console.warn("Could not send message to tab. Injecting dynamically.", err);

            chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ["styles.css"]
            });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            }, () => {
                // give it a tiny delay to initialize
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "openOverlay",
                        linkUrl: info.linkUrl
                    });
                }, 100);
            });
        });
    }
});
