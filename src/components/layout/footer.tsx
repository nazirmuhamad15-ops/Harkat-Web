"use client"

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

export function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const t = useTranslations('Footer')

  useEffect(() => {
      fetch('/api/public/settings')
          .then(res => res.json())
          .then(data => {
              if (data.success) setSettings(data.settings)
          })
          .catch(err => console.error(err))
  }, [])

  return (
    <footer className="bg-[#f5f5f5] pt-16 pb-8 border-t border-gray-200 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
                <Link href="/">
                    <h2 className="text-2xl font-bold tracking-tighter text-[#0058A3] mb-4">
                        Harkat Furniture<span className="text-[#FFDB00]">.</span>
                    </h2>
                </Link>
                <p className="text-gray-700 leading-relaxed max-w-sm mb-6">
                    {t('tagline')}
                </p>
                <div className="flex gap-4">
                    {/* Social Icons placeholders */}
                </div>
            </div>
            <div>
                    <h3 className="font-bold text-gray-900 mb-6 text-base">{t('customerService')}</h3>
                    <ul className="space-y-4 text-gray-700">
                        <li><Link href="/how-to-order" className="hover:underline hover:text-gray-900 transition-colors">{t('howToOrder')}</Link></li>
                        <li><Link href="/inspiration" className="hover:underline hover:text-gray-900 transition-colors">Inspirasi Ruang</Link></li>
                        <li><Link href="/shipping-returns" className="hover:underline hover:text-gray-900 transition-colors">{t('shippingReturns')}</Link></li>
                        <li><Link href="/track" className="hover:underline hover:text-gray-900 transition-colors">Lacak Paket</Link></li>
                        <li><Link href="/privacy" className="hover:underline hover:text-gray-900 transition-colors">{t('privacyPolicy')}</Link></li>
                        <li><Link href="/faq" className="hover:underline hover:text-gray-900 transition-colors">FAQs</Link></li>
                    </ul>
            </div>
            <div>
                    <h3 className="font-bold text-gray-900 mb-6 text-base">{t('contactUs')}</h3>
                    <ul className="space-y-4 text-gray-700">
                        <li className="flex flex-col">
                        <span className="font-bold text-gray-900">WhatsApp</span>
                        <span>{settings['site_whatsapp'] || '+62 838-7406-5238'}</span>
                        </li>
                        <li className="flex flex-col">
                        <span className="font-bold text-gray-900">Email</span>
                        <span>{settings['site_email'] || 'admin@harkatfurniture.web.id'}</span>
                        </li>
                        <li className="flex flex-col">
                        <span className="font-bold text-gray-900">{t('hours')}</span>
                        <span>{settings['site_operational_hours'] || 'Senin - Jumat: 09.00 - 17.00'}</span>
                        </li>
                    </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-300 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-700">
            <p>&copy; {new Date().getFullYear()} Harkat Furniture. {t('rights')}</p>
            <nav className="flex gap-6" aria-label="Footer legal links">
                <Link href="/cookie-policy" className="hover:underline hover:text-gray-900 transition-colors">Cookie Policy</Link>
                <Link href="/privacy" className="hover:underline hover:text-gray-900 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:underline hover:text-gray-900 transition-colors">Terms & Conditions</Link>
            </nav>
        </div>
    </footer>
  )
}
