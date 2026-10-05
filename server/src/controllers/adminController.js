import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const liveStatuses = ['confirmed', 'packed', 'ready', 'shipped', 'out_for_delivery'];
    const valueFilter = { orderStatus: { $nin: ['cancelled', 'refunded'] } };
    const todayValueFilter = { createdAt: { $gte: today }, orderStatus: { $nin: ['cancelled', 'refunded'] } };

    const [todayValue, totalValue, totalOrders, pendingConfirmations, activeOrders, deliveredOrders, totalProducts, totalCustomers, lowStockProducts, outOfStockProducts, recentOrders] = await Promise.all([
      Order.aggregate([{ $match: todayValueFilter }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: valueFilter }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending_confirmation' }),
      Order.countDocuments({ orderStatus: { $in: liveStatuses } }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Product.countDocuments({ seedSource: { $ne: 'development' } }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ seedSource: { $ne: 'development' }, publishStatus: 'active', $expr: { $and: [{ $gt: [{ $sum: '$variants.stock' }, 0] }, { $lte: [{ $sum: '$variants.stock' }, 3] }] } }),
      Product.countDocuments({ seedSource: { $ne: 'development' }, publishStatus: 'active', $expr: { $eq: [{ $sum: '$variants.stock' }, 0] } }),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.json({
      stats: {
        todayValue: todayValue[0]?.total || 0,
        totalValue: totalValue[0]?.total || 0,
        totalOrders, pendingConfirmations, activeOrders, deliveredOrders, totalProducts, totalCustomers,
        lowStockProducts, outOfStockProducts,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (req, res, next) => {
  try {
    const { search, category, lowStock, outOfStock, page = 1, limit = 50 } = req.query;

    const products = await Product.find({ seedSource: { $ne: 'development' } })
      .populate('category', 'name slug')
      .sort({ name: 1 })
      .lean();

    let inventory = [];
    for (const product of products) {
      for (const variant of (product.variants || [])) {
        inventory.push({
          productId: product._id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          image: product.images?.[0]?.url || '',
          variantId: variant._id,
          color: variant.color,
          colorHex: variant.colorHex,
          size: variant.size,
          sku: variant.sku,
          stock: variant.stock,
          stockStatus: variant.stock === 0 ? 'out_of_stock' : variant.stock <= 3 ? 'low_stock' : 'in_stock',
        });
      }
    }

    if (search) {
      const s = search.toLowerCase();
      inventory = inventory.filter(i => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    }
    if (lowStock === 'true') inventory = inventory.filter(i => i.stockStatus === 'low_stock');
    if (outOfStock === 'true') inventory = inventory.filter(i => i.stockStatus === 'out_of_stock');

    const total = inventory.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    inventory = inventory.slice(skip, skip + parseInt(limit));

    res.json({ inventory, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const adjustInventory = async (req, res, next) => {
  try {
    const { productId, variantId, stock } = req.body;

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    const variant = product.variants.id(variantId);
    if (!variant) throw new AppError('Variant not found', 404);

    const oldStock = variant.stock;
    variant.stock = Math.max(0, stock);
    await product.save();

    await AuditLog.create({
      admin: req.user._id, action: 'stock_adjusted', entity: 'Product', entityId: product._id,
      metadata: { variant: `${variant.color}/${variant.size}`, from: oldStock, to: variant.stock },
    });

    res.json({ message: 'Stock updated', variant });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments();

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('admin', 'name email')
      .lean();

    res.json({ logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};
