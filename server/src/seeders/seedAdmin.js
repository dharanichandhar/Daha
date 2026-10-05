import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import env from '../config/env.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();
  const connection = mongoose.connection;
  if (!connection.readyState) {
    console.error('MongoDB not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }

  const name = env.ADMIN_NAME;
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env');
    await mongoose.disconnect();
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          role: 'admin',
          isActive: true,
        },
      }
    );
    console.log(`Admin already exists. Updated admin role for ${email}.`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed admin failed:', err);
  process.exit(1);
});
