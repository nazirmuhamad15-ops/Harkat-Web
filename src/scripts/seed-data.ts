
import 'dotenv/config';
import { db } from '@/lib/db-drizzle';
import { 
  users, 
  products, 
  productVariants, 
  orders, 
  orderItems, 
  categories 
} from '@/db/schema';
import { createId } from '@paralleldrive/cuid2';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create User
    const userId = createId();
    await db.insert(users).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '081234567890',
      role: 'CUSTOMER',
      password: 'hashed_password', // Dummy
      emailVerified: true
    }).onConflictDoNothing();
    
    console.log('✅ User created');

    // 2. Create Category
    const categoryId = createId();
    await db.insert(categories).values({
      id: categoryId,
      name: 'Furniture Living',
      description: 'Living room essentials'
    }).onConflictDoNothing();

    // 3. Create Product
    const productId = createId();
    await db.insert(products).values({
      id: productId,
      name: 'Minimalist Sofa',
      slug: 'minimalist-sofa',
      category: 'Furniture Living',
      description: 'Comfortable sofa',
      status: 'ACTIVE'
    }).onConflictDoNothing();

    // 4. Create Variant
    const variantId = createId();
    await db.insert(productVariants).values({
      id: variantId,
      productId: productId,
      sku: 'SOFA-MIN-001',
      price: 2500000,
      costPrice: 1500000,
      stockCount: 10
    }).onConflictDoNothing();

    console.log('✅ Product created');

    // 5. Create Orders (Past 7 days)
    for (let i = 0; i < 5; i++) {
        const orderId = createId();
        const total = 2500000 * (i + 1);
        
        await db.insert(orders).values({
            id: orderId,
            orderNumber: `ORD-${Date.now()}-${i}`,
            userId: userId,
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '081234567890',
            status: i % 2 === 0 ? 'PAID' : 'PENDING', // Mix status
            paymentStatus: i % 2 === 0 ? 'PAID' : 'PENDING',
            total: total,
            subtotal: total,
            shippingCost: 0,
            volumetricWeight: 10,
            finalWeight: 10,
            shippingAddress: 'Jl. Contoh No. 1, Jakarta',
            createdAt: new Date(Date.now() - i * 86400000) // i days ago
        });

        await db.insert(orderItems).values({
            orderId: orderId,
            productVariantId: variantId,
            quantity: i + 1,
            unitPrice: 2500000,
            total: total
        });
    }

    console.log('✅ Dummy Orders created');
    console.log('🚀 Seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
