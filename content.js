chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOverlay") {
        openOverlink(request.linkUrl);
    }
});

function openOverlink(url) {
    // Check if a modal is already open
    if (document.getElementById('overlink-overlay')) {
        document.getElementById('overlink-overlay').remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'overlink-overlay';

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'overlink-container';

    // Create header
    const header = document.createElement('div');
    header.id = 'overlink-header';

    const title = document.createElement('div');
    title.id = 'overlink-title';
    try {
        const urlObj = new URL(url);
        title.innerText = urlObj.hostname;
        title.title = url;
    } catch (e) {
        title.innerText = url;
    }

    const actions = document.createElement('div');
    actions.id = 'overlink-actions';

    const newTabBtn = document.createElement('a');
    newTabBtn.id = 'overlink-new-tab-btn';
    newTabBtn.href = url;
    newTabBtn.target = '_blank';
    newTabBtn.rel = 'noopener noreferrer';
    newTabBtn.innerText = 'Open in new tab';
    newTabBtn.title = 'Open safely in a new tab if this site refuses to load inside the frame.';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'overlink-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close Dialog';

    // Assembly
    actions.appendChild(newTabBtn);
    actions.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // Spinner container
    const spinnerContainer = document.createElement('div');
    spinnerContainer.id = 'overlink-spinner';
    spinnerContainer.innerHTML = '<div class="overlink-loader"></div>';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'overlink-iframe';
    iframe.src = url;
    // allow some basics
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');

    // Handle load event to hide spinner
    iframe.onload = () => {
        spinnerContainer.style.display = 'none';
    };

    modalContainer.appendChild(header);
    modalContainer.appendChild(spinnerContainer);
    modalContainer.appendChild(iframe);
    overlay.appendChild(modalContainer);

    document.body.appendChild(overlay);

    // Event Listeners
    closeBtn.addEventListener('click', () => {
        overlay.classList.add('overlink-closing');
        setTimeout(() => overlay.remove(), 300); // Wait for transition
    });

    newTabBtn.addEventListener('click', () => {
        // Optionally close the modal automatically when opening in a new tab
        overlay.classList.add('overlink-closing');
        setTimeout(() => overlay.remove(), 300);
    });

    // Close when clicking outside the modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('overlink-closing');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}
