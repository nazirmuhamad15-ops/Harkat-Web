import 'dotenv/config';
console.log('🔗 DB URL check:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');

import { db } from '../src/lib/db-drizzle';
import { users, products, orders, orderItems, productVariants } from '../src/db/schema';
import Database from 'better-sqlite3';
import { createId } from '@paralleldrive/cuid2';

async function migrateData() {
  console.log('📦 Starting data migration from SQLite to Supabase...');

  // Open SQLite DB
  const sqliteDb = new Database('./prisma/db/custom.db');

  // 1. Migrate Users
  console.log('👤 Migrating Users...');
  const oldUsers = sqliteDb.prepare('SELECT * FROM users').all() as any[];
  if (oldUsers.length > 0) {
      await db.insert(users).values(oldUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
        phone: u.phone,
        isActive: u.isActive === 1 || u.isActive === true,
        emailVerified: u.emailVerified === 1 || u.emailVerified === true,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
      }))).onConflictDoNothing();
      console.log(`✅ Migrated ${oldUsers.length} users`);
  }

  // 2. Migrate Products
  console.log('🛍️ Migrating Products...');
  const oldProducts = sqliteDb.prepare('SELECT * FROM products').all() as any[];
  if (oldProducts.length > 0) {
      await db.insert(products).values(oldProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        images: p.images,
        isFragile: p.isFragile === 1 || p.isFragile === true,
        topSideUp: p.topSideUp === 1 || p.topSideUp === true,
        featured: p.featured === 1 || p.featured === true,
        status: p.status,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }))).onConflictDoNothing();
      console.log(`✅ Migrated ${oldProducts.length} products`);
  }

  // 3. Migrate Variants
  console.log('📦 Migrating Product Variants...');
  const oldVariants = sqliteDb.prepare('SELECT * FROM product_variants').all() as any[];
  if (oldVariants.length > 0) {
      await db.insert(productVariants).values(oldVariants.map(v => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        price: v.price,
        costPrice: v.costPrice,
        stockCount: v.stockCount,
        images: v.images,
        weight: v.weight,
        length: v.length,
        width: v.width,
        height: v.height,
        inStock: v.inStock === 1 || v.inStock === true,
        shelfLocation: v.shelfLocation,
        lowStockThreshold: v.lowStockThreshold,
        salesCount: v.salesCount,
        createdAt: new Date(v.createdAt),
        updatedAt: new Date(v.updatedAt)
      }))).onConflictDoNothing();
      console.log(`✅ Migrated ${oldVariants.length} variants`);
  }

  // 4. Migrate Orders
  console.log('📝 Migrating Orders...');
  const oldOrders = sqliteDb.prepare('SELECT * FROM orders').all() as any[];
  if (oldOrders.length > 0) {
      await db.insert(orders).values(oldOrders.map(o => ({
         id: o.id,
         orderNumber: o.orderNumber,
         userId: o.userId,
         customerName: o.customerName,
         customerEmail: o.customerEmail,
         customerPhone: o.customerPhone,
         shippingAddress: o.shippingAddress,
         billingAddress: o.billingAddress,
         subtotal: o.subtotal,
         shippingCost: o.shippingCost,
         volumetricWeight: o.volumetricWeight || 0,
         finalWeight: o.finalWeight || 0,
         total: o.total,
         status: o.status,
         paymentStatus: o.paymentStatus,
         paymentMethod: o.paymentMethod,
         trackingNumber: o.trackingNumber,
         createdAt: new Date(o.createdAt),
         updatedAt: new Date(o.updatedAt)
      }))).onConflictDoNothing();
      console.log(`✅ Migrated ${oldOrders.length} orders`);
  }

  // 5. Migrate Order Items
  console.log('🛒 Migrating Order Items...');
  const oldOrderItems = sqliteDb.prepare('SELECT * FROM order_items').all() as any[];
  if (oldOrderItems.length > 0) {
      await db.insert(orderItems).values(oldOrderItems.map(oi => ({
          id: oi.id,
          orderId: oi.orderId,
          productVariantId: oi.productVariantId,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
          total: oi.total
      }))).onConflictDoNothing();
      console.log(`✅ Migrated ${oldOrderItems.length} order items`);
  }

  // 6. Migrate Categories
  console.log('🏷️ Migrating Categories...');
  try {
    const oldCategories = sqliteDb.prepare('SELECT * FROM categories').all() as any[];
    if (oldCategories.length > 0) {
        const { categories: categoriesTable } = await import('../src/db/schema');
        await db.insert(categoriesTable).values(oldCategories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            image: c.image,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt)
        }))).onConflictDoNothing();
        console.log(`✅ Migrated ${oldCategories.length} categories`);
    }
  } catch (e) {
      console.log('⚠️ Skipping categories migration');
  }

  // 7. Migrate Attributes
  console.log('💎 Migrating Product Attributes...');
  try {
    const oldAttributes = sqliteDb.prepare('SELECT * FROM product_attributes').all() as any[];
    if (oldAttributes.length > 0) {
        const { productAttributes: attrTable } = await import('../src/db/schema');
        await db.insert(attrTable).values(oldAttributes.map(a => ({
            id: a.id,
            name: a.name
        }))).onConflictDoNothing();
        console.log(`✅ Migrated ${oldAttributes.length} attributes`);
    }

    const oldAttributeValues = sqliteDb.prepare('SELECT * FROM product_attribute_values').all() as any[];
    if (oldAttributeValues.length > 0) {
        const { productAttributeValues: valTable } = await import('../src/db/schema');
        await db.insert(valTable).values(oldAttributeValues.map(v => ({
            id: v.id,
            value: v.value,
            attributeId: v.attributeId
        }))).onConflictDoNothing();
        console.log(`✅ Migrated ${oldAttributeValues.length} attribute values`);
    }

    const oldVariantAttributes = sqliteDb.prepare('SELECT * FROM product_variant_attributes').all() as any[];
    if (oldVariantAttributes.length > 0) {
        const { productVariantAttributes: linkTable } = await import('../src/db/schema');
        await db.insert(linkTable).values(oldVariantAttributes.map(va => ({
            id: va.id,
            variantId: va.variantId,
            attributeValueId: va.attributeValueId
        }))).onConflictDoNothing();
        console.log(`✅ Migrated ${oldVariantAttributes.length} variant attributes`);
    }
  } catch (e) {
      console.log('⚠️ Error migrating attributes:', e);
  }

  console.log('🎉 Migration complete!');
}

migrateData().catch(console.error);
