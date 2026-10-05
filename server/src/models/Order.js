import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  productImage: { type: String, default: '' },
  sku: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  source: { type: String, enum: ['web', 'whatsapp'], default: 'whatsapp' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerSnapshot: {
    name: String,
    email: String,
    phone: String,
  },
  customerWhatsAppNumber: { type: String, default: '' },
  storeWhatsAppNumber: { type: String, default: '' },
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pinCode: String,
    country: { type: String, default: 'India' },
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  coupon: {
    code: String,
    discountAmount: { type: Number, default: 0 },
  },
  payment: {
    provider: { type: String, default: 'whatsapp' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'pending_manual', 'not_applicable', 'failed', 'refunded'],
      default: 'not_applicable',
    },
  },
  orderStatus: {
    type: String,
    enum: ['pending_confirmation', 'placed', 'confirmed', 'packed', 'ready', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending_confirmation',
  },
  trackingNumber: { type: String, default: '' },
  statusHistory: [statusHistorySchema],
}, { timestamps: true });

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ source: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ storeWhatsAppNumber: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.orderStatus || 'pending_confirmation',
      timestamp: new Date(),
    }];
  }
  next();
});

export default mongoose.model('Order', orderSchema);
