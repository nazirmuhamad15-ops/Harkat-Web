import { CategoryTiles } from '@/components/category-tiles'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { desc } from 'drizzle-orm'

// Helper to slugify name
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
}

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const data = await db.query.categories.findMany({
    orderBy: desc(categories.createdAt)
  })

  // Transform DB data to match UI component expectation
  const categoriesList = data.map(c => ({
    name: c.name,
    slug: slugify(c.name),
    image: c.image || 'https://placehold.co/600x600/f5f5f5/333?text=' + encodeURIComponent(c.name)
  }))

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-stone-900 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#0058A3] mb-8">Kategori Produk</h1>
        <p className="text-stone-600 max-w-2xl mb-12">
            Temukan inspirasi dan perabot yang tepat untuk setiap sudut rumah Anda. Jelajahi koleksi kami berdasarkan ruangan.
        </p>

        <CategoryTiles categories={categoriesList} />
      </div>
    </div>
  )
}
