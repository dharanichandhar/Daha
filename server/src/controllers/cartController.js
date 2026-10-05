import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/error.js';

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name slug sellingPrice mrpPrice images variants');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const validItems = cart.items.filter((item) => {
      if (!item.product) return false;
      const product = item.product;
      if (product.publishStatus !== 'active') return false;
      const variant = product.variants?.id(item.variant);
      if (!variant || !variant.active) return false;
      return true;
    });

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({ cart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, size, color, quantity = 1 } = req.body;

    if (!productId || !variantId || !size || !color) {
      throw new AppError('Product, variant, size and color are required', 400);
    }

    const product = await Product.findById(productId);
    if (!product || product.publishStatus !== 'active') {
      throw new AppError('Product not found or unavailable', 404);
    }

    const variant = product.variants.id(variantId);
    if (!variant || !variant.active) {
      throw new AppError('Variant not available', 400);
    }

    if (variant.stock < quantity) {
      throw new AppError(`Only ${variant.stock} items available in ${color} / ${size}`, 400);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.variant.toString() === variantId
    );

    const price = variant.priceOverride || product.sellingPrice;
    const primaryImage = product.images?.[0]?.url || '';

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > variant.stock) {
        throw new AppError(`Only ${variant.stock} items available`, 400);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        size,
        color,
        quantity,
        price,
        productName: product.name,
        productSlug: product.slug,
        productImage: primaryImage,
        sku: variant.sku,
      });
    }

    await cart.save();
    res.json({ cart, message: 'Added to cart' });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) throw new AppError('Valid quantity is required', 400);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = cart.items.id(itemId);
    if (!item) throw new AppError('Cart item not found', 404);

    const product = await Product.findById(item.product);
    const variant = product?.variants?.id(item.variant);

    if (!variant || variant.stock < quantity) {
      throw new AppError(`Only ${variant?.stock || 0} items available`, 400);
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ cart });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) throw new AppError('Cart not found', 404);

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();

    res.json({ cart });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
