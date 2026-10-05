import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  image: {
    url: { type: String, default: '' },
    secureUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
}, { timestamps: true });

categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ displayOrder: 1 });

export default mongoose.model('Category', categorySchema);
