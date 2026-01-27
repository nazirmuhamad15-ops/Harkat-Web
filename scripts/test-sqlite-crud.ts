import { getProducts } from '../src/db/index';

async function testCrud() {
  console.log('Testing SQLite CRUD...');
  try {
    const products = await getProducts();
    console.log(`Found ${products.length} products in custom.db:`);
    products.slice(0, 3).forEach(p => {
      console.log(`- [${p.id}] ${p.name} (${p.price})`);
    });
  } catch (error) {
    console.error('Error testing SQLite CRUD:', error);
  }
}

testCrud();
