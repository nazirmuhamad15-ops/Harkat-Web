import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  variantId?: string
  quantity: number
  sku?: string
  weight: number // Actual weight in kg
  length: number // cm
  width: number // cm
  height: number // cm
  selected: boolean // Default true
}

interface CartStore {
  items: CartItem[]
  addItem: (data: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  toggleItem: (id: string) => void
  toggleAll: (selected: boolean) => void
  clearCart: () => void
  couponCode: string | null
  discountAmount: number
  applyCoupon: (code: string, amount: number) => void
  removeCoupon: () => void
  getTotals: () => {
    subtotal: number
    discountAmount: number
    total: number
    totalActualWeight: number
    totalVolumetricWeight: number
    finalDetailWeight: number // The Max(Actual, Volumetric) used for shipping
    isHeavyCargo: boolean // > 50kg
  }
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,
      applyCoupon: (code, amount) => set({ couponCode: code, discountAmount: amount }),
      removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
      addItem: (data: CartItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === data.id)

        // Reset coupon on cart change (optional, but safer to re-validate or keep and re-validate on checkout)
        // For now we keep it, but maybe we should reset if total goes below min order? 
        // Let's keep simpler logic for now.

        if (existingItem) {
           set({
             items: currentItems.map((item) => 
               item.id === data.id ? { ...item, quantity: item.quantity + data.quantity, selected: true } : item
             )
           })
        } else {
          set({ items: [...get().items, { ...data, selected: true }] })
        }
      },
      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.id !== id)] })
      },
      updateQuantity: (id: string, quantity: number) => {
          if (quantity < 1) return;
          set({
              items: get().items.map(item => 
                  item.id === id ? { ...item, quantity } : item
              )
          })
      },
      toggleItem: (id: string) => {
          set({
              items: get().items.map(item => 
                  item.id === id ? { ...item, selected: !item.selected } : item
              )
          })
      },
      toggleAll: (selected: boolean) => {
          set({
              items: get().items.map(item => ({ ...item, selected }))
          })
      },
      clearCart: () => set({ items: [], couponCode: null, discountAmount: 0 }),
      getTotals: () => {
          const items = get().items.filter(i => i.selected) // Only calculate selected
          const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)
          
          let totalActualWeight = 0
          let totalVolumetricWeight = 0

          items.forEach(item => {
              const qty = item.quantity
              totalActualWeight += (item.weight * qty)
              
              const volWeight = ((item.length * item.width * item.height) / 4000) * qty
              totalVolumetricWeight += volWeight
          })

          // For furniture, use actual weight since volumetric is too high for large items
          const finalDetailWeight = totalActualWeight
          const isHeavyCargo = finalDetailWeight >= 50
          
          // Discount calculation cap
          let discount = get().discountAmount
          if (discount > subtotal) discount = subtotal
          const total = subtotal - discount

          return {
              subtotal,
              discountAmount: discount,
              total,
              totalActualWeight,
              totalVolumetricWeight,
              finalDetailWeight,
              isHeavyCargo
          }
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
