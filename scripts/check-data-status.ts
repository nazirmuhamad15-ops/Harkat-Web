import 'dotenv/config';
import { db } from '../src/lib/db-drizzle';
import { products, productVariants } from '../src/db/schema';
import { count, eq, and } from 'drizzle-orm';

async function checkData() {
  const productCount = await db.select({ value: count() }).from(products);
  const activeProductCount = await db.select({ value: count() }).from(products).where(eq(products.status, 'ACTIVE'));
  const variantCount = await db.select({ value: count() }).from(productVariants);
  const inStockVariantCount = await db.select({ value: count() }).from(productVariants).where(eq(productVariants.inStock, true));

  console.log({
    totalProducts: productCount[0].value,
    activeProducts: activeProductCount[0].value,
    totalVariants: variantCount[0].value,
    inStockVariants: inStockVariantCount[0].value,
  });

  const conditions = [eq(products.status, 'ACTIVE')];
  
  const productsRaw = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      variants: {
        where: eq(productVariants.inStock, true),
        limit: 1,
      }
    }
  });

  console.log('API Simulation Count:', productsRaw.length);
  productsRaw.forEach(p => {
      console.log(`- Product: ${p.name}, Variants Count: ${p.variants.length}`);
  });

  const validProducts = productsRaw.filter(p => p.variants && p.variants.length > 0);
  console.log('Valid Products Count (Final):', validProducts.length);
}

checkData();
