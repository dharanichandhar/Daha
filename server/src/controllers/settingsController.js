import StoreSettings from '../models/StoreSettings.js';
import AuditLog from '../models/AuditLog.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create({});
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = new StoreSettings();

    Object.assign(settings, req.body);
    await settings.save();

    await AuditLog.create({
      admin: req.user._id, action: 'updated', entity: 'StoreSettings',
      metadata: { fields: Object.keys(req.body) },
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
};
