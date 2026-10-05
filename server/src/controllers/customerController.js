import User from '../models/User.js';
import Order from '../models/Order.js';
import { AppError } from '../middleware/error.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const customers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const [orderCount, totalSpend, lastOrder] = await Promise.all([
          Order.countDocuments({ user: c._id }),
          Order.aggregate([
            { $match: { user: c._id, orderStatus: { $nin: ['cancelled', 'refunded'] } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ]),
          Order.findOne({ user: c._id }).sort({ createdAt: -1 }).select('createdAt total orderStatus').lean(),
        ]);
        return { ...c, orderCount, totalSpend: totalSpend[0]?.total || 0, lastOrder };
      })
    );

    res.json({ customers: customersWithStats, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetail = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).lean();
    if (!customer) throw new AppError('Customer not found', 404);

    const [orders, orderCount, totalSpend] = await Promise.all([
      Order.find({ user: customer._id }).sort({ createdAt: -1 }).lean(),
      Order.countDocuments({ user: customer._id }),
      Order.aggregate([
        { $match: { user: customer._id, orderStatus: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      customer: { ...customer, orderCount, totalSpend: totalSpend[0]?.total || 0 },
      orders,
    });
  } catch (error) {
    next(error);
  }
};
