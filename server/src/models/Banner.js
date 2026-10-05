import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: {
    url: { type: String, default: '' },
    secureUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  ctaLabel: { type: String, default: '' },
  ctaUrl: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
}, { timestamps: true });

bannerSchema.index({ active: 1, displayOrder: 1 });

export default mongoose.model('Banner', bannerSchema);
