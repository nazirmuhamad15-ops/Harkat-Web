// Harkat Scraper - Popup Script

let currentTabUrl = '';
let currentSite = null;
let scrapedData = null;

// Site detection
const SITES = {
  shopee: {
    name: 'Shopee',
    icon: '🛒',
    pattern: /shopee\.co\.id/,
    color: 'site-shopee'
  },
  tokopedia: {
    name: 'Tokopedia',
    icon: '🟢',
    pattern: /tokopedia\.com/,
    color: 'site-tokopedia'
  },
  tiktok: {
    name: 'TikTok Shop',
    icon: '🎵',
    pattern: /(seller-id\.tiktok\.com|shop\.tiktok\.com)/,
    color: 'site-tiktok'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const stored = await chrome.storage.local.get(['apiUrl']);
  if (stored.apiUrl) {
    document.getElementById('api-url').value = stored.apiUrl;
  }

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabUrl = tab.url;
  
  detectSite(tab.url);
  
  // Event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('scrape-current').addEventListener('click', scrapeCurrent);
  document.getElementById('scrape-all').addEventListener('click', scrapeAll);
  document.getElementById('send-to-harkat').addEventListener('click', sendToHarkat);
  document.getElementById('open-harkat').addEventListener('click', openHarkat);
});

function detectSite(url) {
  const siteIcon = document.getElementById('site-icon');
  const siteName = document.getElementById('site-name');
  const statusBadge = document.querySelector('.status-badge');
  const scrapeBtn = document.getElementById('scrape-current');
  const scrapeAllBtn = document.getElementById('scrape-all');

  for (const [key, site] of Object.entries(SITES)) {
    if (site.pattern.test(url)) {
      currentSite = key;
      siteIcon.textContent = site.icon;
      siteName.textContent = site.name;
      statusBadge.className = `status-badge ${site.color}`;
      scrapeBtn.disabled = false;
      scrapeAllBtn.disabled = false;
      addLog(`Terdeteksi: ${site.name}`, 'success');
      return;
    }
  }

  // Not a supported site
  siteIcon.textContent = '🌐';
  siteName.textContent = 'Tidak didukung';
  scrapeBtn.disabled = true;
  scrapeAllBtn.disabled = true;
  addLog('Buka halaman produk di Shopee, Tokopedia, atau TikTok Shop', 'info');
}

async function saveSettings() {
  const apiUrl = document.getElementById('api-url').value.trim();
  await chrome.storage.local.set({ apiUrl });
  addLog('Settings disimpan', 'success');
}

async function scrapeCurrent() {
  if (!currentSite) return;
  
  addLog('Mulai scraping...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scrape',
      type: 'single'
    });
    
    if (response && response.success) {
      scrapedData = response.data;
      displayResult(scrapedData);
      addLog(`Berhasil scrape: ${scrapedData.name}`, 'success');
    } else {
      addLog('Gagal scrape: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    addLog('Error: ' + error.message, 'error');
    console.error(error);
  }
}

async function scrapeAll() {
  if (!currentSite) return;
  
  addLog('Scraping semua produk...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scrape',
      type: 'all'
    });
    
    if (response && response.success) {
      scrapedData = response.data;
      displayResult(scrapedData);
      const count = Array.isArray(scrapedData) ? scrapedData.length : 1;
      addLog(`Berhasil scrape ${count} produk`, 'success');
    } else {
      addLog('Gagal scrape: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    addLog('Error: ' + error.message, 'error');
  }
}

function displayResult(data) {
  const resultSection = document.getElementById('result-section');
  const resultContent = document.getElementById('result-content');
  
  resultSection.classList.remove('hidden');
  
  if (Array.isArray(data)) {
    resultContent.innerHTML = data.map(p => `
      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
        <div class="product-name">${p.name}</div>
        <div class="product-price">Rp ${p.price?.toLocaleString('id-ID') || '-'}</div>
      </div>
    `).join('');
  } else {
    const imgHtml = data.images?.[0] 
      ? `<img src="${data.images[0]}" class="product-image" style="float: left;">` 
      : '';
    resultContent.innerHTML = `
      ${imgHtml}
      <div class="product-name">${data.name}</div>
      <div class="product-price">Rp ${data.price?.toLocaleString('id-ID') || '-'}</div>
      <div style="clear: both;"></div>
    `;
  }
}

async function sendToHarkat() {
  if (!scrapedData) {
    addLog('Tidak ada data untuk dikirim', 'error');
    return;
  }
  
  const stored = await chrome.storage.local.get(['apiUrl']);
  const apiUrl = stored.apiUrl || 'http://localhost:3000';
  
  addLog('Mengirim ke Harkat...', 'info');
  
  try {
    const isArray = Array.isArray(scrapedData);
    const endpoint = isArray ? '/api/scraper/import' : '/api/scraper/import';
    const method = isArray ? 'PUT' : 'POST';
    const body = isArray ? { products: scrapedData } : scrapedData;
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      const count = isArray ? result.imported : 1;
      addLog(`✅ ${count} produk berhasil dikirim!`, 'success');
      scrapedData = null;
      document.getElementById('result-section').classList.add('hidden');
    } else {
      addLog('Gagal: ' + (result.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    addLog('Network error: ' + error.message, 'error');
  }
}

function openHarkat() {
  chrome.storage.local.get(['apiUrl'], (stored) => {
    const url = stored.apiUrl || 'http://localhost:3000';
    chrome.tabs.create({ url: `${url}/admin/scraper` });
  });
}

function addLog(message, type = 'info') {
  const log = document.getElementById('log');
  const item = document.createElement('div');
  item.className = `log-item log-${type}`;
  item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  log.insertBefore(item, log.firstChild);
  
  // Keep only last 10 logs
  while (log.children.length > 10) {
    log.removeChild(log.lastChild);
  }
}
