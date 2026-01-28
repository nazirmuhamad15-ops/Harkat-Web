import { db } from '@/lib/db-drizzle'
import { products, productVariants, categories, banners } from '@/db/schema'
import { eq, like, desc, and, or, gte, asc } from 'drizzle-orm'

export interface ProductFilterParams {
  category?: string;
  featured?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const DataService = {
  async getProducts(params: ProductFilterParams) {
    const { category, featured, search, sort = 'bestseller', page = 1, limit = 12 } = params;

    // Build conditions
    const conditions = [eq(products.status, 'ACTIVE')]

    if (category && category !== 'all') {
      conditions.push(eq(products.category, category))
    }

    if (featured) {
      conditions.push(eq(products.featured, true))
    }

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      )
    }

    // Fetch products with variants
    // Note: Drizzle RQB currently doesn't support easy "where has related" filters efficiently
    // So we fetch active products and their 'inStock' variants
    const productsRaw = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        variants: {
          where: eq(productVariants.inStock, true),
          limit: 1, // Only need main variant for listing
        }
      },
      orderBy: desc(products.createdAt)
    })

    // Filter valid (has variants)
    const validProducts = productsRaw.filter(p => p.variants && p.variants.length > 0);

    // Transform
    const formattedProducts = validProducts.map(p => {
      const mainVariant = p.variants[0]
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        featured: p.featured,
        images: p.images, 
        
        // Variant Data
        price: mainVariant.price,
        comparePrice: mainVariant.price * 1.2, // Mock compare price 
        sku: mainVariant.sku,
        stockCount: mainVariant.stockCount,
        inStock: mainVariant.stockCount !== null && mainVariant.stockCount > 0,
        salesCount: mainVariant.salesCount || 0,
        
        weight: mainVariant.weight,
        length: mainVariant.length,
        width: mainVariant.width,
        height: mainVariant.height,
        variantId: mainVariant.id 
      }
    })

    // Sort in Memory (since price/sales are on variants/derived)
    if (sort === 'bestseller') {
      formattedProducts.sort((a, b) => b.salesCount - a.salesCount)
    } else if (sort === 'price-low') {
      formattedProducts.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-high') {
      formattedProducts.sort((a, b) => b.price - a.price)
    } else if (sort === 'name') {
      formattedProducts.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = formattedProducts.slice(startIndex, endIndex)

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: formattedProducts.length,
        pages: Math.ceil(formattedProducts.length / limit),
      }
    }
  },

  async getCategories() {
    const raw = await db.query.categories.findMany({
        // where: eq(categories.status, 'active') // Schema doesn't have status, removed
    })
    
    return raw.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/ /g, '-'),
        image: cat.image || '/placeholder.jpg',
        description: cat.description
    }))
  },

  async getBanners() {
    return await db.query.banners.findMany({
        where: eq(banners.isActive, true),
        orderBy: asc(banners.order)
    })
  }
}
