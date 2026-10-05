import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  secureUrl: { type: String, default: '' },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  sourceType: { type: String, enum: ['unsplash', 'cloudinary', 'upload'], default: 'cloudinary' },
}, { _id: true });

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorHex: { type: String, default: '#000000' },
  size: { type: String, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 },
  priceOverride: { type: Number, default: null },
  active: { type: Boolean, default: true },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  sku: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  images: [imageSchema],
  sellingPrice: { type: Number, required: true, min: 0 },
  mrpPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  material: { type: String, default: '' },
  fit: { type: String, default: '' },
  careInstructions: { type: String, default: '' },
  sizeGuide: { type: String, default: '' },
  variants: [variantSchema],
  isNew: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  publishStatus: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  seedSource: { type: String, default: '' },
  seedKey: { type: String, default: '' },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
}, { timestamps: true });

productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ publishStatus: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ seedSource: 1 });
productSchema.index({ seedKey: 1 });
productSchema.index({ name: 'text', shortDescription: 'text' });

productSchema.virtual('totalStock').get(function () {
  if (!this.variants || this.variants.length === 0) return 0;
  return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  return this.images.sort((a, b) => a.sortOrder - b.sortOrder)[0];
});

productSchema.virtual('stockStatus').get(function () {
  const total = this.totalStock;
  if (total === 0) return 'out_of_stock';
  if (total <= 3) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('discount').get(function () {
  if (this.mrpPrice <= this.sellingPrice) return 0;
  return Math.round(((this.mrpPrice - this.sellingPrice) / this.mrpPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
