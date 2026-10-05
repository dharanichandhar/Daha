import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ active: 1 });

export default mongoose.model('Coupon', couponSchema);
