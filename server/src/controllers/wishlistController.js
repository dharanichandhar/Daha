import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/error.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    res.json({ wishlist });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found', 404);

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    const index = wishlist.products.findIndex((id) => id.toString() === productId);
    let action;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      action = 'removed';
    } else {
      wishlist.products.push(productId);
      action = 'added';
    }

    await wishlist.save();

    res.json({ action, wishlist });
  } catch (error) {
    next(error);
  }
};
