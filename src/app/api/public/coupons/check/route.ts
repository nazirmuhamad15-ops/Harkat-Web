
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { coupons } from '@/db/schema'
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    try {
        const { code, cartTotal } = await request.json()

        if (!code) {
           return NextResponse.json({ error: 'Code required' }, { status: 400 })
        }

        const now = new Date()

        const coupon = await db.query.coupons.findFirst({
            where: and(
                eq(coupons.code, code.toUpperCase()),
                eq(coupons.isActive, true),
                or(isNull(coupons.startDate), lte(coupons.startDate, now)),
                or(isNull(coupons.endDate), gte(coupons.endDate, now))
            )
        })

        if (!coupon) {
            return NextResponse.json({ error: 'Code not found or expired' }, { status: 404 })
        }

        // Check usage limit
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
            return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
        }

        // Check min order
        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
             return NextResponse.json({ 
                error: `Minimum order of Rp ${coupon.minOrderAmount.toLocaleString('id-ID')} required` 
             }, { status: 400 })
        }

        let discountAmount = 0
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (cartTotal * coupon.discountValue) / 100
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount
            }
        } else {
             discountAmount = coupon.discountValue
        }

        // Ensure discount doesn't exceed total
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal
        }

        return NextResponse.json({
            valid: true,
            discountAmount,
            couponCode: coupon.code,
            type: coupon.discountType
        })

    } catch (error) {
        console.error('Verify coupon error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}
