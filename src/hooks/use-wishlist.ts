import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WishlistItem {
  id: string
  name: string
  price: number
  image: string
  variantId?: string
  slug: string
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (data: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
}

export const useWishlist = create(
  persist<WishlistStore>(
    (set, get) => ({
      items: [],
      addItem: (data: WishlistItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === data.id)

        if (!existingItem) {
          set({ items: [...get().items, data] })
        }
      },
      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.id !== id)] })
      },
      isInWishlist: (id: string) => {
          return get().items.some((item) => item.id === id)
      }
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
