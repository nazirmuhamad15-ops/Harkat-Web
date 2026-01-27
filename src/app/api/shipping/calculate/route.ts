import { NextRequest, NextResponse } from 'next/server'
import { ShippingService } from '@/lib/shipping-service'
import { z } from 'zod'

const ShippingRequestSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  weight: z.number().min(0.1, 'Weight must be greater than 0'),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isFragile: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = ShippingRequestSchema.parse(body)
    
    // Calculate shipping using new Service
    // We assume 'JAWA' as default province since old API doesn't provide it
    // and internal delivery is Java-only. 
    // This allows the route to function for testing without breaking.
    const shippingOptions = ShippingService.getInternalRates({
      origin: validatedData.origin,
      destination: validatedData.destination,
      destinationProvince: 'JAWA', // Fallback for legacy compatibility
      weight: validatedData.weight,
      orderTotal: 0
    })
    
    if (shippingOptions.length === 0 || shippingOptions[0].code === 'NOT_SERVICEABLE') {
      return NextResponse.json(
        { error: 'No shipping options available for this route' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        request: validatedData,
        options: shippingOptions,
        recommended: shippingOptions[0], 
      }
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Shipping calculation API is working',
    usage: 'POST /api/shipping/calculate with shipping details',
    example: {
      origin: 'Jakarta',
      destination: 'Surabaya',
      weight: 25,
      length: 100,
      width: 50,
      height: 30,
      isFragile: false
    }
  })
}