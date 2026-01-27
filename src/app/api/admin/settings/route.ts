import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings, activityLogs } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { inArray } from 'drizzle-orm'

const DEFAULT_SETTINGS: any = {
  store: {
    name: 'Harkat Furniture',
    email: 'info@harkatfurniture.com',
    phone: '+62 21 5555 1234',
    address: 'Jl. Furniture No. 123',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '12345',
    country: 'Indonesia'
  },
  shipping: {
    freeShippingThreshold: 5000000,
    defaultShippingCost: 150000,
    volumetricDivisor: 4000,
    weightThreshold: 50
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    orderConfirmation: true,
    shippingUpdates: true,
    deliveryConfirmation: true
  },
  payment: {
    bankName: 'BCA',
    bankAccount: '1234567890',
    bankAccountName: 'PT Harkat Furniture',
    paymentMethods: ['transfer', 'ewallet', 'cod']
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch individual settings keys
    const rawSettings = await db.query.systemSettings.findMany({
      where: inArray(systemSettings.key, ['store', 'shipping', 'notifications', 'payment'])
    })

    const constructedSettings = { ...DEFAULT_SETTINGS }

    rawSettings.forEach(s => {
      try {
        if (s.key in constructedSettings) {
          constructedSettings[s.key] = JSON.parse(s.value)
        }
      } catch (e) {
        console.error('Failed to parse setting key:', s.key)
      }
    })

    return NextResponse.json({ settings: constructedSettings })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const keys = ['store', 'shipping', 'notifications', 'payment']

    await db.transaction(async (tx) => {
        for (const key of keys) {
            if (body[key]) {
                await tx.insert(systemSettings)
                    .values({
                        key: key,
                        value: JSON.stringify(body[key]),
                        updatedAt: new Date()
                    })
                    .onConflictDoUpdate({
                        target: systemSettings.key,
                        set: {
                            value: JSON.stringify(body[key]),
                            updatedAt: new Date()
                        }
                    })
            }
        }

        // Log activity
        await tx.insert(activityLogs).values({
            userId: session.user.id,
            action: 'UPDATE_SETTINGS',
            entityType: 'SYSTEM',
            entityId: 'global',
            newValues: JSON.stringify(body),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
        })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}