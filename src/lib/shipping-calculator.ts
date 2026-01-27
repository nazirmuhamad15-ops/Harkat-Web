/**
 * Internal Shipping Calculator - Distance Based
 * For Harkat Furniture internal pickup delivery (Java only)
 * 
 * Pricing:
 * - 0-30km: FREE
 * - 31-80km: Rp 100.000
 * - 81-130km: Rp 200.000
 * - 131-180km: Rp 300.000
 * - etc... (+50km = +Rp 100.000)
 */

// Store location (Harkat Furniture warehouse)
export const STORE_LOCATION = {
  name: 'Harkat Furniture',
  lat: -6.2088, // Default: Jakarta - UPDATE WITH ACTUAL LOCATION
  lng: 106.8456,
  address: 'Jakarta, Indonesia'
};

// Java provinces for validation
const JAVA_PROVINCES = [
  'DKI JAKARTA', 'JAKARTA',
  'JAWA BARAT', 'WEST JAVA',
  'JAWA TENGAH', 'CENTRAL JAVA',
  'JAWA TIMUR', 'EAST JAVA',
  'BANTEN',
  'DI YOGYAKARTA', 'YOGYAKARTA', 'DIY'
];

// Major cities with approximate distances from Jakarta (in km)
// This is used as fallback when Google Maps API is not available
const CITY_DISTANCES: Record<string, number> = {
  // Jabodetabek (0-30km)
  'JAKARTA': 0,
  'JAKARTA PUSAT': 0,
  'JAKARTA SELATAN': 10,
  'JAKARTA BARAT': 12,
  'JAKARTA TIMUR': 15,
  'JAKARTA UTARA': 15,
  'TANGERANG': 25,
  'TANGERANG SELATAN': 28,
  'DEPOK': 30,
  'BEKASI': 20,
  
  // 31-80km tier (Rp 100.000)
  'BOGOR': 55,
  'CIKARANG': 40,
  'KARAWANG': 65,
  'SERANG': 70,
  'CILEGON': 80,
  'SUBANG': 75,
  'PURWAKARTA': 80,
  
  // 81-130km tier (Rp 200.000)
  'BANDUNG': 120,
  'CIREBON': 130,
  'SUKABUMI': 100,
  'GARUT': 125,
  'TASIKMALAYA': 130,
  
  // 131-180km tier (Rp 300.000)
  'KUNINGAN': 150,
  'MAJALENGKA': 140,
  'INDRAMAYU': 160,
  'BREBES': 180,
  
  // 181-230km tier (Rp 400.000)
  'TEGAL': 190,
  'PEKALONGAN': 220,
  'PEMALANG': 210,
  'BATANG': 225,
  
  // 231-280km tier (Rp 500.000)
  'SEMARANG': 270,
  'KENDAL': 260,
  'DEMAK': 265,
  'PURWOKERTO': 250,
  'CILACAP': 275,
  
  // 281-330km tier (Rp 600.000)
  'KUDUS': 290,
  'JEPARA': 310,
  'PATI': 320,
  'REMBANG': 330,
  'BLORA': 325,
  
  // 331-380km tier (Rp 700.000)
  'SOLO': 350,
  'SURAKARTA': 350,
  'KLATEN': 340,
  'BOYOLALI': 355,
  'SRAGEN': 365,
  'KARANGANYAR': 360,
  
  // 381-430km tier (Rp 800.000)
  'YOGYAKARTA': 390,
  'SLEMAN': 395,
  'BANTUL': 400,
  'GUNUNG KIDUL': 420,
  'MAGELANG': 385,
  'TEMANGGUNG': 400,
  
  // 431-480km tier (Rp 900.000)
  'MADIUN': 450,
  'NGAWI': 460,
  'MAGETAN': 455,
  'PONOROGO': 470,
  'PACITAN': 480,
  
  // 481-530km tier (Rp 1.000.000)
  'KEDIRI': 500,
  'TULUNGAGUNG': 510,
  'BLITAR': 520,
  'NGANJUK': 490,
  'JOMBANG': 530,
  
  // 531-580km tier (Rp 1.100.000)
  'SURABAYA': 550,
  'SIDOARJO': 555,
  'GRESIK': 560,
  'LAMONGAN': 570,
  'MOJOKERTO': 545,
  'PASURUAN': 575,
  
  // 581-630km tier (Rp 1.200.000)
  'MALANG': 600,
  'BATU': 610,
  'PROBOLINGGO': 620,
  'LUMAJANG': 625,
  
  // 631-680km tier (Rp 1.300.000)
  'JEMBER': 660,
  'BONDOWOSO': 670,
  'SITUBONDO': 680,
  
  // 681-730km tier (Rp 1.400.000)
  'BANYUWANGI': 720,
  
  // Default for unknown cities in Java
  'DEFAULT_JAVA': 300
};

export interface ShippingRequest {
  destinationProvince: string;
  destinationCity: string;
  destinationLat?: number;
  destinationLng?: number;
  weight?: number; // kg (optional, not used in distance-based pricing)
}

export interface ShippingResult {
  distance: number; // km
  cost: number; // Rupiah
  isFree: boolean;
  estimatedDays: string;
  isServiceable: boolean;
  message: string;
}

export interface ShippingOption {
  code: string;
  name: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

/**
 * Check if province is in Java
 */
export function isInJava(province: string): boolean {
  const normalized = province.toUpperCase().trim();
  return JAVA_PROVINCES.some(p => 
    normalized.includes(p) || p.includes(normalized)
  );
}

/**
 * Calculate distance using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get estimated distance for a city
 */
export function getCityDistance(city: string): number {
  const normalized = city.toUpperCase().trim();
  
  // Try exact match
  if (CITY_DISTANCES[normalized] !== undefined) {
    return CITY_DISTANCES[normalized];
  }
  
  // Try partial match
  for (const [cityName, distance] of Object.entries(CITY_DISTANCES)) {
    if (normalized.includes(cityName) || cityName.includes(normalized)) {
      return distance;
    }
  }
  
  // Return default for unknown Java cities
  return CITY_DISTANCES['DEFAULT_JAVA'];
}

/**
 * Calculate shipping cost based on distance
 * 
 * Rules:
 * - 0-30km: FREE (if order >= Rp 3.000.000, else Rp 50.000)
 * - 31-80km: Rp 150.000
 * - 81-130km: Rp 250.000
 * - 131-180km: Rp 350.000
 * - etc... (+50km = +Rp 100.000)
 */
export function calculateShippingCost(distanceKm: number, orderTotal: number = 0): number {
  const MIN_ORDER_FREE_SHIPPING = 3000000; // Rp 3 juta
  
  // Free for first 30km IF order >= 3 juta
  if (distanceKm <= 30) {
    if (orderTotal >= MIN_ORDER_FREE_SHIPPING) {
      return 0;
    }
    return 50000; // Rp 50.000 for orders under 3 juta
  }
  
  // First tier: 31-80km = Rp 150.000
  if (distanceKm <= 80) {
    return 150000;
  }
  
  // Calculate remaining tiers after 80km
  // 81-130km = Rp 250.000
  // 131-180km = Rp 350.000
  // etc... (+50km = +Rp 100.000)
  const distanceAfterFirstTier = distanceKm - 80;
  const additionalTiers = Math.ceil(distanceAfterFirstTier / 50);
  
  return 150000 + (additionalTiers * 100000);
}

/**
 * Get estimated delivery days based on distance
 */
export function getEstimatedDays(distanceKm: number): string {
  if (distanceKm <= 30) return '1 hari';
  if (distanceKm <= 100) return '1-2 hari';
  if (distanceKm <= 200) return '2-3 hari';
  if (distanceKm <= 400) return '3-4 hari';
  if (distanceKm <= 600) return '4-5 hari';
  return '5-7 hari';
}

/**
 * Calculate shipping for a destination
 */
export function calculateShipping(request: ShippingRequest & { orderTotal?: number }): ShippingResult {
  // Check if in Java
  if (!isInJava(request.destinationProvince)) {
    return {
      distance: 0,
      cost: 0,
      isFree: false,
      estimatedDays: '-',
      isServiceable: false,
      message: 'Maaf, pengiriman hanya tersedia untuk Pulau Jawa'
    };
  }
  
  // Get distance
  let distance: number;
  
  if (request.destinationLat && request.destinationLng) {
    distance = calculateDistance(
      STORE_LOCATION.lat,
      STORE_LOCATION.lng,
      request.destinationLat,
      request.destinationLng
    );
  } else {
    distance = getCityDistance(request.destinationCity);
  }
  
  const orderTotal = request.orderTotal || 0;
  const cost = calculateShippingCost(distance, orderTotal);
  const isFree = cost === 0;
  const estimatedDays = getEstimatedDays(distance);
  
  let message: string;
  if (isFree) {
    message = `Gratis ongkir! (${Math.round(distance)} km, min order Rp 3 juta)`;
  } else if (distance <= 30 && orderTotal < 3000000) {
    const remaining = 3000000 - orderTotal;
    message = `Ongkir Rp ${cost.toLocaleString('id-ID')}. Tambah Rp ${remaining.toLocaleString('id-ID')} untuk gratis ongkir!`;
  } else {
    message = `Ongkir Rp ${cost.toLocaleString('id-ID')} untuk jarak ${Math.round(distance)} km`;
  }
  
  return {
    distance: Math.round(distance),
    cost,
    isFree,
    estimatedDays,
    isServiceable: true,
    message
  };
}

/**
 * Get shipping options (for checkout page compatibility)
 */
export async function getShippingOptions(request: ShippingRequest): Promise<ShippingOption[]> {
  const result = calculateShipping(request);
  
  if (!result.isServiceable) {
    return [];
  }
  
  const options: ShippingOption[] = [
    {
      code: 'HARKAT_INTERNAL',
      name: 'Harkat Delivery',
      service: 'Internal Pickup',
      description: result.isFree 
        ? `Gratis ongkir untuk ${result.distance} km pertama!`
        : `Pengiriman internal Harkat Furniture (${result.distance} km)`,
      cost: result.cost,
      etd: result.estimatedDays
    }
  ];
  
  return options;
}

/**
 * Get available cities list
 */
export function getAvailableCities(): string[] {
  return Object.keys(CITY_DISTANCES).filter(city => city !== 'DEFAULT_JAVA');
}

/**
 * Update store location (call this on app init with actual coordinates)
 */
export function setStoreLocation(lat: number, lng: number, name?: string, address?: string) {
  STORE_LOCATION.lat = lat;
  STORE_LOCATION.lng = lng;
  if (name) STORE_LOCATION.name = name;
  if (address) STORE_LOCATION.address = address;
}

/**
 * Get shipping cost breakdown for display
 */
export function getShippingBreakdown(distanceKm: number, orderTotal: number = 0): {
  distance: number;
  minOrderForFree: number;
  qualifiesForFree: boolean;
  cost: number;
  tier: string;
} {
  const MIN_ORDER_FREE_SHIPPING = 3000000;
  const qualifiesForFree = orderTotal >= MIN_ORDER_FREE_SHIPPING && distanceKm <= 30;
  const cost = calculateShippingCost(distanceKm, orderTotal);
  
  let tier: string;
  if (distanceKm <= 30) {
    tier = qualifiesForFree ? 'Gratis (0-30km)' : 'Lokal (0-30km)';
  } else if (distanceKm <= 80) {
    tier = 'Tier 1 (31-80km)';
  } else if (distanceKm <= 130) {
    tier = 'Tier 2 (81-130km)';
  } else if (distanceKm <= 180) {
    tier = 'Tier 3 (131-180km)';
  } else {
    const tierNum = Math.ceil((distanceKm - 30) / 50);
    tier = `Tier ${tierNum} (${31 + (tierNum-1)*50}-${30 + tierNum*50}km)`;
  }
  
  return {
    distance: Math.round(distanceKm),
    minOrderForFree: MIN_ORDER_FREE_SHIPPING,
    qualifiesForFree,
    cost,
    tier
  };
}
