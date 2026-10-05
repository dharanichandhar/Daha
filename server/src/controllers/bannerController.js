import Banner from '../models/Banner.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middleware/error.js';

export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ displayOrder: 1 }).lean();
    res.json({ banners });
  } catch (error) {
    next(error);
  }
};

export const getAllBannersAdmin = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1 }).lean();
    res.json({ banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    await AuditLog.create({ admin: req.user._id, action: 'created', entity: 'Banner', entityId: banner._id });
    res.status(201).json({ banner });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) throw new AppError('Banner not found', 404);
    await AuditLog.create({ admin: req.user._id, action: 'updated', entity: 'Banner', entityId: banner._id });
    res.json({ banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) throw new AppError('Banner not found', 404);
    await AuditLog.create({ admin: req.user._id, action: 'deleted', entity: 'Banner', entityId: banner._id });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
};
