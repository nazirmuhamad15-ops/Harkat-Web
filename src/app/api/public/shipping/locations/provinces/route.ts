import { NextResponse } from 'next/server';
import { provinces as staticProvinces } from '@/lib/regions';

/**
 * GET /api/public/shipping/locations/provinces
 * Returns list of available provinces (internal data only)
 */
export async function GET() {
  // Use internal static data - no external API
  const mapped = staticProvinces.map(p => ({
    province_id: p.id,
    province: p.name
  }));
  
  return NextResponse.json({ 
    results: mapped,
    source: 'internal'
  });
}
