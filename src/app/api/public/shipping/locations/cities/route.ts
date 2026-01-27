import { NextResponse } from 'next/server';
import { cities as staticCities } from '@/lib/regions';

/**
 * GET /api/public/shipping/locations/cities
 * Returns list of cities for a province (internal data only)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provinceId = searchParams.get('province_id');
  
  if (!provinceId) {
    return NextResponse.json({ results: [] });
  }

  // Use internal static data - no external API
  const citiesListResult = staticCities[provinceId];
  
  if (citiesListResult) {
    return NextResponse.json({ 
      results: citiesListResult.map(cityName => ({
        city_id: provinceId + '_' + cityName.replace(/\s+/g, '_').toLowerCase(),
        city_name: cityName,
        type: 'Kota/Kab',
        postal_code: '00000'
      })),
      source: 'internal'
    });
  }
  
  return NextResponse.json({ results: [] });
}
