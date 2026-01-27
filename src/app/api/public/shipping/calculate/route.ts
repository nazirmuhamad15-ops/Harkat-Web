import { NextResponse } from 'next/server';
import { ShippingService } from '@/lib/shipping-service';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { z } from 'zod';

const limiter = rateLimit({ interval: 60 * 1000 }); // 1 Minute

// Validation Schema
const shippingSchema = z.object({
  destinationCityId: z.string().min(1, "Destination City ID required"),
  provinceName: z.string().optional(),
  orderTotal: z.number().optional(), // For free shipping qualification
  items: z.array(z.object({
    weight: z.number().min(0.1),
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    quantity: z.number().min(1).default(1),
    price: z.number().optional()
  })).min(1, "At least one item required")
});

export async function POST(req: Request) {
  try {
    // 1. Security: Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    
    const isAllowed = await limiter.check(10, ip);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // 2. Input Validation
    const body = await req.json();
    const validation = shippingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid Input', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { destinationCityId, provinceName, items, orderTotal } = validation.data;

    // Calculate order total from items if not provided
    const calculatedOrderTotal = orderTotal || items.reduce((acc, item) => {
      return acc + ((item.price || 0) * item.quantity);
    }, 0);

    // Calculate weights
    const totalActualWeight = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
    const totalVolumeWeight = items.reduce((acc, item) => {
      const vol = (item.length && item.width && item.height) 
        ? ShippingService.calculateVolumeWeight(item.length, item.width, item.height) 
        : 0;
      return acc + (vol * item.quantity);
    }, 0);

    // For furniture, use actual weight
    const finalWeight = totalActualWeight;

    // Get shipping rates (distance-based)
    const options = ShippingService.getInternalRates({
      origin: '', 
      destination: destinationCityId,
      destinationProvince: provinceName || '',
      weight: finalWeight,
      orderTotal: calculatedOrderTotal
    });

    if (options.length === 0) {
      console.warn(`No shipping options found for Destination: ${destinationCityId}`);
    }

    return NextResponse.json({ 
      rates: options,
      weight: {
        actual: totalActualWeight,
        volumetric: totalVolumeWeight,
        final: finalWeight,
        isHeavy: finalWeight >= 50
      },
      orderTotal: calculatedOrderTotal,
      minOrderForFreeShipping: 3000000
    });

  } catch (error) {
    console.error('Shipping API Error:', error);
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 });
  }
}
