import mongoose from 'mongoose';
import slugify from 'slugify';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';

// Optional starter category names only. No demo clothing images or products are seeded.
// Admin can edit these categories or create completely new ones later.
const categories = [
  {
    name: 'Men',
    slug: 'men',
    description: '',
    displayOrder: 1,
    active: true,
    seo: { title: '', description: '' },
  },
  {
    name: 'Women',
    slug: 'women',
    description: '',
    displayOrder: 2,
    active: true,
    seo: { title: '', description: '' },
  },
  {
    name: 'Kids',
    slug: 'kids',
    description: '',
    displayOrder: 3,
    active: true,
    seo: { title: '', description: '' },
  },
];

const run = async () => {
  await connectDB();
  const connection = mongoose.connection;
  if (!connection.readyState) {
    console.error('MongoDB not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }

  for (const category of categories) {
    const slug = slugify(category.slug, { lower: true, strict: true });
    await Category.findOneAndUpdate(
      { slug },
      {
        $set: { ...category, slug },
        // Remove legacy starter/Unsplash category artwork so the storefront is clean
        // until an Admin explicitly uploads a category image.
        $unset: {
          'image.url': '',
          'image.secureUrl': '',
          'image.publicId': '',
          'image.alt': '',
          'image.altText': '',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log('Starter categories ready: Men, Women, Kids (no demo images/products).');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed categories failed:', err);
  process.exit(1);
});
