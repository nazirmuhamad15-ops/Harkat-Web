// Harkat Scraper - Background Service Worker

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      apiUrl: 'http://localhost:3000'
    });
    
    console.log('Harkat Scraper installed');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openDashboard') {
    chrome.storage.local.get(['apiUrl'], (stored) => {
      const url = stored.apiUrl || 'http://localhost:3000';
      chrome.tabs.create({ url: `${url}/admin/scraper` });
    });
  }
  
  // Handle API calls from content scripts (bypass CORS)
  if (request.action === 'sendToApi') {
    chrome.storage.local.get(['apiUrl'], async (stored) => {
      const apiUrl = stored.apiUrl || 'http://localhost:3000';
      
      try {
        const response = await fetch(`${apiUrl}/api/scraper/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          sendResponse({ success: true, data: result });
        } else {
          sendResponse({ success: false, error: result.error || 'Failed' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // Keep channel open for async
  }
});

console.log('Harkat Scraper: Background service worker started');
