let sessions = {}; // Map of browserTabId -> { tabs: [], activeTabId: string }
let currentBrowserTabId = null;
let draggedTabId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Determine the initially active browser tab in this window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        currentBrowserTabId = tab.id;
        ensureSession(currentBrowserTabId);
    }

    // 1. Check for pending URLs in storage
    refreshFromStorage();

    // 2. Listen for real-time messages from background.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "openSidePanelTab") {
            const targetTabId = request.tabId;
            openTab(request.linkUrl, targetTabId);
            sendResponse({ status: "opened" });
        }
    });

    // 3. Listen for tab switches in the browser
    chrome.tabs.onActivated.addListener((activeInfo) => {
        // We only care if the tab belongs to our current window (implicit check usually works, but let's be safe)
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (chrome.runtime.lastError) return;
            // Only switch if it's the same window as the side panel
            // Note: Side panel usually stays within its window
            switchBrowserTabSession(tab.id);
        });
    });

    // 4. Setup header actions
    document.getElementById('nav-back-btn').addEventListener('click', () => {
        const activeIframe = getActiveIframe();
        if (activeIframe) {
            activeIframe.contentWindow.postMessage('overlink-back', '*');
        }
    });

    document.getElementById('nav-forward-btn').addEventListener('click', () => {
        const activeIframe = getActiveIframe();
        if (activeIframe) {
            activeIframe.contentWindow.postMessage('overlink-forward', '*');
        }
    });

    // Search Actions
    const searchBarContainer = document.getElementById('search-bar-container');
    const searchInput = document.getElementById('search-input');

    document.getElementById('search-toggle-btn').addEventListener('click', () => {
        searchBarContainer.style.display = searchBarContainer.style.display === 'none' ? 'flex' : 'none';
        if (searchBarContainer.style.display === 'flex') {
            searchInput.focus();
        }
    });

    document.getElementById('search-close-btn').addEventListener('click', () => {
        searchBarContainer.style.display = 'none';
    });

    const triggerSearch = (backwards = false) => {
        const query = searchInput.value;
        if (!query) return;
        
        const activeIframe = getActiveIframe();
        if (activeIframe) {
            activeIframe.contentWindow.postMessage({ action: 'overlink-search', query, backwards }, '*');
        }
    };

    document.getElementById('search-next-btn').addEventListener('click', () => triggerSearch(false));
    document.getElementById('search-prev-btn').addEventListener('click', () => triggerSearch(true));

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            triggerSearch(e.shiftKey); // Shift+Enter to search backwards
        }
    });

    // 4. Cleanup when browser tab is closed
    chrome.tabs.onRemoved.addListener((tabId) => {
        if (sessions[tabId]) {
            // Clean up all iframes in that session
            sessions[tabId].tabs.forEach(tab => {
                const container = document.getElementById(`container-${tab.id}`);
                if (container) container.remove();
            });
            delete sessions[tabId];
        }
    });

    document.getElementById('close-all-btn').addEventListener('click', () => {
        if (currentBrowserTabId && sessions[currentBrowserTabId]) {
            const session = sessions[currentBrowserTabId];
            [...session.tabs].forEach(tab => removeTab(tab.id, currentBrowserTabId));
        }
    });
});

function ensureSession(browserTabId) {
    if (!sessions[browserTabId]) {
        sessions[browserTabId] = {
            tabs: [],
            activeTabId: null
        };
    }
}

function switchBrowserTabSession(browserTabId) {
    if (currentBrowserTabId === browserTabId) return;

    // Hide old session containers
    if (currentBrowserTabId && sessions[currentBrowserTabId]) {
        sessions[currentBrowserTabId].tabs.forEach(tab => {
            const container = document.getElementById(`container-${tab.id}`);
            if (container) container.style.display = 'none';
        });
    }

    currentBrowserTabId = browserTabId;
    ensureSession(currentBrowserTabId);

    // Show new session containers (if active)
    const session = sessions[currentBrowserTabId];
    if (session.activeTabId) {
        const container = document.getElementById(`container-${session.activeTabId}`);
        if (container) container.style.display = 'flex';
    }

    renderTabBar();
    
    // Check if empty state needed
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.style.display = session.tabs.length === 0 ? 'flex' : 'none';
    }
    
    // Also refresh from storage in case something was added while we were inactive
    refreshFromStorage();
}

function refreshFromStorage() {
    chrome.storage.session.get(['pendingSidePanelUrls'], (result) => {
        let urls = result.pendingSidePanelUrls || [];
        if (urls.length > 0) {
            const remaining = [];
            urls.forEach(item => {
                // If it's for the currently active tab, open it
                if (item.tabId === currentBrowserTabId) {
                    openTab(item.url, item.tabId);
                } else {
                    remaining.push(item);
                }
            });
            // Update storage with remaining
            chrome.storage.session.set({ pendingSidePanelUrls: remaining });
        }
    });
}

function openTab(url, browserTabId = currentBrowserTabId) {
    ensureSession(browserTabId);
    const session = sessions[browserTabId];

    const tabId = 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const tabObj = {
        id: tabId,
        url: url,
        title: "Loading..."
    };

    try {
        const urlObj = new URL(url);
        let pathTitle = urlObj.pathname + urlObj.search;
        if (pathTitle === '/' || !pathTitle) {
            pathTitle = urlObj.hostname;
        }
        tabObj.title = pathTitle;
    } catch (e) {
        tabObj.title = url;
    }

    session.tabs.push(tabObj);

    // If this is for the current browser tab, render and switch
    if (browserTabId === currentBrowserTabId) {
        renderTabBar();
        createIframe(tabObj);
        switchTab(tabId);
    } else {
        // Just create the iframe in background so it's ready when we switch
        createIframe(tabObj);
    }
}

function createIframe(tabObj) {
    const contentArea = document.getElementById('content-area');
    const emptyState = document.getElementById('empty-state');
    if (emptyState && tabObj.id.includes(currentBrowserTabId)) { // Only hide if for current
         emptyState.style.display = 'none';
    } else if (emptyState && currentBrowserTabId && sessions[currentBrowserTabId]?.tabs.length > 0) {
         emptyState.style.display = 'none';
    }

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

    iframe.onload = () => {
        spinner.style.display = 'none';
        try {
            if (iframe.contentDocument && iframe.contentDocument.title) {
                updateTabTitle(tabObj.id, iframe.contentDocument.title);
            }
        } catch (e) { }
    };

    iframeContainer.appendChild(spinner);
    iframeContainer.appendChild(iframe);
    contentArea.appendChild(iframeContainer);
}

function renderTabBar() {
    const tabBar = document.getElementById('tab-bar');
    tabBar.innerHTML = ''; // Clear

    if (!currentBrowserTabId || !sessions[currentBrowserTabId]) return;

    const session = sessions[currentBrowserTabId];

    session.tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === session.activeTabId ? 'active' : ''}`;
        tabEl.id = `ui-${tab.id}`;
        tabEl.title = tab.url;
        tabEl.draggable = true;

        tabEl.addEventListener('dragstart', (e) => {
            draggedTabId = tab.id;
            tabEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        tabEl.addEventListener('dragend', () => {
            draggedTabId = null;
            tabEl.classList.remove('dragging');
            syncTabsArrayFromDOM();
        });

        tabEl.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            if (!draggedTabId || draggedTabId === tab.id) return;

            const draggedEl = document.getElementById(`ui-${draggedTabId}`);
            if (!draggedEl) return;

            const rect = tabEl.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            
            if (e.clientX < midpoint) {
                 tabEl.parentNode.insertBefore(draggedEl, tabEl);
            } else {
                 tabEl.parentNode.insertBefore(draggedEl, tabEl.nextSibling);
            }
        });

        tabEl.addEventListener('drop', (e) => {
            e.preventDefault();
        });

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

function switchTab(tabId, browserTabId = currentBrowserTabId) {
    const session = sessions[browserTabId];
    if (!session) return;

    if (session.activeTabId && browserTabId === currentBrowserTabId) {
        // Hide current
        const oldContainer = document.getElementById(`container-${session.activeTabId}`);
        if (oldContainer) oldContainer.style.display = 'none';
        const oldTabUi = document.getElementById(`ui-${session.activeTabId}`);
        if (oldTabUi) oldTabUi.classList.remove('active');
    }

    session.activeTabId = tabId;

    if (session.activeTabId && browserTabId === currentBrowserTabId) {
        // Show new
        const newContainer = document.getElementById(`container-${tabId}`);
        if (newContainer) newContainer.style.display = 'flex';
        const newTabUi = document.getElementById(`ui-${tabId}`);
        if (newTabUi) newTabUi.classList.add('active');

        newTabUi?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function removeTab(tabId, browserTabId = currentBrowserTabId) {
    const session = sessions[browserTabId];
    if (!session) return;

    // Remove UI
    const container = document.getElementById(`container-${tabId}`);
    if (container) container.remove();

    // Remove logic
    const index = session.tabs.findIndex(t => t.id === tabId);
    if (index > -1) {
        session.tabs.splice(index, 1);
    }

    // Switch tab if active was closed
    if (session.activeTabId === tabId) {
        if (session.tabs.length > 0) {
            const newIndex = Math.max(0, index - 1);
            switchTab(session.tabs[newIndex].id, browserTabId);
        } else {
            session.activeTabId = null;
            if (browserTabId === currentBrowserTabId) {
                const emptyState = document.getElementById('empty-state');
                if (emptyState) emptyState.style.display = 'flex';
            }
        }
    }

    if (browserTabId === currentBrowserTabId) {
        renderTabBar();
    }
}

function updateTabTitle(tabId, newTitle) {
    // Search all sessions for the tab
    for (const bId in sessions) {
        const tab = sessions[bId].tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = newTitle;
            if (bId == currentBrowserTabId) {
                const uiTitle = document.querySelector(`#ui-${tabId} .tab-title`);
                if (uiTitle) uiTitle.innerText = newTitle;
            }
            break;
        }
    }
}

function getActiveIframe() {
    if (!currentBrowserTabId || !sessions[currentBrowserTabId]) return null;
    const session = sessions[currentBrowserTabId];
    if (!session.activeTabId) return null;
    const container = document.getElementById(`container-${session.activeTabId}`);
    return container ? container.querySelector('iframe') : null;
}

function syncTabsArrayFromDOM() {
    if (!currentBrowserTabId || !sessions[currentBrowserTabId]) return;
    const session = sessions[currentBrowserTabId];
    
    const tabBar = document.getElementById('tab-bar');
    const newTabsArray = [];
    
    for (let child of tabBar.children) {
        if (child.id && child.id.startsWith('ui-')) {
            const tabId = child.id.substring(3);
            const tabObj = session.tabs.find(t => t.id === tabId);
            if (tabObj) {
                newTabsArray.push(tabObj);
            }
        }
    }
    
    if (newTabsArray.length === session.tabs.length) {
        session.tabs = newTabsArray;
    }
}
