import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const run = async () => {
  await connectDB();
  if (!mongoose.connection.readyState) {
    console.error('MongoDB not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }

  // Only development/legacy demo products are removed. Admin-created products are preserved.
  const products = await Product.deleteMany({
    $or: [
      { seedSource: 'development' },
      { 'images.sourceType': 'unsplash', seedSource: { $ne: null } },
    ],
  });

  // Keep the three useful category records, but remove old starter Unsplash artwork.
  const categories = await Category.updateMany(
    { slug: { $in: ['men', 'women', 'kids'] } },
    {
      $set: {
        'image.url': '',
        'image.secureUrl': '',
        'image.publicId': '',
        'image.alt': '',
      },
    }
  );

  console.log('DAHA demo catalogue cleanup complete.');
  console.log(`  Demo products removed: ${products.deletedCount}`);
  console.log(`  Starter category images cleared: ${categories.modifiedCount}`);
  console.log('  Admin-created products were not targeted.');

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Demo catalogue cleanup failed:', error);
  process.exit(1);
});
