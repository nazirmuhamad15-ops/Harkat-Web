// Shopee Content Script - Scraper

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    if (request.type === 'single') {
      scrapeCurrentProduct().then(sendResponse);
    } else if (request.type === 'all') {
      scrapeAllProducts().then(sendResponse);
    }
    return true; // Keep channel open for async response
  }
});

async function scrapeCurrentProduct() {
  try {
    const isProductPage = window.location.pathname.includes('-i.');
    
    if (!isProductPage) {
      return { success: false, error: 'Bukan halaman produk. Buka halaman detail produk.' };
    }

    await new Promise(r => setTimeout(r, 1000));

    const product = {
      source: 'shopee',
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
    await new Promise(r => setTimeout(r, 500));
    
    // Multiple selector strategies for Shopee product cards
    let productCards = document.querySelectorAll('[data-sqe="item"]');
    
    // Fallback selectors if main one doesn't work
    if (productCards.length === 0) {
      productCards = document.querySelectorAll('.shopee-search-item-result__item');
    }
    if (productCards.length === 0) {
      productCards = document.querySelectorAll('[class*="col-xs-"][class*="shopee"]');
    }
    if (productCards.length === 0) {
      // Try finding by product link pattern
      const links = document.querySelectorAll('a[href*="-i."]');
      const cards = new Set();
      links.forEach(link => {
        // Get the product card container (usually 2-3 levels up)
        let parent = link.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          if (parent.querySelector('img') && parent.innerText?.includes('Rp')) {
            cards.add(parent);
            break;
          }
          parent = parent.parentElement;
        }
      });
      productCards = Array.from(cards);
    }
    
    if (productCards.length === 0) {
      return { success: false, error: 'Tidak ada produk ditemukan. Coba scroll dulu atau buka halaman lain.' };
    }

    // Filter out products located ABOVE the "Kategori" sidebar section
    let minTopPosition = 0;
    
    // Find the "Kategori" header element in sidebar
    const allDivs = document.querySelectorAll('div, h2, h3, h4, span');
    for (const el of allDivs) {
      // Check for exact match or close match for typical sidebar header
      if (el.innerText?.trim() === 'Kategori' && el.offsetWidth > 0 && el.offsetHeight > 0) {
         // Check if it looks like a sidebar header (left side)
         const rect = el.getBoundingClientRect();
         if (rect.left < window.innerWidth * 0.4) { // Must be on the left side
             minTopPosition = rect.top + (window.pageYOffset || document.documentElement.scrollTop) - 100; // Small buffer
             console.log('Harkat Scraper: Found Category boundary at:', minTopPosition);
             break; 
         }
      }
    }

    const products = [];
    
    for (const card of productCards) {
      try {
        // Check vertical position
        const cardRect = card.getBoundingClientRect();
        const cardAbsTop = cardRect.top + (window.pageYOffset || document.documentElement.scrollTop);
        
        // Skip if product is above the Category section (e.g. Top Picks, Ads)
        if (minTopPosition > 0 && cardAbsTop < minTopPosition) {
            console.log('Harkat Scraper: Skipped item above category:', cardAbsTop);
            continue;
        }

        const link = card.querySelector('a[href*="-i."]') || card.querySelector('a');
        const imgEl = card.querySelector('img');
        
        // Get name - try multiple approaches
        let name = '';
        const nameSelectors = ['[class*="name"]', '[class*="title"]', 'div > div > div'];
        for (const sel of nameSelectors) {
          const el = card.querySelector(sel);
          if (el && el.innerText?.trim() && el.innerText.length > 5 && el.innerText.length < 200) {
            name = el.innerText.trim().split('\n')[0]; // Take first line only
            break;
          }
        }
        if (!name && card.innerText) {
          // Fallback: get first meaningful text
          const lines = card.innerText.split('\n').filter(l => l.trim().length > 5);
          name = lines[0] || '';
        }
        
        // Get price - Improved Regex & Selector
        let price = null;
        
        // Strategy 1: Look for specific price elements first (more accurate)
        const priceEl = card.querySelector('[class*="price"], span[class*="text-"], div[class*="text-"]');
        if (priceEl && priceEl.innerText.includes('Rp')) {
             const specificText = priceEl.innerText;
             const pMatch = specificText.match(/Rp\s*([\d.]+)/); // Handle optional space
             if (pMatch) price = parseInt(pMatch[1].replace(/\./g, ''));
        }

        // Strategy 2: Fallback to card text regex if strategy 1 failed
        if (!price) {
            const priceText = card.innerText || '';
            const priceMatch = priceText.match(/Rp\s*([\d.]+)/); // Handle optional space
            if (priceMatch) {
              price = parseInt(priceMatch[1].replace(/\./g, ''));
            }
        }
        
        // Get image - Improved lazy load handling
        let imageUrl = '';
        if (imgEl) {
          // Check standard src first, then data attributes
          imageUrl = imgEl.src || imgEl.getAttribute('data-src') || '';
          
          // Handle lazy load placeholder
          if (imageUrl.includes('data:image') || imageUrl.includes('placeholder')) {
              // Try finding background image if img src is placeholder
              const bgDiv = card.querySelector('div[style*="background-image"]');
              if (bgDiv) {
                  const style = bgDiv.getAttribute('style');
                  const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
                  if (urlMatch) imageUrl = urlMatch[1];
              }
          }
          
          // Clean URL
          if (imageUrl) {
              imageUrl = imageUrl.replace(/_tn(\.\w+)?$/, '$1'); // Get full size
          }
        }
        
        if (name && link) {
          products.push({
            source: 'shopee',
            sourceUrl: link.href.startsWith('http') ? link.href : 'https://shopee.co.id' + link.getAttribute('href'),
            name: name.substring(0, 200),
            price: price,
            images: imageUrl ? [imageUrl] : [],
          });
        }
      } catch (e) {
        console.error('Error scraping card:', e);
      }
    }

    if (products.length === 0) {
      return { success: false, error: 'Gagal extract data produk (Hanya Judul yang ditemukan?). Coba scroll ke bawah agar gambar termuat.' };
    }


    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper functions
function extractProductId() {
  const match = window.location.pathname.match(/-i\.(\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}` : null;
}

function getProductName() {
  // Try multiple selectors
  const selectors = [
    'h1',
    '.WBVL_7',
    '[data-sqe="name"]',
    '.qaNIZv span'
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
  // Shopee uses specific containers for description
  // The description is usually inside a section with header "Deskripsi Produk"
  
  // Strategy 1: Find by XPath - description content div (from shopee-scraper reference)
  const descXpaths = [
    '//*[contains(text(),"Deskripsi Produk")]/following-sibling::div',
    '//*[contains(text(),"Deskripsi Produk")]/../following-sibling::div',
    '//div[contains(@class,"product-detail")]//div[contains(@class,"description")]'
  ];
  
  for (const xpath of descXpaths) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        const text = result.singleNodeValue.innerText?.trim();
        if (text && text.length > 30 && text.length < 5000) {
          console.log('Harkat Scraper: Found desc via XPath, length:', text.length);
          return text;
        }
      }
    } catch (e) {}
  }
  
  // Strategy 2: Find the description section container
  // Look for container that has "Deskripsi Produk" as header/label
  const allElements = document.querySelectorAll('div, section');
  
  for (const el of allElements) {
    // Check if this element's first child or header contains "Deskripsi Produk"
    const firstChild = el.firstElementChild;
    const headerText = firstChild?.innerText?.trim() || '';
    
    if (headerText === 'Deskripsi Produk' || headerText.startsWith('Deskripsi Produk')) {
      // Get the content after the header
      const siblings = Array.from(el.children).slice(1);
      if (siblings.length > 0) {
        const content = siblings.map(s => s.innerText?.trim()).filter(t => t).join('\n');
        if (content.length > 30 && content.length < 5000) {
          console.log('Harkat Scraper: Found desc via header search, length:', content.length);
          return content;
        }
      }
      
      // Or get text after the header text
      const fullText = el.innerText || '';
      const descStart = fullText.indexOf('Deskripsi Produk');
      if (descStart !== -1) {
        let descText = fullText.substring(descStart + 'Deskripsi Produk'.length).trim();
        
        // Stop at these markers
        const stopKeywords = ['Penilaian Produk', 'Ulasan Produk', 'Spesifikasi Produk', 'Produk Lainnya'];
        for (const kw of stopKeywords) {
          const idx = descText.indexOf(kw);
          if (idx > 10) {
            descText = descText.substring(0, idx).trim();
          }
        }
        
        if (descText.length > 30 && descText.length < 5000) {
          console.log('Harkat Scraper: Extracted desc text, length:', descText.length);
          return descText;
        }
      }
    }
  }
  
  // Strategy 3: Look for common Shopee description classes
  const descSelectors = [
    '.f7AU53', // Shopee description class
    '[class*="pdp-product-desc"]',
    '[class*="product-description"]',
    '[data-sqe="description"]'
  ];
  
  for (const sel of descSelectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText?.trim();
        if (text && text.length > 30 && text.length < 5000) {
          console.log('Harkat Scraper: Found desc via selector', sel, 'length:', text.length);
          return text;
        }
      }
    } catch (e) {}
  }
  
  console.log('Harkat Scraper: No description found');
  return null;
}



function getProductPrice() {
  // Try to find the main price element - usually has orange/red color
  // Shopee uses classes like "pqTWkA" or elements with color styling
  
  // Method 1: Find by common price container near product info
  const priceContainers = document.querySelectorAll('[class*="flex"]');
  
  for (const container of priceContainers) {
    const style = window.getComputedStyle(container);
    const text = container.innerText?.trim() || '';
    
    // Look for orange/red colored price (Shopee uses rgb(238, 77, 45) or similar)
    const color = style.color;
    const isOrange = color.includes('238') || color.includes('ee4d') || color.includes('d0011b');
    
    if (text.startsWith('Rp') && text.length < 50) {
      // Handle price range: "Rp3.900.000 - Rp5.200.000"
      const priceMatch = text.match(/Rp([\d.]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/\./g, ''));
        if (price > 10000) return price;
      }
    }
  }
  
  // Method 2: Find large text with Rp (price is usually big font)
  const allElements = document.querySelectorAll('div, span');
  
  for (const el of allElements) {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const text = el.innerText?.trim() || '';
    
    // Price area usually has font-size > 20px
    if (fontSize >= 20 && text.startsWith('Rp')) {
      const priceMatch = text.match(/Rp([\d.]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/\./g, ''));
        if (price > 10000) return price;
      }
    }
  }
  
  // Method 3: Find by typical Shopee class patterns
  const shopeeSelectors = [
    '[class*="price"]',
    '[class*="Price"]', 
    '.IH5Sdm',
    '.pqTWkA',
    '.G27FPf'
  ];
  
  for (const sel of shopeeSelectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText?.trim() || '';
        const priceMatch = text.match(/Rp([\d.]+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/\./g, ''));
          if (price > 10000) return price;
        }
      }
    } catch (e) {}
  }
  
  return null;
}

function getOriginalPrice() {
  const origEl = document.querySelector('.WTFwws, .SxL\\+Ds');
  if (origEl) {
    return parsePriceText(origEl.textContent);
  }
  return null;
}

function getProductImages() {
  const images = [];
  const seenUrls = new Set();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Cutoff height - images below this are likely "Products form this shop" or recommendations
  // Increased to 2500px to be safe for larger descriptions but avoid bottom recommendations
  const MAX_TOP_POSITION = 2500;
  
  // Method 1: Thumbnails often use background-image in Shopee
  const bgElements = document.querySelectorAll('div[style*="background-image"]');
  bgElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const absTop = rect.top + scrollTop;
    
    // Skip if too far down
    if (absTop > MAX_TOP_POSITION) return;

    const style = el.getAttribute('style');
    const match = style.match(/url\(['"]?(.*?)['"]?\)/);
    if (match && match[1]) {
      const src = match[1];
      if (src.includes('shopee') && !src.includes('icon') && !seenUrls.has(src)) {
        // High priority for thumbnails
        const cleanUrl = src.replace(/_tn$/, '').split('?')[0];
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          images.push({ url: src, score: 200000, isShopee: true }); 
        }
      }
    }
  });

  // Method 2: Get all images on the page
  const allImgs = document.querySelectorAll('img');
  
  allImgs.forEach(img => {
    const src = img.src || img.dataset?.src || img.getAttribute('data-src');
    if (!src) return;
    
    // Skip if not a product image
    if (src.includes('data:')) return;
    if (src.includes('avatar')) return;
    if (src.includes('icon')) return;
    if (src.includes('logo')) return;
    if (src.includes('banner')) return;
    if (src.includes('ads')) return;
    
    // Get actual rendered size and position
    const rect = img.getBoundingClientRect();
    const width = rect.width || img.naturalWidth || img.width;
    const height = rect.height || img.naturalHeight || img.height;
    const absTop = rect.top + scrollTop;

    // Strict filter: Only get images from top section
    if (absTop > MAX_TOP_POSITION) return;
    
    // Skip very small images (icons, etc)
    if (width < 60 || height < 60) return; 
    
    // Prefer shopee CDN images
    const isShopeeImage = src.includes('shopee') || src.includes('cf.shopee');
    
    // Skip duplicate URLs
    const cleanUrl = src.split('?')[0].replace(/_tn$/, '');
    if (seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    
    // Score based on size
    let score = width * height;
    
    // Boost score if it looks like a thumbnail container
    if (img.closest('[class*="carousel"]') || img.closest('[class*="slider"]')) {
      score += 50000;
    }
    
    // Penalize if it implies "recommendation" wrapper
    if (img.closest('[class*="recommendation"]') || img.closest('[class*="related"]')) {
      score -= 100000;
      if (score < 0) return; // Skip completely
    }
    
    images.push({
      url: src,
      score: score,
      isShopee: isShopeeImage
    });
  });
  
  // Sort by score (largest first), prioritize shopee images
  images.sort((a, b) => {
    if (a.isShopee && !b.isShopee) return -1;
    if (!a.isShopee && b.isShopee) return 1;
    return b.score - a.score;
  });
  
  const result = images.slice(0, 15).map(i => i.url);
  console.log('Harkat Scraper: Found images:', result.length, result);
  return result;
}

function getCategory() {
  const breadcrumbs = document.querySelectorAll('.flex.items-center a span, .breadcrumb a');
  if (breadcrumbs.length > 1) {
    return breadcrumbs[breadcrumbs.length - 2]?.textContent?.trim() || null;
  }
  return null;
}

function getVariants() {
  const variants = [];
  
  // Strategy 1: Look for rows that look like variant selectors (Label on left, Buttons on right)
  // Shopee uses specific flex structures. Let's find containers that have buttons.
  const allButtons = document.querySelectorAll('button');
  const candidateContainers = new Set();
  
  allButtons.forEach(btn => {
      // Find the row container for this button
      let parent = btn.parentElement;
      for(let i=0; i<3; i++) { // Go up a few levels to find the row wrapper
          if (parent) {
             const style = window.getComputedStyle(parent);
             // Look for flex containers with buttons
             if (style.display === 'flex' || style.display === 'grid') {
                 candidateContainers.add(parent);
             }
             parent = parent.parentElement;
          }
      }
  });

  candidateContainers.forEach(row => {
      // 0. Safety Check: Avoid fixed/sticky containers (e.g. Bottom Action Bar, Top Header)
      let isFixed = false;
      let curr = row;
      for (let k = 0; k < 5; k++) { // Check 5 levels up
          if (!curr || curr === document.body) break;
          const style = window.getComputedStyle(curr);
          if (style.position === 'fixed' || style.position === 'sticky') {
              isFixed = true;
              break;
          }
          curr = curr.parentElement;
      }
      if (isFixed) return;
      // 1. Check if this container has a Label sibling or child acting as label
      // Usually the hierarchy is:  [Label] [Container of Buttons] OR [Row [Label] [ButtonsWrapper]]
      
      let labelText = '';
      
      // Check for Preceding Sibling Label (common in grid layouts)
      let sibling = row.previousElementSibling;
      if (sibling && (sibling.tagName === 'LABEL' || sibling.innerText.length < 30)) {
           labelText = sibling.innerText?.trim();
      }
      
      // If not found, check Parent's first child (Flex row layout)
      if (!labelText && row.parentElement) {
           const parentRow = row.parentElement;
           const firstChild = parentRow.firstElementChild;
           // If the row contains "Kuantitas" or "Quantity", ignore it immediately
           if (parentRow.innerText?.includes('Kuantitas') || parentRow.innerText?.includes('Quantity')) return;
           
           if (firstChild && firstChild !== row && firstChild.innerText.length < 30) {
               labelText = firstChild.innerText?.trim();
           }
      }

      if (!labelText) return; // No label found, unsafe to assume it's a variant

      // 2. Filter out non-variant info rows
      if (/Kuantitas|Quantity|Stok|Stock|Pengiriman|Shipping|Jaminan|Ongkos|Voucher|Cicilan|Favorit|Favorite|Bagikan|Share|Chat|Percakapan|Beli|Keranjang/i.test(labelText)) return;
      
      // 3. Extract Options from Buttons in this row
    const options = [];
    const buttons = row.querySelectorAll('button');
    
    buttons.forEach(btn => {
      // Get text content
      let text = btn.innerText?.trim() || btn.getAttribute('aria-label');
      
      // If button has text, add it
      if (text) {
          // Clean up formatting (e.g. remove "Selected" suffix if any)
          text = text.replace(/[\n\r]+/g, ' ').trim();

          // Aggressive Filter: If button text looks like an action, skip it
          if (/Chat|Percakapan|Beli|Keranjang|Batal|Simpan|Login|Daftar|Follow|Ikuti/i.test(text)) return;

          if (!options.includes(text)) {
            options.push(text);
          }
      }
    });

    if (options.length > 0) {
      // Check if we already have this variant group
      const exists = variants.find(v => v.name === labelText);
      if (!exists) {
          variants.push({ name: labelText, options });
      }
    }
  });

  return variants;
}

function getSpecifications() {
  const specs = {};
  const specRows = document.querySelectorAll('.pmmxKx, .product-detail-info .flex');
  
  specRows.forEach(row => {
    const cells = row.querySelectorAll('span, div');
    if (cells.length >= 2) {
      const key = cells[0]?.textContent?.trim();
      const value = cells[1]?.textContent?.trim();
      if (key && value) {
        specs[key] = value;
      }
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
  // Check if already exists
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
        background: linear-gradient(135deg, #8B5A2B, #D2691E);
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
      #harkat-scraper-widget .widget-menu.show {
        display: block;
        animation: slideUp 0.2s ease;
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #harkat-scraper-widget .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-size: 13px;
      }
      #harkat-scraper-widget .menu-item:hover {
        background: #f5f5f5;
      }
      #harkat-scraper-widget .menu-item.success {
        color: #10b981;
      }
      #harkat-scraper-widget .menu-item.loading {
        opacity: 0.5;
        pointer-events: none;
      }
      #harkat-scraper-widget .toast {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: #333;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        animation: fadeIn 0.2s;
      }
      #harkat-scraper-widget .toast.success { background: #10b981; }
      #harkat-scraper-widget .toast.error { background: #ef4444; }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>
    <div class="widget-menu" id="harkat-menu">
      <button class="menu-item" id="harkat-scrape-btn">
        📦 Scrape Produk Ini
      </button>
      <button class="menu-item" id="harkat-scrape-all-btn">
        📋 Scrape Semua di Halaman
      </button>
      <button class="menu-item" id="harkat-send-btn" style="display:none">
        ✅ Kirim ke Harkat
      </button>
    </div>
    <button class="widget-btn" id="harkat-toggle-btn" title="Harkat Scraper">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>
    </button>
  `;

  document.body.appendChild(widget);

  let scrapedData = null;
  const menu = document.getElementById('harkat-menu');
  const toggleBtn = document.getElementById('harkat-toggle-btn');
  const scrapeBtn = document.getElementById('harkat-scrape-btn');
  const scrapeAllBtn = document.getElementById('harkat-scrape-all-btn');
  const sendBtn = document.getElementById('harkat-send-btn');

  toggleBtn.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) {
      menu.classList.remove('show');
    }
  });

  scrapeBtn.addEventListener('click', async () => {
    scrapeBtn.classList.add('loading');
    scrapeBtn.textContent = '⏳ Scraping...';
    
    const result = await scrapeCurrentProduct();
    
    if (result.success) {
      scrapedData = result.data;
      scrapeBtn.textContent = '✓ ' + scrapedData.name.substring(0, 20) + '...';
      scrapeBtn.classList.remove('loading');
      scrapeBtn.classList.add('success');
      sendBtn.style.display = 'flex';
      showToast('Berhasil scrape!', 'success');
    } else {
      scrapeBtn.textContent = '📦 Scrape Produk Ini';
      scrapeBtn.classList.remove('loading');
      showToast(result.error, 'error');
    }
  });

  // Scrape all products on page
  scrapeAllBtn.addEventListener('click', async () => {
    scrapeAllBtn.classList.add('loading');
    scrapeAllBtn.textContent = '⏳ Scraping...';
    
    const result = await scrapeAllProducts();
    
    if (result.success) {
      scrapedData = result.data; // This is an array
      const count = Array.isArray(scrapedData) ? scrapedData.length : 1;
      scrapeAllBtn.textContent = `✓ ${count} produk`;
      scrapeAllBtn.classList.remove('loading');
      scrapeAllBtn.classList.add('success');
      sendBtn.style.display = 'flex';
      showToast(`Berhasil scrape ${count} produk!`, 'success');
    } else {
      scrapeAllBtn.textContent = '📋 Scrape Semua di Halaman';
      scrapeAllBtn.classList.remove('loading');
      showToast(result.error, 'error');
    }
  });

  sendBtn.addEventListener('click', async () => {
    if (!scrapedData) return;
    
    sendBtn.classList.add('loading');
    sendBtn.textContent = '⏳ Mengirim...';
    
    try {
      // Send via background script to bypass CORS
      const isArray = Array.isArray(scrapedData);
      const data = isArray ? { products: scrapedData } : scrapedData;
      
      chrome.runtime.sendMessage(
        { action: 'sendToApi', data: data },
        (response) => {
          if (response && response.success) {
            showToast('✅ Terkirim ke Harkat!', 'success');
            sendBtn.textContent = '✅ Terkirim!';
            setTimeout(() => {
              scrapedData = null;
              scrapeBtn.textContent = '📦 Scrape Produk Ini';
              scrapeBtn.classList.remove('success');
              scrapeAllBtn.textContent = '📋 Scrape Semua di Halaman';
              scrapeAllBtn.classList.remove('success');
              sendBtn.style.display = 'none';
              sendBtn.textContent = '✅ Kirim ke Harkat';
              sendBtn.classList.remove('loading');
              menu.classList.remove('show');
            }, 1500);
          } else {
            showToast(response?.error || 'Gagal kirim', 'error');
            sendBtn.textContent = '✅ Kirim ke Harkat';
            sendBtn.classList.remove('loading');
          }
        }
      );
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
      sendBtn.textContent = '✅ Kirim ke Harkat';
      sendBtn.classList.remove('loading');
    }
  });

  function showToast(message, type = 'info') {
    const existing = widget.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    widget.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Inject widget on all Shopee pages (product pages and listing/search pages)
setTimeout(createFloatingWidget, 1500);

console.log('Harkat Scraper: Shopee content script loaded');
