
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db-drizzle'
import { coupons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        const updateData: any = {
            updatedAt: new Date()
        }
        
        if (body.code) updateData.code = body.code.toUpperCase()
        if (body.description !== undefined) updateData.description = body.description
        if (body.discountType) updateData.discountType = body.discountType
        if (body.discountValue) updateData.discountValue = parseFloat(body.discountValue)
        if (body.minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(body.minOrderAmount)
        if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null
        if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null
        if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
        if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null
        if (body.isActive !== undefined) updateData.isActive = body.isActive

        const updated = await db.update(coupons)
            .set(updateData)
            .where(eq(coupons.id, params.id))
            .returning()

        return NextResponse.json(updated[0])

    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await db.delete(coupons).where(eq(coupons.id, params.id))
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
