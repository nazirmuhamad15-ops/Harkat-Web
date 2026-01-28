import { NextResponse } from 'next/server'
import { db } from '@/lib/db-drizzle'
import { systemSettings } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await db.select().from(systemSettings)
    
    const settings: Record<string, any> = {}

    data.forEach(item => {
        try {
            // Try to parse if it looks like JSON
            const parsed = item.value.startsWith('{') || item.value.startsWith('[') 
                ? JSON.parse(item.value) 
                : item.value

            if (item.key === 'store' && typeof parsed === 'object') {
                settings['site_name'] = parsed.name
                settings['site_email'] = parsed.email
                settings['site_whatsapp'] = parsed.phone
                settings['site_address'] = parsed.address
                settings['site_city'] = parsed.city
                settings['site_province'] = parsed.province
                settings['site_postal_code'] = parsed.postalCode
            }
            
            settings[item.key] = parsed
        } catch (e) {
            settings[item.key] = item.value
        }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('API Settings Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
