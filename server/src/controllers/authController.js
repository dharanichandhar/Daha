import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, setAuthCookie } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { sendEmail } from '../config/mailer.js';
import env from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email and password are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      throw new AppError('Google credential is required', 400);
    }

    let payload;
    try {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (err) {
      throw new AppError('Invalid Google credential', 401);
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      user.googleId = googleId;
      if (!user.name && name) user.name = name;
      await user.save();
    } else {
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId,
        isActive: true,
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out' });
};

export const getMe = async (req, res) => {
  res.json({ user: req.user || null });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

      await sendEmail({
        to: user.email,
        subject: 'DAHA - Password Reset Request',
        html: `
          <div style="font-family: DM Sans, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #532646;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #532646; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
            <p style="color: #737373; font-size: 12px;">This link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
            <p style="color: #737373; font-size: 12px;">DAHA Clothing Store, Trichy</p>
          </div>
        `,
      });
    }

    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (exists) throw new AppError('Email already in use', 400);
      user.email = email.toLowerCase();
    }
    if (phone !== undefined) user.phone = phone;

    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
