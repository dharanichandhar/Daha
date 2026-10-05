import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';

const SEED_SOURCE = 'development';

const run = async () => {
  await connectDB();
  const connection = mongoose.connection;
  if (!connection.readyState) {
    console.error('MongoDB not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }

  const productResult = await Product.deleteMany({ seedSource: SEED_SOURCE });
  console.log(`Cleared dev seed data:`);
  console.log(`  Products removed: ${productResult.deletedCount}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Clear seed failed:', err);
  process.exit(1);
});
