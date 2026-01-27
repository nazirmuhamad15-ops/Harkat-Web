/**
 * Internal Shipping Service
 * Distance-based shipping for Harkat Furniture internal pickup (Java only)
 * 
 * Pricing Rules:
 * - 0-30km: FREE (if order >= Rp 3.000.000, else Rp 50.000)
 * - 31-80km: Rp 150.000
 * - 81-130km: Rp 250.000
 * - 131-180km: Rp 350.000
 * - etc... (+50km = +Rp 100.000)
 */

import { 
  calculateShipping as calcShipping, 
  getCityDistance, 
  isInJava,
  getEstimatedDays,
  calculateShippingCost as calcCost
} from './shipping-calculator';

// Types
export interface ShippingRequest {
  origin: string;
  destination: string; // City ID or name
  destinationProvince: string;
  weight: number; // kg
  orderTotal?: number; // For free shipping qualification
}

export interface ShippingOption {
  code: string;
  name: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
  type: 'INTERNAL' | 'COURIER';
}

// Min order for free shipping
const MIN_ORDER_FREE_SHIPPING = 3000000;

export const ShippingService = {
  /**
   * Calculate Volumetric Weight
   * Formula: (L x W x H) / 4000
   */
  calculateVolumeWeight(l: number, w: number, h: number): number {
    return (l * w * h) / 4000;
  },

  /**
   * Get Internal Fleet Rates (Distance-Based)
   */
  getInternalRates(req: ShippingRequest): ShippingOption[] {
    // Check if in Java
    if (!isInJava(req.destinationProvince)) {
      return [{
        code: 'NOT_SERVICEABLE',
        name: 'Tidak Tersedia',
        service: 'N/A',
        description: 'Maaf, pengiriman hanya tersedia untuk Pulau Jawa',
        cost: 0,
        etd: '-',
        type: 'INTERNAL'
      }];
    }

    // Get distance for destination city
    const distance = getCityDistance(req.destination);
    const orderTotal = req.orderTotal || 0;
    const cost = calcCost(distance, orderTotal);
    const etd = getEstimatedDays(distance);
    
    const options: ShippingOption[] = [];
    
    // Main delivery option
    if (cost === 0) {
      options.push({
        code: 'HARKAT_INTERNAL',
        name: 'Harkat Delivery',
        service: 'Internal Pickup',
        description: `GRATIS ONGKIR! (${distance} km, min order Rp 3 juta)`,
        cost: 0,
        etd,
        type: 'INTERNAL'
      });
    } else if (distance <= 30 && orderTotal < MIN_ORDER_FREE_SHIPPING) {
      const remaining = MIN_ORDER_FREE_SHIPPING - orderTotal;
      options.push({
        code: 'HARKAT_INTERNAL',
        name: 'Harkat Delivery',
        service: 'Internal Pickup',
        description: `Lokal (${distance} km). Tambah Rp ${remaining.toLocaleString('id-ID')} untuk gratis ongkir!`,
        cost,
        etd,
        type: 'INTERNAL'
      });
    } else {
      options.push({
        code: 'HARKAT_INTERNAL',
        name: 'Harkat Delivery',
        service: 'Internal Pickup',
        description: `Pengiriman internal Harkat (${distance} km)`,
        cost,
        etd,
        type: 'INTERNAL'
      });
    }

    return options;
  },

  /**
   * Get Courier Rates (fallback - returns internal rates)
   */
  async getCourierRates(req: ShippingRequest): Promise<ShippingOption[]> {
    // For now, we only use internal delivery
    return this.getInternalRates(req);
  },

  /**
   * Get all available shipping options
   */
  async getShippingRates(req: ShippingRequest): Promise<ShippingOption[]> {
    return this.getInternalRates(req);
  },

  /**
   * Check if province is serviceable (Java only)
   */
  isProvinceServiceable(province: string): boolean {
    return isInJava(province);
  }
};
