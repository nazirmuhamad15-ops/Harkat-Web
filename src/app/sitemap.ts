import { db } from '@/lib/db-drizzle';
import { products, categories } from '@/db/schema';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://harkatfurniture.web.id';

  // Static routes
  const routes = [
    '',
    '/catalog',
    '/track-order',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // Fetch categories
  const allCategories = await db.select().from(categories);
  const categoryRoutes = allCategories
    .filter((category) => category.slug) // Filter out undefined slugs
    .map((category) => ({
      url: `${baseUrl}/catalog/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Fetch products
  const allProducts = await db.select().from(products);
  const productRoutes = allProducts
    .filter((product) => product.slug) // Filter out undefined slugs
    .map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

  return [...routes, ...categoryRoutes, ...productRoutes];
}
