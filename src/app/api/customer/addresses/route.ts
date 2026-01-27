import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userAddresses } from '@/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, session.user.id),
      orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)]
    })

    return NextResponse.json({ success: true, addresses })
  } catch (error) {
    console.error('Fetch addresses error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { label, recipientName, phone, addressLine, province, city, district, postalCode, isDefault } = body

    if (!label || !recipientName || !phone || !addressLine || !province || !city || !district || !postalCode) {
         return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, session.user.id))
    }

    // Check if this is the first address, if so, force default
    const existingCount = await db.$count(userAddresses, eq(userAddresses.userId, session.user.id))
    const shouldBeDefault = existingCount === 0 ? true : (isDefault || false)

    const [address] = await db.insert(userAddresses).values({
      userId: session.user.id,
      label,
      recipientName,
      phone,
      addressLine,
      province,
      city,
      district,
      postalCode,
      isDefault: shouldBeDefault
    }).returning()

    return NextResponse.json({ success: true, address })

  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
