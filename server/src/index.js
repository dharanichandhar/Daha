import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import env from './config/env.js';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { configureMailer } from './config/mailer.js';
import { createRequestHandler } from '@react-router/express';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/orders.js';
import couponRoutes from './routes/coupons.js';
import bannerRoutes from './routes/banners.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

import { errorHandler, notFound } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(cookieParser(env.COOKIE_SECRET || 'daha-cookie-secret'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

if (env.NODE_ENV === 'production' && env.SERVE_STOREFRONT !== 'false') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientBuildDir = path.resolve(__dirname, '../../client/build/client');
  const serverBuild = await import('../../client/build/server/index.js');

  app.use(
    express.static(clientBuildDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      },
    })
  );

  const requestHandler = createRequestHandler({
    build: serverBuild,
    mode: 'production',
  });

  app.all('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return requestHandler(req, res, next);
  });
}

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    if (!env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is missing. Copy server/.env.example to server/.env and set a strong JWT secret.'
      );
    }

    await connectDB();
    configureCloudinary();
    configureMailer();

    app.listen(env.PORT, () => {
      console.log(`DAHA Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error(`DAHA Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

start();

export default app;
