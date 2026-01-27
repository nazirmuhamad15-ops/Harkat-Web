// Tokopedia Content Script - Scraper

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    if (request.type === 'single') {
      scrapeCurrentProduct().then(sendResponse);
    } else if (request.type === 'all') {
      scrapeAllProducts().then(sendResponse);
    }
    return true;
  }
});

async function scrapeCurrentProduct() {
  try {
    // Check if we're on a product page
    const isProductPage = window.location.pathname.match(/^\/[^/]+\/[^/]+$/);
    
    if (!isProductPage) {
      return { success: false, error: 'Bukan halaman produk. Buka halaman detail produk.' };
    }

    await new Promise(r => setTimeout(r, 1500));

    const product = {
      source: 'tokopedia',
      sourceUrl: window.location.href,
      sourceProductId: extractProductId(),
      name: getProductName(),
      description: getProductDescription(),
      price: getProductPrice(),
      originalPrice: getOriginalPrice(),
      images: getProductImages(),
      category: getCategory(),
      variants: getVariants(),
      specifications: getSpecifications()
    };

    if (!product.name) {
      return { success: false, error: 'Gagal mendapatkan nama produk' };
    }

    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function scrapeAllProducts() {
  try {
    const productCards = document.querySelectorAll('[data-testid="master-product-card"], .css-1sn1xa2');
    
    if (productCards.length === 0) {
      return { success: false, error: 'Tidak ada produk ditemukan di halaman ini' };
    }

    const products = [];
    
    for (const card of productCards) {
      try {
        const link = card.querySelector('a');
        const nameEl = card.querySelector('[data-testid="linkProductName"], .css-3um8ox');
        const priceEl = card.querySelector('[data-testid="linkProductPrice"], .css-h66vau');
        const imgEl = card.querySelector('img');

        if (nameEl) {
          products.push({
            source: 'tokopedia',
            sourceUrl: link ? link.href : '',
            name: nameEl.textContent?.trim() || '',
            price: parsePriceText(priceEl?.textContent),
            images: imgEl ? [imgEl.src] : [],
          });
        }
      } catch (e) {
        console.error('Error scraping card:', e);
      }
    }

    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function extractProductId() {
  const match = window.location.pathname.match(/\/([^/]+)$/);
  return match ? match[1] : null;
}

function getProductName() {
  const selectors = [
    'h1[data-testid="lblPDPDetailProductName"]',
    'h1.css-1os9jjn',
    '[data-testid="PDPProductName"]',
    'h1'
  ];
  
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent?.trim()) {
      return el.textContent.trim();
    }
  }
  return null;
}

function getProductDescription() {
  const descEl = document.querySelector('[data-testid="lblPDPDescriptionProduk"], .css-11uqux7');
  return descEl ? descEl.textContent?.trim() : null;
}

function getProductPrice() {
  const priceEl = document.querySelector('[data-testid="lblPDPDetailProductPrice"], .css-o5uqvq');
  if (priceEl) {
    return parsePriceText(priceEl.textContent);
  }
  return null;
}

function getOriginalPrice() {
  const origEl = document.querySelector('.css-1bccbr2');
  if (origEl) {
    return parsePriceText(origEl.textContent);
  }
  return null;
}

function getProductImages() {
  const images = [];
  
  // Main image
  const mainImgs = document.querySelectorAll('[data-testid="PDPImageMain"] img, .css-1c345mg img');
  mainImgs.forEach(img => {
    if (img.src && !images.includes(img.src)) {
      images.push(img.src.replace('/300-square/', '/700/'));
    }
  });
  
  // Thumbnails
  const thumbs = document.querySelectorAll('[data-testid="PDPImageThumbnail"] img');
  thumbs.forEach(img => {
    if (img.src && !images.includes(img.src)) {
      images.push(img.src.replace('/100-square/', '/700/'));
    }
  });
  
  return images.slice(0, 10);
}

function getCategory() {
  const breadcrumbs = document.querySelectorAll('[data-testid="breadcrumbItem"] a');
  if (breadcrumbs.length > 1) {
    return breadcrumbs[breadcrumbs.length - 2]?.textContent?.trim() || null;
  }
  return null;
}

function getVariants() {
  const variants = [];
  const variantSections = document.querySelectorAll('[data-testid="PDPVariantSection"]');
  
  variantSections.forEach(section => {
    const label = section.querySelector('p')?.textContent?.trim();
    const options = [];
    section.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent?.trim();
      if (text) options.push(text);
    });
    if (label && options.length > 0) {
      variants.push({ name: label, options });
    }
  });
  
  return variants;
}

function getSpecifications() {
  const specs = {};
  const specRows = document.querySelectorAll('[data-testid="lblPDPInfoProduk"] li');
  
  specRows.forEach(row => {
    const text = row.textContent;
    const parts = text.split(':');
    if (parts.length >= 2) {
      specs[parts[0].trim()] = parts[1].trim();
    }
  });
  
  return specs;
}

function parsePriceText(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned) : null;
}

// ========== FLOATING WIDGET ==========
function createFloatingWidget() {
  if (document.getElementById('harkat-scraper-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'harkat-scraper-widget';
  widget.innerHTML = `
    <style>
      #harkat-scraper-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #harkat-scraper-widget .widget-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #03ac0e, #00aa5b);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #harkat-scraper-widget .widget-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      }
      #harkat-scraper-widget .widget-btn svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      #harkat-scraper-widget .widget-menu {
        position: absolute;
        bottom: 65px;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        padding: 8px;
        min-width: 200px;
        display: none;
      }
      #harkat-scraper-widget .widget-menu.show { display: block; }
      #harkat-scraper-widget .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-size: 13px;
      }
      #harkat-scraper-widget .menu-item:hover { background: #f5f5f5; }
      #harkat-scraper-widget .menu-item.success { color: #10b981; }
      #harkat-scraper-widget .menu-item.loading { opacity: 0.5; pointer-events: none; }
      #harkat-scraper-widget .toast {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: #333;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
      }
      #harkat-scraper-widget .toast.success { background: #10b981; }
      #harkat-scraper-widget .toast.error { background: #ef4444; }
    </style>
    <div class="widget-menu" id="harkat-menu">
      <button class="menu-item" id="harkat-scrape-btn">📦 Scrape Produk Ini</button>
      <button class="menu-item" id="harkat-send-btn" style="display:none">✅ Kirim ke Harkat</button>
    </div>
    <button class="widget-btn" id="harkat-toggle-btn" title="Harkat Scraper">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/></svg>
    </button>
  `;
  document.body.appendChild(widget);

  let scrapedData = null;
  const menu = document.getElementById('harkat-menu');
  const toggleBtn = document.getElementById('harkat-toggle-btn');
  const scrapeBtn = document.getElementById('harkat-scrape-btn');
  const sendBtn = document.getElementById('harkat-send-btn');

  toggleBtn.onclick = () => menu.classList.toggle('show');
  document.addEventListener('click', (e) => { if (!widget.contains(e.target)) menu.classList.remove('show'); });

  scrapeBtn.onclick = async () => {
    scrapeBtn.classList.add('loading');
    scrapeBtn.textContent = '⏳ Scraping...';
    const result = await scrapeCurrentProduct();
    if (result.success) {
      scrapedData = result.data;
      scrapeBtn.textContent = '✓ ' + scrapedData.name.substring(0, 20) + '...';
      scrapeBtn.classList.remove('loading');
      scrapeBtn.classList.add('success');
      sendBtn.style.display = 'flex';
      showToast('Berhasil!', 'success');
    } else {
      scrapeBtn.textContent = '📦 Scrape Produk Ini';
      scrapeBtn.classList.remove('loading');
      showToast(result.error, 'error');
    }
  };

  sendBtn.onclick = async () => {
    if (!scrapedData) return;
    sendBtn.classList.add('loading');
    sendBtn.textContent = '⏳ Mengirim...';
    try {
      const stored = await chrome.storage.local.get(['apiUrl']);
      const apiUrl = stored.apiUrl || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/scraper/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapedData),
        credentials: 'include'
      });
      if (response.ok) {
        showToast('✅ Terkirim!', 'success');
        setTimeout(() => { scrapedData = null; scrapeBtn.textContent = '📦 Scrape Produk Ini'; scrapeBtn.classList.remove('success'); sendBtn.style.display = 'none'; menu.classList.remove('show'); }, 1500);
      } else { showToast('Gagal kirim', 'error'); }
    } catch (e) { showToast('Network error', 'error'); }
    sendBtn.textContent = '✅ Kirim ke Harkat';
    sendBtn.classList.remove('loading');
  };

  function showToast(msg, type) {
    const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg;
    widget.appendChild(t); setTimeout(() => t.remove(), 3000);
  }
}

// Inject widget on product pages
if (window.location.pathname.match(/^\/[^/]+\/[^/]+$/)) {
  setTimeout(createFloatingWidget, 1500);
}

console.log('Harkat Scraper: Tokopedia content script loaded');
