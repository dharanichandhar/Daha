import Category from '../models/Category.js';
import { AppError } from '../middleware/error.js';
import slugify from 'slugify';
import AuditLog from '../models/AuditLog.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ displayOrder: 1 }).lean();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 }).lean();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, active: true }).lean();
    if (!category) throw new AppError('Category not found', 404);
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, parentCategory, displayOrder, seo } = req.body;

    if (!name) throw new AppError('Category name is required', 400);

    const slug = slugify(name, { lower: true, strict: true });
    const exists = await Category.findOne({ slug });
    if (exists) throw new AppError('Category with this name already exists', 400);

    const category = await Category.create({
      name, slug, description, image, parentCategory, displayOrder, seo,
    });

    await AuditLog.create({
      admin: req.user._id, action: 'created', entity: 'Category', entityId: category._id,
      metadata: { name },
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, parentCategory, displayOrder, active, seo } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) throw new AppError('Category not found', 404);

    if (name && name !== category.name) {
      const slug = slugify(name, { lower: true, strict: true });
      const exists = await Category.findOne({ slug, _id: { $ne: category._id } });
      if (exists) throw new AppError('Category name already in use', 400);
      category.name = name;
      category.slug = slug;
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (active !== undefined) category.active = active;
    if (seo !== undefined) category.seo = seo;

    await category.save();

    await AuditLog.create({
      admin: req.user._id, action: 'updated', entity: 'Category', entityId: category._id,
      metadata: { name: category.name },
    });

    res.json({ category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError('Category not found', 404);

    const Product = (await import('../models/Product.js')).default;
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      throw new AppError(`Cannot delete category with ${productCount} products`, 400);
    }

    await category.deleteOne();

    await AuditLog.create({
      admin: req.user._id, action: 'deleted', entity: 'Category', entityId: category._id,
      metadata: { name: category.name },
    });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

export const reorderCategory = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) throw new AppError('Order array is required', 400);

    for (const item of order) {
      await Category.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder });
    }

    res.json({ message: 'Categories reordered' });
  } catch (error) {
    next(error);
  }
};
