let tabs = [];
let activeTabId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for pending URLs in storage
    chrome.storage.session.get(['pendingSidePanelUrls'], (result) => {
        const urls = result.pendingSidePanelUrls || [];
        if (urls.length > 0) {
            urls.forEach(url => openTab(url));
            // Clear the queue
            chrome.storage.session.set({ pendingSidePanelUrls: [] });
        }
    });

    // 2. Listen for real-time messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "openSidePanelTab") {
            openTab(request.linkUrl);
            sendResponse({ status: "opened" });
        }
    });

    // 3. Setup header actions
    document.getElementById('close-all-btn').addEventListener('click', () => {
        // Unfortunately there's no programmatic chrome.sidePanel.close() yet.
        // The user has to click the X in the side panel header natively.
        // But we can clear our state.
        tabs.forEach(tab => removeTab(tab.id));
    });
});

function openTab(url) {
    const tabId = 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const tabObj = {
        id: tabId,
        url: url,
        title: "Loading..."
    };

    try {
        const urlObj = new URL(url);
        tabObj.title = urlObj.hostname;
    } catch (e) {
        tabObj.title = url;
    }

    tabs.push(tabObj);
    
    renderTabBar();
    createIframe(tabObj);
    switchTab(tabId);
}

function createIframe(tabObj) {
    const contentArea = document.getElementById('content-area');
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = 'none';

    // Container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'iframe-container';
    iframeContainer.id = `container-${tabObj.id}`;
    iframeContainer.style.display = 'none'; // Hidden by default

    // Spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = '<div class="loader"></div>';

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.src = tabObj.url;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    
    iframe.onload = () => {
        spinner.style.display = 'none';
        // Try to update title if possible (often blocked by CORS)
        try {
            if (iframe.contentDocument && iframe.contentDocument.title) {
                updateTabTitle(tabObj.id, iframe.contentDocument.title);
            }
        } catch(e) {}
    };

    iframeContainer.appendChild(spinner);
    iframeContainer.appendChild(iframe);
    contentArea.appendChild(iframeContainer);
}

function renderTabBar() {
    const tabBar = document.getElementById('tab-bar');
    tabBar.innerHTML = ''; // Clear

    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.id = `ui-${tab.id}`;
        tabEl.title = tab.url;

        const titleEl = document.createElement('span');
        titleEl.className = 'tab-title';
        titleEl.innerText = tab.title;
        titleEl.addEventListener('click', () => switchTab(tab.id));

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeTab(tab.id);
        });

        tabEl.appendChild(titleEl);
        tabEl.appendChild(closeBtn);
        tabBar.appendChild(tabEl);
    });
}

function switchTab(tabId) {
    if (activeTabId) {
        // Hide current
        const oldContainer = document.getElementById(`container-${activeTabId}`);
        if (oldContainer) oldContainer.style.display = 'none';
        const oldTabUi = document.getElementById(`ui-${activeTabId}`);
        if (oldTabUi) oldTabUi.classList.remove('active');
    }

    activeTabId = tabId;

    if (activeTabId) {
        // Show new
        const newContainer = document.getElementById(`container-${activeTabId}`);
        if (newContainer) newContainer.style.display = 'flex';
        const newTabUi = document.getElementById(`ui-${activeTabId}`);
        if (newTabUi) newTabUi.classList.add('active');
        
        // Scroll tab bar to make active visible
        newTabUi?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function removeTab(tabId) {
    // Remove UI
    const container = document.getElementById(`container-${tabId}`);
    if (container) container.remove();

    // Remove logic
    const index = tabs.findIndex(t => t.id === tabId);
    if (index > -1) {
        tabs.splice(index, 1);
    }

    // Switch tab if active was closed
    if (activeTabId === tabId) {
        if (tabs.length > 0) {
            // Switch to the one on the left if possible, or the new first one
            const newIndex = Math.max(0, index - 1);
            switchTab(tabs[newIndex].id);
        } else {
            activeTabId = null;
            const emptyState = document.getElementById('empty-state');
            if (emptyState) emptyState.style.display = 'flex';
        }
    }

    renderTabBar();
}

function updateTabTitle(tabId, newTitle) {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
        tab.title = newTitle;
        const uiTitle = document.querySelector(`#ui-${tabId} .tab-title`);
        if (uiTitle) uiTitle.innerText = newTitle;
    }
}
