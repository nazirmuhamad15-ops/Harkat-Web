const sharp = require('sharp');
const path = require('path');

async function createPlaceholders() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Create main placeholder
  await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 229, g: 231, b: 235, alpha: 1 }
    }
  })
  .jpeg({ quality: 80 })
  .toFile(path.join(publicDir, 'placeholder.jpg'));
  
  console.log('✓ Created placeholder.jpg');
  
  // Create products placeholder
  await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 229, g: 231, b: 235, alpha: 1 }
    }
  })
  .jpeg({ quality: 80 })
  .toFile(path.join(publicDir, 'products', 'placeholder.jpg'));
  
  console.log('✓ Created products/placeholder.jpg');
}

createPlaceholders()
  .then(() => console.log('Done!'))
  .catch(e => console.error('Error:', e));
