// State for the modal overlay
let overlayTabs = [];
let overlayActiveTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOverlay") {
        openOverlink(request.linkUrl);
    }
});

function openOverlink(url) {
    let overlay = document.getElementById('overlink-overlay');
    
    if (!overlay) {
        // Initialize Overlay UI
        overlay = createOverlayUI();
        document.body.appendChild(overlay);
        // Clear old state just in case
        overlayTabs = [];
        overlayActiveTabId = null;
    } else {
        // Overlay exists, maybe it was closing
        overlay.classList.remove('overlink-closing');
    }

    addOverlayTab(url);
}

function createOverlayUI() {
    const overlay = document.createElement('div');
    overlay.id = 'overlink-overlay';

    const modalContainer = document.createElement('div');
    modalContainer.id = 'overlink-container';

    // Header container (Holds tab bar + actions)
    const header = document.createElement('div');
    header.id = 'overlink-header';

    const tabBar = document.createElement('div');
    tabBar.id = 'overlink-tab-bar';

    const actions = document.createElement('div');
    actions.id = 'overlink-actions';

    const navBackBtn = document.createElement('button');
    navBackBtn.id = 'overlink-nav-back-btn';
    navBackBtn.className = 'overlink-nav-btn';
    navBackBtn.title = 'Go Back';
    navBackBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';

    const navForwardBtn = document.createElement('button');
    navForwardBtn.id = 'overlink-nav-forward-btn';
    navForwardBtn.className = 'overlink-nav-btn';
    navForwardBtn.title = 'Go Forward';
    navForwardBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';

    const newTabBtn = document.createElement('a');
    newTabBtn.id = 'overlink-new-tab-btn';
    newTabBtn.target = '_blank';
    newTabBtn.rel = 'noopener noreferrer';
    newTabBtn.innerText = 'Open in new tab';
    newTabBtn.title = 'Open safely in a new tab if this site refuses to load inside the frame.';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'overlink-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close Dialog';

    actions.appendChild(navBackBtn);
    actions.appendChild(navForwardBtn);
    actions.appendChild(newTabBtn);
    actions.appendChild(closeBtn);
    
    header.appendChild(tabBar);
    header.appendChild(actions);

    const contentArea = document.createElement('div');
    contentArea.id = 'overlink-content-area';

    modalContainer.appendChild(header);
    modalContainer.appendChild(contentArea);
    overlay.appendChild(modalContainer);

    // Event Listeners
    navBackBtn.addEventListener('click', () => {
        const activeIframe = getActiveOverlayIframe();
        if (activeIframe) {
            activeIframe.contentWindow.postMessage('overlink-back', '*');
        }
    });

    navForwardBtn.addEventListener('click', () => {
        const activeIframe = getActiveOverlayIframe();
        if (activeIframe) {
            activeIframe.contentWindow.postMessage('overlink-forward', '*');
        }
    });

    closeBtn.addEventListener('click', closeOverlay);
    
    // Close when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });

    return overlay;
}

function closeOverlay() {
    const overlay = document.getElementById('overlink-overlay');
    if (overlay) {
        overlay.classList.add('overlink-closing');
        setTimeout(() => {
            overlay.remove();
            overlayTabs = [];
            overlayActiveTabId = null;
        }, 300);
    }
}

function addOverlayTab(url) {
    const tabId = 'otab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
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

    overlayTabs.push(tabObj);
    
    renderOverlayTabBar();
    createOverlayIframe(tabObj);
    switchOverlayTab(tabId);
}

function renderOverlayTabBar() {
    const tabBar = document.getElementById('overlink-tab-bar');
    if (!tabBar) return;
    
    tabBar.innerHTML = '';

    overlayTabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `overlink-tab ${tab.id === overlayActiveTabId ? 'active' : ''}`;
        tabEl.id = `oui-${tab.id}`;
        tabEl.title = tab.url;

        const titleEl = document.createElement('span');
        titleEl.className = 'overlink-tab-title';
        titleEl.innerText = tab.title;
        titleEl.addEventListener('click', () => switchOverlayTab(tab.id));

        const closeBtn = document.createElement('button');
        closeBtn.className = 'overlink-tab-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeOverlayTab(tab.id);
        });

        tabEl.appendChild(titleEl);
        tabEl.appendChild(closeBtn);
        tabBar.appendChild(tabEl);
    });
}

function createOverlayIframe(tabObj) {
    const contentArea = document.getElementById('overlink-content-area');
    if (!contentArea) return;

    // Container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'overlink-iframe-container';
    iframeContainer.id = `ocontainer-${tabObj.id}`;
    iframeContainer.style.display = 'none'; // Hidden by default

    // Spinner
    const spinner = document.createElement('div');
    spinner.className = 'overlink-spinner';
    spinner.innerHTML = '<div class="overlink-loader"></div>';

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.src = tabObj.url;
    // Removed strict sandbox to avoid potential interactions with CSP/framing
    // iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    
    iframe.onload = () => {
        spinner.style.display = 'none';
        // Attempt to update title
        try {
            if (iframe.contentDocument && iframe.contentDocument.title) {
                tabObj.title = iframe.contentDocument.title;
                const uiTitle = document.querySelector(`#oui-${tabObj.id} .overlink-tab-title`);
                if (uiTitle) uiTitle.innerText = tabObj.title;
            }
        } catch(e) {}
    };

    iframeContainer.appendChild(spinner);
    iframeContainer.appendChild(iframe);
    contentArea.appendChild(iframeContainer);
}

function switchOverlayTab(tabId) {
    if (overlayActiveTabId) {
        // Hide current
        const oldContainer = document.getElementById(`ocontainer-${overlayActiveTabId}`);
        if (oldContainer) oldContainer.style.display = 'none';
        const oldTabUi = document.getElementById(`oui-${overlayActiveTabId}`);
        if (oldTabUi) oldTabUi.classList.remove('active');
    }

    overlayActiveTabId = tabId;

    if (overlayActiveTabId) {
        // Show new
        const newContainer = document.getElementById(`ocontainer-${overlayActiveTabId}`);
        if (newContainer) newContainer.style.display = 'block';
        const newTabUi = document.getElementById(`oui-${overlayActiveTabId}`);
        if (newTabUi) newTabUi.classList.add('active');
        
        // Update the "Open in new tab" link
        const newTabBtn = document.getElementById('overlink-new-tab-btn');
        const activeTab = overlayTabs.find(t => t.id === activeTabId);
        if (newTabBtn && activeTab) {
            newTabBtn.href = activeTab.url;
        }
    }
}

function removeOverlayTab(tabId) {
    // Remove UI
    const container = document.getElementById(`ocontainer-${tabId}`);
    if (container) container.remove();

    // Remove logic
    const index = overlayTabs.findIndex(t => t.id === tabId);
    if (index > -1) {
        overlayTabs.splice(index, 1);
    }

    // Switch tab or close modal
    if (overlayTabs.length === 0) {
        closeOverlay();
    } else if (overlayActiveTabId === tabId) {
        const newIndex = Math.max(0, index - 1);
        switchOverlayTab(overlayTabs[newIndex].id);
    }

    renderOverlayTabBar();
}

function getActiveOverlayIframe() {
    if (!overlayActiveTabId) return null;
    const container = document.getElementById(`ocontainer-${overlayActiveTabId}`);
    return container ? container.querySelector('iframe') : null;
}
