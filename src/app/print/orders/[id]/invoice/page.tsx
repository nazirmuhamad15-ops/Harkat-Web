'use client'

import { useState, useEffect, use } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// ... imports

// ... inside Component

         {/* Sender (Top) */}
         <div className="border-b-2 border-stone-900 pb-3 mb-4 pr-20 relative">
             <div className="absolute top-0 right-[-10px]">
                 <QRCodeSVG value={order.orderNumber} size={50} />
             </div>
             <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-stone-900" />
                <p className="text-xs font-black uppercase tracking-wider">{storeName} LOGISTICS</p>
             </div>
             <p className="text-[10px] text-stone-600 leading-tight w-3/4">
                 {storeAddr}, {storeCity} {storeZip} ({storePhone})
             </p>
         </div>

         {/* Recipient (Middle - HUGE) */}
         <div className="flex-1 flex flex-col justify-center mb-4">
             <div className="flex items-center gap-2 mb-2 text-stone-500">
                 <span className="text-[10px] font-bold uppercase tracking-widest border border-stone-300 px-1 rounded">Penerima</span>
             </div>
             <p className="text-lg font-black text-stone-900 leading-tight mb-1 uppercase break-words line-clamp-2">
                 {order.customerName}
             </p>
             <p className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1">
                 <Phone className="w-3 h-3" /> {order.customerPhone}
             </p>
             
             <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                 <div className="flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                     <p className="text-sm font-medium text-stone-700 leading-snug">
                        {address ? `${address.address}, ${address.city}, ${address.province}, ${address.zip}` : order.shippingAddress}
                     </p>
                 </div>
             </div>
         </div>

         {/* Footer (Order Details) */}
         <div className="border-t-2 border-stone-900 pt-3">
             <div className="flex justify-between items-end">
                 <div>
                     <p className="text-[10px] font-bold text-stone-400 uppercase">Order Number</p>
                     <p className="text-lg font-black text-stone-900">#{order.orderNumber}</p>
                 </div>
                 <div className="text-right">
                     <p className="text-[10px] font-bold text-stone-400 uppercase">Weight</p>
                     <p className="text-sm font-bold text-stone-900">{order.items.reduce((acc: number, item: any) => acc + (item.quantity * 10), 0)} kg</p>
                 </div>
             </div>
             {order.orderNotes && (
                 <div className="mt-2 text-[10px] italic text-stone-500 border-t border-stone-100 pt-1 truncate">
                     Note: {order.orderNotes}
                 </div>
             )}
         </div>
      </div>


      {/* --- DYNAMIC PRINT CSS --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printMode === 'invoice' ? 'A4' : '105mm 148mm'}; 
            margin: 0;
          }
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Hide everything inside body except the print content */
          body > *:not(.print\\:block) {
             /* We can't use display:none on body children easily in Next.js layout structure 
                because the layout wrapper exists. 
                Instead, we rely on Tailwind 'print:hidden' on the Controls container
                and 'print:block' / 'print:hidden' on the View containers.
             */
          }
          /* Ensure no margins on the page container relative to paper */
          .print\\:block {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              height: 100% !important;
              width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
