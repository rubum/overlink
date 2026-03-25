// This script runs in all frames (including cross-origin ones) via manifest.json "all_frames: true"
// It allows the extension's side panel or main content script to trigger navigation
// without violating the Same-Origin Policy.

window.addEventListener('message', (event) => {
    // We expect messages from our own extension's origin or the parent frame
    // Since we're just triggering history.back/forward, it's relatively safe
    if (event.data === 'overlink-back') {
        history.back();
    } else if (event.data === 'overlink-forward') {
        history.forward();
    } else if (event.data && event.data.action === 'overlink-search') {
        // window.find(aString, aCaseSensitive, aBackwards, aWrapAround, aWholeWord, aSearchInFrames, aShowDialog)
        window.find(event.data.query, false, event.data.backwards, true);
    }
});
