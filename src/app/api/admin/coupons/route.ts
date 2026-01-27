
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db-drizzle'
import { coupons } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await db.query.coupons.findMany({
            orderBy: desc(coupons.createdAt)
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching vouchers:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        
        // Basic validation
        if (!body.code || !body.discountValue) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newCoupon = await db.insert(coupons).values({
            code: body.code.toUpperCase(),
            description: body.description,
            discountType: body.discountType || 'PERCENTAGE',
            discountValue: parseFloat(body.discountValue),
            minOrderAmount: parseFloat(body.minOrderAmount || 0),
            maxDiscountAmount: body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
            usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
            isActive: body.isActive ?? true
        }).returning()

        return NextResponse.json(newCoupon[0])
    } catch (error: any) {
        console.error('Error creating voucher:', error)
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
