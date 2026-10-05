import Product from '../models/Product.js';
import { AppError } from '../middleware/error.js';
import slugify from 'slugify';
import AuditLog from '../models/AuditLog.js';

const decorateProduct = (product) => {
  if (!product) return product;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images) ? [...product.images] : [];
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const primaryImage = images.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))[0] || null;
  const stockStatus = totalStock === 0 ? 'out_of_stock' : totalStock <= 3 ? 'low_stock' : 'in_stock';
  const sellingPrice = Number(product.sellingPrice || 0);
  const mrpPrice = Number(product.mrpPrice || 0);
  const discount = mrpPrice > sellingPrice && mrpPrice > 0
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;

  return { ...product, totalStock, primaryImage, stockStatus, discount };
};


export const getProducts = async (req, res, next) => {
  try {
    const {
      category, search, minPrice, maxPrice, size, color,
      isNew, isFeatured, isBestSeller, inStock,
      sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const query = { publishStatus: 'active', seedSource: { $ne: 'development' } };

    if (category) {
      const Category = (await import('../models/Category.js')).default;
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    if (size) query['variants.size'] = size;
    if (color) query['variants.color'] = color;

    if (isNew === 'true') query.isNew = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;

    if (inStock === 'true') {
      query['variants.stock'] = { $gt: 0 };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { sellingPrice: 1 },
      price_desc: { sellingPrice: -1 },
      featured: { isFeatured: -1, createdAt: -1 },
      bestseller: { isBestSeller: -1, createdAt: -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .lean();

    res.json({
      products: products.map(decorateProduct),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const query = { publishStatus: 'active', isNew: true, seedSource: { $ne: 'development' } };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .lean();

    res.json({ products: products.map(decorateProduct), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getFeatured = async (req, res, next) => {
  try {
    const products = await Product.find({ publishStatus: 'active', isFeatured: true, seedSource: { $ne: 'development' } })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('category', 'name slug')
      .lean();
    res.json({ products: products.map(decorateProduct) });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, seedSource: { $ne: 'development' } })
      .populate('category', 'name slug')
      .lean();

    if (!product) throw new AppError('Product not found', 404);
    res.json({ product: decorateProduct(product) });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, seedSource: { $ne: 'development' } });
    if (!product) throw new AppError('Product not found', 404);

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      publishStatus: 'active',
      seedSource: { $ne: 'development' },
    })
      .sort({ isBestSeller: -1, createdAt: -1 })
      .limit(6)
      .populate('category', 'name slug')
      .lean();

    res.json({ products: related.map(decorateProduct) });
  } catch (error) {
    next(error);
  }
};

export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const { search, category, isNew, isFeatured, publishStatus, inStock, sort = 'newest', page = 1, limit = 20 } = req.query;

    const query = { seedSource: { $ne: 'development' } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (isNew === 'true') query.isNew = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (publishStatus) query.publishStatus = publishStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sort === 'newest' ? { createdAt: -1 } : { name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .lean();

    res.json({ products: products.map(decorateProduct), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data.name || !data.sku || !data.category || !data.sellingPrice || !data.mrpPrice) {
      throw new AppError('Name, SKU, category, selling price and MRP are required', 400);
    }

    const slug = slugify(data.name, { lower: true, strict: true });
    const slugExists = await Product.findOne({ slug });
    if (slugExists) {
      data.slug = slug + '-' + Date.now().toString(36);
    } else {
      data.slug = slug;
    }

    const skuExists = await Product.findOne({ sku: data.sku });
    if (skuExists) throw new AppError('SKU already exists', 400);

    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        if (!v.sku) v.sku = `${data.sku}-${v.color?.substring(0, 3).toUpperCase()}-${v.size}`;
      }
    }

    const product = await Product.create(data);

    await AuditLog.create({
      admin: req.user._id, action: 'created', entity: 'Product', entityId: product._id,
      metadata: { name: product.name, sku: product.sku },
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    const data = req.body;

    if (data.name && data.name !== product.name) {
      const slug = slugify(data.name, { lower: true, strict: true });
      const slugExists = await Product.findOne({ slug, _id: { $ne: product._id } });
      data.slug = slugExists ? slug + '-' + Date.now().toString(36) : slug;
    }

    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        if (!v.sku) v.sku = `${product.sku}-${v.color?.substring(0, 3).toUpperCase()}-${v.size}`;
      }
    }

    Object.assign(product, data);
    await product.save();

    await AuditLog.create({
      admin: req.user._id, action: 'updated', entity: 'Product', entityId: product._id,
      metadata: { name: product.name },
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    product.publishStatus = product.publishStatus === 'archived' ? 'active' : 'archived';
    await product.save();

    await AuditLog.create({
      admin: req.user._id, action: product.publishStatus === 'archived' ? 'archived' : 'unarchived',
      entity: 'Product', entityId: product._id, metadata: { name: product.name },
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    if (product.seedSource === 'development') {
      await product.deleteOne();
    } else {
      const Order = (await import('../models/Order.js')).default;
      const hasOrders = await Order.countDocuments({ 'items.productId': product._id });
      if (hasOrders > 0) {
        throw new AppError('Cannot delete product with existing orders. Archive instead.', 400);
      }
      await product.deleteOne();
    }

    await AuditLog.create({
      admin: req.user._id, action: 'deleted', entity: 'Product', entityId: product._id,
      metadata: { name: product.name },
    });

    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
