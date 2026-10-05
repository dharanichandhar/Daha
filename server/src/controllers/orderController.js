import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import StoreSettings from '../models/StoreSettings.js';
import { AppError } from '../middleware/error.js';
import { sendEmail } from '../config/mailer.js';
import env from '../config/env.js';
import crypto from 'crypto';

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DAHA-${timestamp}${random}`;
};

const cleanNumber = (value) => String(value || '').replace(/[^0-9]/g, '');

const formatWhatsAppMessage = (order) => {
  const address = order.shippingAddress || {};
  const lines = [];
  lines.push('Hello DAHA Clothing Store!');
  lines.push('I would like to place an order:');
  lines.push('');
  lines.push('ORDER DETAILS');
  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName}`);
    lines.push(`Size: ${item.size} | Colour: ${item.color} | Qty: ${item.quantity}`);
    lines.push(`Price: Rs.${item.unitPrice} | Total: Rs.${item.lineTotal}`);
    lines.push(`Product Link: ${env.CLIENT_URL}/product/${item.productSlug}`);
    if (item.productImage) lines.push(`Product Image: ${item.productImage}`);
  });
  lines.push('');
  lines.push(`Subtotal: Rs.${order.subtotal}`);
  if (order.discount > 0) lines.push(`Discount (${order.coupon?.code || ''}): -Rs.${order.discount}`);
  if (order.shippingCharge > 0) lines.push(`Shipping: Rs.${order.shippingCharge}`);
  lines.push(`TOTAL: Rs.${order.total}`);
  lines.push('');
  lines.push('CUSTOMER DETAILS');
  lines.push(`Name: ${address.fullName || order.customerSnapshot?.name || '-'}`);
  lines.push(`Phone: ${address.phone || order.customerWhatsAppNumber || '-'}`);
  if (order.customerSnapshot?.email) lines.push(`Email: ${order.customerSnapshot.email}`);
  const addressParts = [address.addressLine1, address.addressLine2, address.landmark, address.city, address.state, address.pinCode].filter(Boolean).join(', ');
  lines.push(`Address: ${addressParts || '-'}`);
  lines.push('');
  lines.push('Please confirm my order. Thank you!');
  return lines.join('\n');
};

const buildWhatsAppLink = (order, settings = {}) => {
  const number = order.storeWhatsAppNumber || settings.whatsappNumber || settings.socialLinks?.whatsapp || 'YOUR_WHATSAPP_NUMBER';
  const clean = cleanNumber(number);
  const message = formatWhatsAppMessage(order);
  return { number: clean, message, url: `https://wa.me/${clean}?text=${encodeURIComponent(message)}` };
};

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, couponCode } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pinCode) {
      throw new AppError('Complete shipping address is required', 400);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || product.publishStatus !== 'active') {
        throw new AppError(`Product "${item.productName}" is no longer available`, 400);
      }

      const variant = product.variants.id(item.variant);
      if (!variant || !variant.active || variant.stock < item.quantity) {
        throw new AppError(`${item.productName} (${item.color} / ${item.size}) is out of stock`, 400);
      }

      const unitPrice = variant.priceOverride || product.sellingPrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0]?.url || '',
        sku: variant.sku,
        size: item.size,
        color: item.color,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const settings = await StoreSettings.findOne() || {};
    const freeShippingThreshold = settings.freeShippingThreshold || 999;
    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : (settings.shippingCharge || 0);

    let discount = 0;
    if (couponCode) {
      const Coupon = (await import('../models/Coupon.js')).default;
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon && new Date(coupon.expiryDate) > new Date()) {
        if (subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            discount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
          coupon.usageCount += 1;
          await coupon.save();
        }
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCharge);

    const storeWhatsAppNumber = settings.whatsappNumber || settings.socialLinks?.whatsapp || 'YOUR_WHATSAPP_NUMBER';

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      source: 'whatsapp',
      user: req.user._id,
      customerSnapshot: {
        name: req.user.name,
        email: req.user.email,
        phone: shippingAddress.phone,
      },
      customerWhatsAppNumber: shippingAddress.phone || req.user.phone || '',
      storeWhatsAppNumber,
      shippingAddress,
      items: orderItems,
      subtotal,
      discount,
      shippingCharge,
      total,
      coupon: couponCode ? { code: couponCode, discountAmount: discount } : undefined,
      payment: { provider: 'whatsapp', status: 'not_applicable' },
      orderStatus: 'pending_confirmation',
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    const whatsapp = buildWhatsAppLink(order, settings);

    res.status(201).json({ order, whatsapp });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({ orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) throw new AppError('Order not found', 404);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const getOrderSuccess = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) throw new AppError('Order not found', 404);
    const settings = await StoreSettings.findOne() || {};
    const whatsapp = buildWhatsAppLink(order, settings);
    res.json({ order, whatsapp });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) throw new AppError('Order not found', 404);
    res.json({ order: { orderNumber: order.orderNumber, statusHistory: order.statusHistory, orderStatus: order.orderStatus, trackingNumber: order.trackingNumber } });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetailAdmin = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404);

    const validTransitions = {
      pending_confirmation: ['confirmed', 'cancelled'],
      placed: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'cancelled'],
      packed: ['ready', 'cancelled'],
      ready: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
      returned: ['refunded'],
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      throw new AppError(`Cannot transition from ${order.orderStatus} to ${status}`, 400);
    }

    const previousStatus = order.orderStatus;
    const stockWasReserved = ['confirmed', 'packed', 'ready', 'shipped', 'out_for_delivery'].includes(previousStatus);

    if (status === 'confirmed') {
      const shortages = [];
      for (const item of order.items) {
        const product = await Product.findById(item.productId).select('name variants');
        const variant = product?.variants.id(item.variantId);
        if (!variant || variant.stock < item.quantity) {
          shortages.push(`${product?.name || item.productName} (${item.color} / ${item.size})`);
        }
      }
      if (shortages.length) {
        throw new AppError(`Insufficient stock to confirm. Not enough units for: ${shortages.join(', ')}`, 409);
      }
      for (const item of order.items) {
        const result = await Product.updateOne(
          { _id: item.productId, 'variants._id': item.variantId, 'variants.stock': { $gte: item.quantity } },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
        if (result.modifiedCount === 0) {
          throw new AppError(`Stock changed for ${item.productName} (${item.color} / ${item.size}); please retry`, 409);
        }
      }
    }

    order.orderStatus = status;
    order.statusHistory.push({ status, note, updatedBy: req.user._id });

    if (status === 'cancelled' && stockWasReserved) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      }
    }

    await order.save();
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const updateTracking = async (req, res, next) => {
  try {
    const { trackingNumber } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError('Order not found', 404);

    order.trackingNumber = trackingNumber;
    await order.save();

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const liveStatuses = ['confirmed', 'packed', 'ready', 'shipped', 'out_for_delivery'];
    const valueFilter = { orderStatus: { $nin: ['cancelled', 'refunded'] } };
    const todayValueFilter = { createdAt: { $gte: today }, orderStatus: { $nin: ['cancelled', 'refunded'] } };

    const [
      todayValue,
      totalValue,
      totalOrders,
      pendingConfirmations,
      activeOrders,
      deliveredOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: todayValueFilter },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: valueFilter },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending_confirmation' }),
      Order.countDocuments({ orderStatus: { $in: liveStatuses } }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      (await import('../models/Product.js')).default.countDocuments(),
      (await import('../models/User.js')).default.countDocuments({ role: 'customer' }),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.json({
      stats: {
        todayValue: todayValue[0]?.total || 0,
        totalValue: totalValue[0]?.total || 0,
        totalOrders,
        pendingConfirmations,
        activeOrders,
        deliveredOrders,
        totalProducts,
        totalCustomers,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};
