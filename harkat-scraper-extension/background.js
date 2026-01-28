// Harkat Scraper - Background Service Worker

// Handle installation
// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  // Always set/update to production URL on install/update
  chrome.storage.local.set({
    apiUrl: 'https://harkatfurniture.web.id'
  });
  
  console.log('Harkat Scraper installed/updated');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openDashboard') {
    chrome.storage.local.get(['apiUrl'], (stored) => {
      const url = stored.apiUrl || 'https://harkatfurniture.web.id';
      chrome.tabs.create({ url: `${url}/admin/scraper` });
    });
  }
  
  // Handle API calls from content scripts (bypass CORS)
  if (request.action === 'sendToApi') {
    chrome.storage.local.get(['apiUrl'], async (stored) => {
      const apiUrl = stored.apiUrl || 'https://harkatfurniture.web.id';
      
      try {
        // Handle bulk import (array) vs single import (object)
        const isBulk = Array.isArray(request.data?.products) || (request.data && Array.isArray(request.data));
        const endpoint = isBulk ? `${apiUrl}/api/scraper/import` : `${apiUrl}/api/scraper/import`;
        
        // Adjust payload structure for bulk/single based on what endpoint expects
        // Based on previous analysis: POST is single, PUT is bulk (products: [])
        // But the previous content script sends: { products: [...] } or {...}
        
        let method = 'POST';
        let body = request.data;
        
        // If it looks like bulk data (array or has products array), use PUT
        if (Array.isArray(request.data) || request.data.products) {
           method = 'PUT';
           // Ensure format is { products: [...] }
           if (Array.isArray(request.data)) {
               body = { products: request.data };
           }
        }

        const response = await fetch(endpoint, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
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
