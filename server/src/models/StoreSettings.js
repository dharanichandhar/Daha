import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'DAHA Clothing Store' },
  tagline: { type: String, default: 'Style for Every Day, Right Here in Trichy.' },
  address: { type: String, default: 'YOUR_STORE_ADDRESS' },
  phone: { type: String, default: 'YOUR_STORE_PHONE' },
  supportEmail: { type: String, default: 'YOUR_STORE_EMAIL' },
  businessEmail: { type: String, default: 'YOUR_BUSINESS_EMAIL' },
  city: { type: String, default: 'Trichy' },
  state: { type: String, default: 'Tamil Nadu' },
  pin: { type: String, default: 'YOUR_PIN_CODE' },
  country: { type: String, default: 'India' },
  businessHours: { type: String, default: 'YOUR_BUSINESS_HOURS' },
  whatsappNumber: { type: String, default: 'YOUR_WHATSAPP_NUMBER' },
  googleMapsUrl: { type: String, default: 'YOUR_GOOGLE_MAPS_URL' },
  googleMapsEmbedUrl: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  socialLinks: {
    instagram: { type: String, default: 'YOUR_INSTAGRAM_URL' },
    facebook: { type: String, default: 'YOUR_FACEBOOK_URL' },
    whatsapp: { type: String, default: 'YOUR_WHATSAPP_NUMBER' },
    googleMaps: { type: String, default: 'YOUR_GOOGLE_MAPS_URL' },
  },
  shippingCharge: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 999 },
  lowStockThreshold: { type: Number, default: 3 },
  shippingPolicy: { type: String, default: '' },
  returnPolicy: { type: String, default: '' },
  seoDefaults: {
    title: { type: String, default: 'DAHA Clothing Store Trichy' },
    description: { type: String, default: 'Shop clothing for men, women and kids at DAHA Clothing Store in Trichy.' },
  },
}, { timestamps: true });

storeSettingsSchema.index({}, { unique: true });

export default mongoose.model('StoreSettings', storeSettingsSchema);
