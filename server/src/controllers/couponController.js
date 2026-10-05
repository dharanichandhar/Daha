import Coupon from '../models/Coupon.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/error.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) throw new AppError('Coupon code is required', 400);

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) throw new AppError('Invalid coupon code', 400);

    if (new Date(coupon.expiryDate) < new Date()) throw new AppError('Coupon has expired', 400);
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);
    if (subtotal && subtotal < coupon.minOrderAmount) throw new AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.min(((subtotal || 0) * coupon.discountValue) / 100, coupon.maxDiscount || Infinity);
    } else {
      discount = Math.min(coupon.discountValue, subtotal || Infinity);
    }

    res.json({ coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount: Math.round(discount) } });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);

    await AuditLog.create({
      admin: req.user._id, action: 'created', entity: 'Coupon', entityId: coupon._id,
      metadata: { code: coupon.code },
    });

    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) throw new AppError('Coupon not found', 404);

    await AuditLog.create({
      admin: req.user._id, action: 'updated', entity: 'Coupon', entityId: coupon._id,
      metadata: { code: coupon.code },
    });

    res.json({ coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    await AuditLog.create({
      admin: req.user._id, action: 'deleted', entity: 'Coupon', entityId: coupon._id,
      metadata: { code: coupon.code },
    });

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
